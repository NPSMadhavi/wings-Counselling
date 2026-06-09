import * as nodemailer from "nodemailer";
import { db } from "../config/db.js";
import { buildInterviewBookingLink, getCandidatePortalOrigin } from "./candidatePortalLinks.js";
import {
  recordFormSubmissionEmail,
  formatAppointmentEmailContent,
  formatApplicationEmailContent,
  formatVolunteerEmailContent,
} from "./formSubmissionEmailLog.js";

/**
 * Create email transporter — always uses Gmail SMTP with SSL (port 465).
 * Port 465 + secure:true is the most reliable configuration for Gmail App Passwords.
 */
function createTransporter({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function getTransporterCandidates() {
  const user = process.env.SMTP_USER ?? process.env.GMAIL_USER;
  const pass =
    process.env.SMTP_PASS ??
    process.env.SMTP_PASSWORD ??
    process.env.GMAIL_APP_PASSWORD ??
    process.env.GMAIL_PASS ??
    process.env.GMAIL_PASSWORD;
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT ?? "465", 10);
  const secure =
    process.env.SMTP_SECURE == null
      ? port === 465
      : String(process.env.SMTP_SECURE).toLowerCase() === "true";

  if (!user || !pass) {
    console.warn("[Email] No SMTP credentials configured (SMTP_USER / SMTP_PASS missing).");
    return [];
  }

  const candidates = [
    {
      host,
      port: Number.isFinite(port) ? port : 465,
      secure,
      label: "primary",
    },
  ];

  if ((Number.isFinite(port) ? port : 465) !== 587) {
    candidates.push({
      host,
      port: 587,
      secure: false,
      label: "fallback-587",
    });
  }

  return candidates.map((candidate) => ({
    ...candidate,
    transporter: createTransporter({
      host: candidate.host,
      port: candidate.port,
      secure: candidate.secure,
      user,
      pass,
    }),
  }));
}

/**
 * Try sending with each transporter candidate in order, stopping on first success.
 */
async function sendWithFallback(mailOptions) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    throw new Error("SMTP not configured");
  }
  let lastError = null;
  for (const candidate of transporters) {
    try {
      await candidate.transporter.sendMail(mailOptions);
      console.log(`[Email] Sent via ${candidate.label} (${candidate.host}:${candidate.port})`);
      return;
    } catch (err) {
      lastError = err;
      console.error(`[Email] Send failed via ${candidate.label} (${candidate.host}:${candidate.port}):`, err?.message);
    }
  }
  throw lastError || new Error("All SMTP transports failed");
}

function isValidEmail(email) {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function uniqueEmails(emails) {
  return Array.from(new Set(
    (emails || [])
      .map((email) => (typeof email === "string" ? email.trim().toLowerCase() : ""))
      .filter(isValidEmail)
  ));
}

async function getConfiguredEmailRecipients(type) {
  try {
    const [rows] = await db.execute(
      "SELECT email FROM email_recipients WHERE type = ? ORDER BY id ASC",
      [type]
    );

    return uniqueEmails(rows.map((row) => row.email));
  } catch (err) {
    console.warn("[Email] Unable to load configured email recipients:", err);
    return [];
  }
}

const FROM =
  process.env.EMAIL_FROM ??
  (process.env.SMTP_USER
    ? `WINGS Counselling Centre <${process.env.SMTP_USER}>`
    : "WINGS Counselling Centre <lavetimadhavilatha19@gmail.com>");

function normalizeMobileNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return "";

  const defaultCountryCode = process.env.TWILIO_DEFAULT_COUNTRY_CODE?.trim();
  if (defaultCountryCode) {
    const normalizedCountryCode = defaultCountryCode.startsWith("+")
      ? defaultCountryCode
      : `+${defaultCountryCode.replace(/\D/g, "")}`;

    return `${normalizedCountryCode}${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function getTwilioSmsConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber =
    process.env.TWILIO_FROM_NUMBER?.trim() ??
    process.env.TWILIO_FROM?.trim() ??
    process.env.TWILIO_PHONE_NUMBER?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  return { accountSid, authToken, fromNumber, messagingServiceSid };
}

/**
 * Send OTP via SMS (Twilio)
 */
export async function sendMobileOtpSms(to, otp, firstName) {
  const { accountSid, authToken, fromNumber, messagingServiceSid } =
    getTwilioSmsConfig();
  const mobileNumber = normalizeMobileNumber(to);

  if (!accountSid || !authToken) {
    console.log(`[Twilio Mock] Would have sent OTP ${otp} to ${mobileNumber}`);
    return true;
  }

  if (!mobileNumber) {
    throw new Error("A valid mobile number is required to send OTP SMS.");
  }

  if (!fromNumber && !messagingServiceSid) {
    return false;
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: mobileNumber,
    Body: `Hi ${firstName || "there"}, your WINGS verification code is ${otp}. It expires in 10 minutes.`,
  });

  if (messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
  } else {
    body.set("From", fromNumber);
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to send OTP SMS");
  }

  return true;
}

/**
 * Generate calming, mental health themed email wrapper
 */
function getMentalHealthEmailWrapper(content, title = "WINGS Counselling Centre") {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #e8f4f8 0%, #d9e8f0 100%); font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
      <!-- Main Container -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #e8f4f8 0%, #d9e8f0 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Email Card -->
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 0, 0, 0.05);">
              
              <!-- Soothing Header with Lotus/Mental Health Motif -->
              <tr>
                <td style="background: linear-gradient(135deg, #2c5f8a 0%, #1a3a5c 100%); padding: 40px 30px; text-align: center;">
                  <!-- Lotus / Calm Symbol -->
                  <div style="margin-bottom: 20px;">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L13.5 7.5L19 9L13.5 10.5L12 16L10.5 10.5L5 9L10.5 7.5L12 2Z" fill="#FFD700" stroke="#FFD700" stroke-width="1" stroke-linejoin="round"/>
                      <path d="M12 22L13 18L17 17L13 16L12 12L11 16L7 17L11 18L12 22Z" fill="#FFD700" stroke="#FFD700" stroke-width="0.5" stroke-linejoin="round"/>
                      <circle cx="12" cy="12" r="2" fill="#FFA500"/>
                    </svg>
                  </div>
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">WINGS</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px; font-weight: 300;">Counselling & Wellness Centre</p>
                  <div style="width: 60px; height: 3px; background: #FFD700; margin: 20px auto 0;"></div>
                </td>
              </tr>
              
              <!-- Calming Quote / Affirmation -->
              <tr>
                <td style="background: #f0f7fa; padding: 20px 30px; text-align: center; border-bottom: 1px solid #d4e4ed;">
                  <p style="margin: 0; color: #2c5f8a; font-size: 16px; font-style: italic; line-height: 1.5;">
                    "✨ Your mental health journey matters. We're here to support you every step of the way."
                  </p>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px 30px; background: #ffffff;">
                  ${content}
                </td>
              </tr>
              
              <!-- Helpful Resources Section -->
              <tr>
                <td style="background: #f9fbfd; padding: 30px; border-top: 1px solid #e8eef2;">
                  <h3 style="color: #2c5f8a; font-size: 18px; margin: 0 0 15px 0; text-align: center;">💚 Mental Health Resources</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0; color: #4a6a7f; font-size: 14px; text-align: center;">
                          📞 24/7 Crisis Helpline: <strong style="color: #2c5f8a;">1800-123-4567</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0; color: #4a6a7f; font-size: 14px; text-align: center;">
                          💬 WhatsApp Support: <strong style="color: #2c5f8a;">+65 9123 4567</strong>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <p style="margin: 0; color: #4a6a7f; font-size: 14px; text-align: center;">
                          🌙 Self-Care Tips: <a href="#" style="color: #FFD700; text-decoration: none;">Visit Our Blog</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #1a3a5c; padding: 30px; text-align: center;">
                  <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px 0; font-size: 13px;">
                    🕊️ You are not alone. We're here to listen, support, and guide you.
                  </p>
                  <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px;">
                    WINGS Counselling Centre | 123 Serenity Lane, Singapore 123456
                  </p>
                  <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px;">
                    📧 counselling@wings.org | 🌐 www.wingscounselling.org
                  </p>
                  <p style="color: rgba(255,255,255,0.4); margin: 20px 0 0 0; font-size: 11px;">
                    This email is confidential. If you're in crisis, please reach out to our helpline immediately.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseSubCounsellingTypes(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSubCounsellingTypesEmailTable(subTypes) {
  if (subTypes.length === 0) {
    return `
      <p style="margin: 12px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
        Our team will help you identify the most suitable support option during your first contact.
      </p>
    `;
  }

  const rows = subTypes
    .map(
      (name, index) => `
        <tr>
          <td style="padding: 14px 12px; border-bottom: 1px solid #e2e8f0; color: #0D4A7A; font-weight: 700; font-size: 14px; text-align: center; width: 48px; background: #f8fafc;">
            ${index + 1}
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 15px; font-weight: 500;">
            ${escapeHtml(name)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%);">
          <th style="padding: 12px; color: #ffffff; font-size: 12px; font-weight: 600; text-align: center; width: 48px;">#</th>
          <th style="padding: 12px 16px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left; letter-spacing: 0.3px;">
            Sub Counselling Type Selected
          </th>
        </tr>
      </thead>
      <tbody style="background: #ffffff;">
        ${rows}
      </tbody>
    </table>
  `;
}

function buildAppointmentConfirmationEmailHtml(appointment) {
  const clientName = escapeHtml(appointment.name || "Valued Client");
  const firstName = escapeHtml(
    (appointment.name || "").trim().split(/\s+/)[0] || "there"
  );
  const counsellingType = escapeHtml(appointment.counselling_type || "—");
  const subTypes = parseSubCounsellingTypes(
    appointment.sub_counselling_types || appointment.remarks
  );
  const subTypesTable = buildSubCounsellingTypesEmailTable(subTypes);
  const description = escapeHtml(
    appointment.description || "To be discussed during your session"
  );

  const detailRows = [
    ["NRIC / FIN", appointment.nric_fin_number],
    ["Email", appointment.email],
    ["Phone", appointment.phone],
    ["Age", appointment.age],
    ["Gender", appointment.gender],
    ["Nationality", appointment.nationality],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 12px 10px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 38%; vertical-align: top;">
            ${label}
          </td>
          <td style="padding: 10px 0; color: #334155; font-size: 14px; vertical-align: top;">
            ${escapeHtml(value ?? "—")}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!-- Personal welcome -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 28px 24px; border: 1px solid #d4e4ed;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            Appointment Confirmation
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Hello, ${firstName}
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            Thank you, <strong style="color: #0D4A7A;">${clientName}</strong>, for reaching out to
            <strong>WINGS Counselling Centre</strong>. We have received your appointment request and our team will contact you soon.
          </p>
        </td>
      </tr>
    </table>

    <!-- Selected support — highlighted -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #ffffff; border-radius: 16px; padding: 24px; border: 2px solid #0D4A7A; box-shadow: 0 4px 14px rgba(13, 74, 122, 0.08);">
          <p style="margin: 0 0 6px 0; color: #0D4A7A; font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;">
            Your Selected Support
          </p>
          <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px;">Main Counselling Type</p>
          <p style="margin: 0 0 18px 0; color: #0D4A7A; font-size: 20px; font-weight: 700; line-height: 1.4;">
            ${counsellingType}
          </p>
          <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 600;">
            Sub Counselling Type${subTypes.length !== 1 ? "s" : ""} You Selected
          </p>
          ${subTypesTable}
        </td>
      </tr>
    </table>

    <!-- Concern summary -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #f8fafc; border-radius: 12px; padding: 20px 22px; border-left: 4px solid #FFD700;">
          <p style="margin: 0 0 8px 0; color: #0D4A7A; font-size: 14px; font-weight: 700;">
            Brief Description of Your Concern
          </p>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
            ${description}
          </p>
        </td>
      </tr>
    </table>

    <!-- Contact details -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; padding: 22px 24px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            Your Contact Details
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${detailRows}
          </table>
        </td>
      </tr>
    </table>

    <!-- Next steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            What Happens Next?
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">1.</span>
                A counsellor from our team will reach out within <strong>24–48 hours</strong>.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">2.</span>
                We will confirm your preferred date, time, and session format with you.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">3.</span>
                Your first session typically lasts <strong>60–90 minutes</strong>. All information shared is kept confidential.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            Taking this step shows strength and self-care. We are honoured to support you on your journey.
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            With warmth,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Counselling Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Appointment notification email — sent ONLY to the configured admin address
 * in .env. The customer's email is never used as a recipient.
 */
export async function sendAppointmentConfirmationEmail(appointment) {
  const recipientEmail =
    process.env.APPOINTMENT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_NOTIFICATION_TO ||
    process.env.SMTP_USER;

  if (!isValidEmail(recipientEmail)) {
    console.error("[Email] Appointment notification recipient is not configured");
    return false;
  }

  const clientFirstName =
    (appointment.name || "").trim().split(/\s+/)[0] || "there";

  const content = buildAppointmentConfirmationEmailHtml(appointment);
  const transporters = getTransporterCandidates();

  if (!transporters.length) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  try {
    let sent = false;
    let lastError = null;

    for (const candidate of transporters) {
      try {
        if (typeof candidate.transporter.verify === "function") {
          await candidate.transporter.verify();
        }

        await candidate.transporter.sendMail({
          from: FROM,

          // ONLY THE CONFIGURED ADMIN MAIL
          to: recipientEmail,

          // NO CUSTOMER MAIL
          // NO CC
          // NO BCC

          subject: `New Appointment — ${clientFirstName} | WINGS Counselling`,
          html: getMentalHealthEmailWrapper(
            content,
            "New Appointment Request"
          ),
        });

        sent = true;
        console.log(
          "[Email] Appointment notification sent ONLY to:",
          recipientEmail,
          `via ${candidate.label} (${candidate.host}:${candidate.port})`
        );
        break;
      } catch (err) {
        lastError = err;
        console.error(
          `[Email] Appointment send failed via ${candidate.label} (${candidate.host}:${candidate.port}):`,
          err?.message || err
        );
      }
    }

    if (!sent) {
      if (lastError) console.error("[Email] Send failed:", lastError);
      return false;
    }

    try {
      await recordFormSubmissionEmail({
        formType: "Appointment",
        sourceId: appointment.id ?? null,
        primaryMail: recipientEmail,
        ccMail: "",
        subject: `New Appointment — ${clientFirstName} | WINGS Counselling`,
        content: formatAppointmentEmailContent(appointment),
        remarks: appointment.remarks || "",
        senderEmail: appointment.email || "",
      });
    } catch (recordErr) {
      console.warn("[Email] Failed to record form submission email:", recordErr?.message || recordErr);
    }

    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

export async function sendVolunteerApplicationEmail(volunteer) {
  const recipientEmail =
    process.env.VOLUNTEER_NOTIFICATION_EMAIL ||
    process.env.APPOINTMENT_NOTIFICATION_EMAIL ||
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.EMAIL_NOTIFICATION_TO ||
    process.env.SMTP_USER;

  if (!isValidEmail(recipientEmail)) {
    console.error("[Email] Volunteer notification recipient is not configured");
    return false;
  }

  const firstName =
    (volunteer.name || "").trim().split(/\s+/)[0] || "there";

  const content = `
    <p><strong>New volunteer application received</strong></p>
    <p><strong>Name:</strong> ${volunteer.name || "—"}</p>
    <p><strong>Email:</strong> ${volunteer.email || "—"}</p>
    <p><strong>Phone:</strong> ${volunteer.phone_hp || "—"}</p>
    <p><strong>Address:</strong> ${volunteer.address || "—"}</p>
    <p><strong>Skills:</strong> ${volunteer.skills_hobbies || "—"}</p>
    <p><strong>Interest Areas:</strong> ${volunteer.interest_areas || "—"}</p>
    <p><strong>Preferred Days:</strong> ${volunteer.preferred_days || "—"}</p>
    <p><strong>Availability:</strong> ${volunteer.time_from || "—"} - ${volunteer.time_to || "—"}</p>
    <p><strong>Commitment:</strong> ${volunteer.commitment_duration || "—"} ${volunteer.commitment_unit || ""}</p>
  `;

  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.error("[Email] SMTP not configured");
    return false;
  }

  try {
    let sent = false;
    let lastError = null;

    for (const candidate of transporters) {
      try {
        if (typeof candidate.transporter.verify === "function") {
          await candidate.transporter.verify();
        }

        await candidate.transporter.sendMail({
          from: FROM,
          to: recipientEmail,
          subject: `New Volunteer Application — ${firstName} | WINGS Counselling`,
          html: getMentalHealthEmailWrapper(content, "New Volunteer Application"),
        });

        sent = true;
        break;
      } catch (err) {
        lastError = err;
        console.error("[Email] Volunteer send failed:", err?.message || err);
      }
    }

    if (!sent) {
      if (lastError) console.error("[Email] Send failed:", lastError);
      return false;
    }

    try {
      await recordFormSubmissionEmail({
        formType: "Volunteer",
        sourceId: volunteer.id ?? null,
        primaryMail: recipientEmail,
        ccMail: "",
        subject: `New Volunteer Application — ${firstName} | WINGS Counselling`,
        content: formatVolunteerEmailContent(volunteer),
        remarks: volunteer.other_contribution || "",
        senderEmail: volunteer.email || "",
      });
    } catch (recordErr) {
      console.warn("[Email] Failed to record volunteer email:", recordErr?.message || recordErr);
    }

    return true;
  } catch (err) {
    console.error("[Email] Volunteer notification failed:", err);
    return false;
  }
}

/**
 * Application acknowledgement email
 */
export async function sendApplicationAcknowledgement(to, data) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping send");
    return;
  }

  const userEmail = to.trim().toLowerCase();
  const primaryRecipients = await getConfiguredEmailRecipients("primary");
  const ccRecipients = await getConfiguredEmailRecipients("cc");
  const bccRecipients = uniqueEmails([...primaryRecipients, ...ccRecipients]).filter(
    (email) => email !== userEmail
  );

  const isShortlisted = data.status === "shortlisted";
  const isNewSubmission = data.status === "submitted";

  const subject = isShortlisted
    ? `✨ Congratulations! You've Been Shortlisted – ${data.jobTitle}`
    : isNewSubmission
    ? `✅ Application Received – ${data.jobTitle} | Ref: ${data.applicationNumber}`
    : `📧 Application Update – ${data.jobTitle} | Ref: ${data.applicationNumber}`;

  let content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">
      ${isShortlisted ? "🎉 Congratulations!" : isNewSubmission ? "✅ Application Received!" : "Thank You for Your Application"}
    </h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${data.firstName}</strong>,
    </p>
  `;

  if (isShortlisted) {
    content += `
      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6d9 100%); border-radius: 16px; padding: 25px; margin: 20px 0;">
        <p style="color: #2e7d32; font-size: 18px; margin: 0 0 15px 0;">🌟 Exciting News!</p>
        <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
          You have been <strong>shortlisted</strong> for the position of <strong>${data.jobTitle}</strong>.
          Your passion for mental health support truly shines through!
        </p>
      </div>
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        Our HR team will contact you within 3-5 business days to schedule an interview.
      </p>
    `;
  } else if (isNewSubmission) {
    content += `
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        We have successfully received your application for the <strong>${data.jobTitle}</strong> position at WINGS Counselling Centre.
      </p>
      <div style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 25px; margin: 20px 0; border: 1px solid #d4e4ed;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600; width: 40%;">Position Applied:</td>
            <td style="padding: 8px 0; color: #1a3a5c; font-weight: 700;">${data.jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Application Ref:</td>
            <td style="padding: 8px 0; color: #4a6a7f;">${data.applicationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Status:</td>
            <td style="padding: 8px 0;">
              <span style="background: #e8f5e9; color: #2e7d32; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 600;">Submitted</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px; margin: 20px 0;">
        <h3 style="color: #1a3a5c; font-size: 16px; margin: 0 0 12px 0;">What Happens Next?</h3>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">1.</span>
              Our team will review your application carefully.
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">2.</span>
              Shortlisted candidates will be contacted within <strong>5–7 business days</strong>.
            </td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #475569; font-size: 14px; line-height: 1.6;">
              <span style="color: #0D4A7A; font-weight: 700;">3.</span>
              You will receive an email notification with the next steps.
            </td>
          </tr>
        </table>
      </div>
      <p style="color: #4a6a7f; font-size: 15px; line-height: 1.7;">
        Thank you for your interest in joining the WINGS team. We appreciate your commitment to mental health and wellness.
      </p>
    `;
  } else {
    content += `
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        Thank you for applying for the <strong>${data.jobTitle}</strong> position at WINGS Counselling Centre.
      </p>
      <div style="background: #f0f7fa; border-radius: 16px; padding: 25px; margin: 20px 0;">
        <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
          While you were not selected this time, we encourage you to apply for future opportunities.
          Your interest in supporting mental health means the world to us.
        </p>
      </div>
      <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6;">
        <strong>Application Reference:</strong> ${data.applicationNumber}
      </p>
    `;
  }

  content += `
    <div style="margin: 30px 0 0 0; padding: 20px 0 0 0; border-top: 2px solid #e8eef2;">
      <p style="color: #4a6a7f; font-size: 14px; margin: 0;">
        With gratitude,<br>
        <strong style="color: #2c5f8a;">WINGS Counselling Centre</strong>
      </p>
    </div>
  `;

  const mailOptions = {
    from: FROM,
    to: userEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Application Update"),
  };

  if (bccRecipients.length > 0) {
    mailOptions.bcc = bccRecipients.join(", ");
  }

  await sendWithFallback(mailOptions);

  await recordFormSubmissionEmail({
    formType: "Volunteer / Career Application",
    sourceId: data.applicationId ?? null,
    primaryMail: primaryRecipients.join(", ") || userEmail,
    ccMail: ccRecipients.join(", "),
    subject,
    content: formatApplicationEmailContent({
      formLabel: "Volunteer / Career Application",
      firstName: data.firstName,
      lastName: data.lastName ?? "",
      jobTitle: data.jobTitle,
      applicationNumber: data.applicationNumber,
      email: userEmail,
      status: data.status,
    }),
    remarks: data.adminNotes || "",
    senderEmail: userEmail,
  });
}

/**
 * Interview invite email
 */
export async function sendInterviewInvite(to, data) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping send");
    return;
  }

  const content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 10px 0;">📅 Interview Invitation</h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Dear <strong style="color: #2c5f8a;">${data.firstName}</strong>,
    </p>
    
    <div style="background: linear-gradient(135deg, #fff5e6 0%, #ffe8d4 100%); border-radius: 16px; padding: 25px; margin: 20px 0; border-left: 4px solid #FFD700;">
      <p style="color: #1a3a5c; font-size: 18px; margin: 0 0 15px 0;">🎯 Your Interview Details</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600; width: 35%;">Position:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">${data.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Date:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">📅 ${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Time:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">⏰ ${data.timeSlot}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Duration:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">⌛ ${data.duration} minutes</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2c5f8a; font-weight: 600;">Interviewer:</td>
          <td style="padding: 8px 0; color: #4a6a7f;">💼 ${data.interviewerName}</td>
        </tr>
      </table>
    </div>
    
    ${data.meetingLink ? `
    <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="color: #2e7d32; margin: 0 0 10px 0;">💻 Virtual Interview Link</p>
      <a href="${data.meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #2c5f8a 0%, #1a3a5c 100%); color: #ffffff; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin-top: 10px;">
        Join Interview Meeting
      </a>
    </div>
    ` : ''}
    
    <div style="background: #f0f7fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #1a3a5c; font-size: 16px; margin: 0 0 10px 0;">📝 Interview Tips</h3>
      <ul style="color: #4a6a7f; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Be ready 5-10 minutes before the scheduled time</li>
        <li>Prepare your questions about the role and our centre</li>
        <li>Share your experience and passion for mental health</li>
        <li>Ensure a quiet space and stable internet connection</li>
      </ul>
    </div>
    
    <p style="color: #4a6a7f; font-size: 14px; margin: 20px 0 0 0;">
      <strong>Reference:</strong> ${data.applicationNumber}
    </p>
    
    <div style="margin: 30px 0 0 0; padding: 20px 0 0 0; border-top: 2px solid #e8eef2;">
      <p style="color: #4a6a7f; font-size: 14px; margin: 0;">
        We look forward to meeting you!<br>
        <strong style="color: #2c5f8a;">The WINGS Recruitment Team</strong>
      </p>
    </div>
  `;

  await sendWithFallback({
    from: FROM,
    to,
    subject: `📅 Interview Invitation | ${data.jobTitle} | WINGS Counselling Centre`,
    html: getMentalHealthEmailWrapper(content, "Interview Invitation"),
  });
}

function resolveInterviewBookingUrl(data) {
  const applicationId = Number(data?.applicationId ?? data?.application_id);
  if (Number.isFinite(applicationId) && applicationId > 0) {
    return buildInterviewBookingLink(applicationId);
  }

  const portalLink = typeof data?.portalLink === "string" ? data.portalLink.trim() : "";
  if (portalLink) {
    if (portalLink.includes("/candidate-portal")) {
      console.warn(`[Email] Rejected legacy candidate-portal URL: ${portalLink}`);
    } else if (portalLink.includes("/candidate/interview-booking/")) {
      return portalLink;
    }
  }

  console.error("[Email] Missing applicationId — cannot build interview booking URL");
  return `${getCandidatePortalOrigin()}/candidate`;
}

/**
 * Send interview slot booking invitation with available slots
 */
export async function sendInterviewSlotInvitation(candidateEmail, data) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping send");
    return false;
  }

  const { firstName, jobTitle, jobIdCode, round, availableSlots, applicationId } = data;

  const bookingUrl = resolveInterviewBookingUrl(data);
  console.log(
    `[Email] Interview slot invitation booking URL: ${bookingUrl} (applicationId=${applicationId ?? "missing"})`
  );

  // Build available slots table
  const slotsHtml = availableSlots && availableSlots.length > 0 ? availableSlots.map((slot, index) => `
    <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">
        📅 ${slot.date}
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">
        ⏰ ${slot.timeSlot}
      </td>
      <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
        ${slot.duration || 60} min
      </td>
    </tr>
  `).join('') : `
    <tr>
      <td colspan="3" style="padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
        No slots available at the moment. Please check back later.
      </td>
    </tr>
  `;

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 28px 24px; border: 1px solid #d4e4ed;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            Interview Invitation
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Congratulations, ${escapeHtml(firstName)}! 🎉
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            You have been selected for <strong style="color: #0D4A7A;">${round || 'the interview round'}</strong> for the position of <strong>${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) at WINGS Counselling Centre.
          </p>
        </td>
      </tr>
    </table>

    <!-- Important Notice -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px 22px;">
          <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 700; font-size: 15px;">⚠️ Action Required</p>
          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
            Please select and book one of the available interview slots below. <strong>Only the listed slots are available</strong>, so please choose based on your convenience.
          </p>
        </td>
      </tr>
    </table>

    <!-- Available Slots -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 16px 0; color: #0D4A7A; font-size: 18px; font-weight: 700;">
            📅 Available Interview Slots
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%);">
                <th style="padding: 12px 16px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left;">Date</th>
                <th style="padding: 12px 16px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left;">Time</th>
                <th style="padding: 12px 16px; color: #ffffff; font-size: 13px; font-weight: 600; text-align: left;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${slotsHtml}
            </tbody>
          </table>
        </td>
      </tr>
    </table>

    <!-- Booking Instructions -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            How to Book Your Interview Slot
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">1.</span>
                Click the button below to open the interview booking page
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">2.</span>
                Sign in with your candidate account if prompted
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">3.</span>
                Select your preferred date and time from the available options
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                <span style="color: #0D4A7A; font-weight: 700;">4.</span>
                Confirm your booking to receive interview details
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="text-align: center;">
          <a href="${bookingUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; letter-spacing: 0.3px;">
            Book Your Interview Slot →
          </a>
          <p style="margin: 16px 0 0 0; color: #64748b; font-size: 13px; line-height: 1.6; word-break: break-all;">
            If the button does not work, copy and paste this link into your browser:<br>
            <a href="${bookingUrl}" style="color: #0D4A7A; text-decoration: underline;">${escapeHtml(bookingUrl)}</a>
          </p>
        </td>
      </tr>
    </table>

    <!-- Interview Tips -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #e8f5e9; border-radius: 12px; padding: 20px 22px;">
          <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 15px; font-weight: 700;">
            💡 Interview Preparation Tips
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 13px; line-height: 1.8;">
            <li>Be ready 5-10 minutes before your scheduled time</li>
            <li>Prepare questions about the role and WINGS Counselling Centre</li>
            <li>Share your experience and passion for mental health support</li>
            <li>Ensure a quiet space and stable internet connection (for virtual interviews)</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            We look forward to meeting you and learning more about your passion for mental health support!
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Best regards,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Recruitment Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Interview Invitation: ${round || 'Interview Round'} — ${jobTitle}${applicationId ? ` [App #${applicationId}]` : ''}`;

  const plainText = [
    `Congratulations, ${firstName}!`,
    `You have been selected for ${round || 'the interview round'} for ${jobTitle} (${jobIdCode}) at WINGS Counselling Centre.`,
    '',
    'Book your interview slot using this link:',
    bookingUrl,
    '',
    'If the link does not open, copy and paste it into your browser.',
  ].join('\n');

  const mailOptions = {
    from: FROM,
    to: candidateEmail,
    subject,
    text: plainText,
    html: getMentalHealthEmailWrapper(content, "Interview Invitation"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(`[Email] Interview slot invitation sent to: ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send interview slot invitation:", err);
    return false;
  }
}

/**
 * Send interview booking confirmation after candidate books a slot
 */
export async function sendInterviewBookingConfirmation(candidateEmail, data) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping send");
    return false;
  }

  const { firstName, jobTitle, jobIdCode, round, date, timeSlot, duration, interviewerName, location, meetingLink, notes } = data;

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f5e9 0%, #d1f4e0 100%); border-radius: 16px; padding: 28px 24px; border: 2px solid #10b981;">
          <p style="margin: 0 0 8px 0; color: #166534; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            ✅ Interview Confirmed
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Your Interview is Scheduled!
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            Hello <strong style="color: #0D4A7A;">${escapeHtml(firstName)}</strong>, your interview slot for <strong>${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) has been successfully booked.
          </p>
        </td>
      </tr>
    </table>

    <!-- Interview Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #ffffff; border-radius: 14px; padding: 24px; border: 2px solid #0D4A7A;">
          <h3 style="margin: 0 0 16px 0; color: #0D4A7A; font-size: 18px; font-weight: 700;">
            📋 Your Interview Details
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; width: 35%;">Round:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: 600;">${escapeHtml(round || 'Interview Round')}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Date:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">📅 ${escapeHtml(date)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Time:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">⏰ ${escapeHtml(timeSlot)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Duration:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">⌛ ${duration || 60} minutes</td>
            </tr>
            ${interviewerName ? `
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Interviewer:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">💼 ${escapeHtml(interviewerName)}</td>
            </tr>
            ` : ''}
            ${location ? `
            <tr>
              <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600;">Location:</td>
              <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">📍 ${escapeHtml(location)}</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    ${meetingLink ? `
    <!-- Meeting Link -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #e0f2fe; border-radius: 12px; padding: 20px 22px; text-align: center;">
          <p style="margin: 0 0 12px 0; color: #075985; font-size: 15px; font-weight: 700;">💻 Virtual Interview Link</p>
          <a href="${escapeHtml(meetingLink)}" 
             style="display: inline-block; background: linear-gradient(135deg, #0D4A7A 0%, #1a3a5c 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Join Interview Meeting →
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    ${notes ? `
    <!-- Additional Notes -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 12px; padding: 18px 20px;">
          <p style="margin: 0 0 8px 0; color: #0D4A7A; font-weight: 700; font-size: 14px;">📌 Additional Notes:</p>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">${escapeHtml(notes)}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Preparation Tips -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #fef3c7; border-radius: 12px; padding: 20px 22px;">
          <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 700;">
            ⚠️ Important Reminders
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.8;">
            <li>Join 5-10 minutes before the scheduled time</li>
            <li>Test your internet connection and audio/video (for virtual interviews)</li>
            <li>Keep your resume and relevant documents handy</li>
            <li>Prepare questions about the role and organization</li>
            <li>Dress professionally and choose a quiet, well-lit space</li>
          </ul>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            We're excited to meet you and discuss how you can contribute to our mission of supporting mental health and wellness!
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Best of luck,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Recruitment Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Interview Confirmed: ${date} at ${timeSlot} — ${jobTitle}`;

  const mailOptions = {
    from: FROM,
    to: candidateEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Interview Confirmation"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(`[Email] Interview booking confirmation sent to: ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send interview booking confirmation:", err);
    return false;
  }
}

/**
 * Send a notification email to all event subscribers when a new event or article is published.
 * type: "event" | "article"
 */
export async function sendSubscriberNotification(type, item) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping subscriber notification");
    return;
  }

  // Fetch all subscribers
  let subscribers = [];
  try {
    const [rows] = await db.execute("SELECT email FROM event_subscribers ORDER BY id ASC");
    subscribers = rows.map((r) => r.email).filter(isValidEmail);
  } catch (err) {
    console.warn("[Email] Could not fetch subscribers:", err?.message);
    return;
  }

  if (!subscribers.length) {
    console.log("[Email] No subscribers to notify.");
    return;
  }

  const isEvent = type === "event";
  const title = item.title || (isEvent ? "New Event" : "New Article");
  const siteUrl = process.env.SITE_URL || "http://localhost:5173";
  const link = isEvent ? `${siteUrl}/events` : `${siteUrl}/articles`;

  const subject = isEvent
    ? `🗓️ New Event: ${title} | WINGS Counselling Centre`
    : `📰 New Article: ${title} | WINGS Counselling Centre`;

  const content = `
    <h2 style="color: #1a3a5c; font-size: 24px; margin: 0 0 16px 0;">
      ${isEvent ? "🗓️ New Event Published!" : "📰 New Article Published!"}
    </h2>
    <p style="color: #4a6a7f; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      We have just published a new ${isEvent ? "event" : "article"} that we think you'll love:
    </p>
    <div style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 25px; margin: 20px 0; border: 1px solid #d4e4ed;">
      <h3 style="color: #0D4A7A; font-size: 20px; margin: 0 0 12px 0;">${escapeHtml(title)}</h3>
      ${item.description || item.excerpt ? `<p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">${escapeHtml((item.description || item.excerpt || "").slice(0, 200))}${(item.description || item.excerpt || "").length > 200 ? "…" : ""}</p>` : ""}
      <a href="${link}" style="display: inline-block; background: #1B4585; color: #ffffff; padding: 12px 28px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 15px;">
        ${isEvent ? "View Event →" : "Read Article →"}
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px; margin: 20px 0 0 0;">
      You're receiving this because you subscribed to WINGS updates.<br>
      To unsubscribe, reply to this email with "Unsubscribe".
    </p>
  `;

  const html = getMentalHealthEmailWrapper(content, isEvent ? "New Event" : "New Article");

  // Send to each subscriber individually (BCC would expose all emails)
  let sent = 0;
  for (const email of subscribers) {
    try {
      await sendWithFallback({ from: FROM, to: email, subject, html });
      sent++;
    } catch (err) {
      console.error(`[Email] Failed to notify subscriber ${email}:`, err?.message);
    }
  }

  console.log(`[Email] Subscriber notifications sent: ${sent}/${subscribers.length}`);
}

/**
 * Send application status update email to candidate
 */
export async function sendApplicationStatusUpdateEmail(candidateEmail, data) {
  const transporters = getTransporterCandidates();
  if (!transporters.length) {
    console.log("[Email] SMTP not configured – skipping send");
    return false;
  }

  const { firstName, jobTitle, jobIdCode, status, remarks } = data;

  // Status-specific messages
  const statusMessages = {
    'Pending': { color: '#f59e0b', emoji: '⏳', message: 'Your application is pending review.' },
    'Under Review': { color: '#3b82f6', emoji: '🔍', message: 'Great news! Your application is now under review by our team.' },
    'Shortlisted': { color: '#10b981', emoji: '🎉', message: 'Congratulations! You have been shortlisted for the next round.' },
    'Reschedule Round 1': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 1 (Technical Interview). Please check your portal for new time slots.' },
    'Reschedule Round 2': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 2 (LSP-E). Please check your portal for new time slots.' },
    'Reschedule Round 3': { color: '#f59e0b', emoji: '📅', message: 'We need to reschedule your Round 3 (Manager/HR Interview). Please check your portal for new time slots.' },
    'Round 1 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 1 (Technical Interview) has been scheduled. Please check your profile for details.' },
    'Round 1 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 1 (Technical Interview) is confirmed. Please be ready at the scheduled time.' },
    'Round 1 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for attending Round 1. We will evaluate and get back to you soon.' },
    'Round 1 Selected': { color: '#10b981', emoji: '🎊', message: 'Congratulations! You have cleared Round 1 and are moving to Round 2.' },
    'Round 1 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in Round 1. Unfortunately, we have decided to move forward with other candidates.' },
    'Round 2 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 2 (LSP-E) has been scheduled. Please check your profile for details.' },
    'Round 2 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 2 (LSP-E) is confirmed. Prepare for the live practical evaluation.' },
    'Round 2 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for attending Round 2. We will evaluate and get back to you soon.' },
    'Round 2 Selected': { color: '#10b981', emoji: '🎊', message: 'Congratulations! You have cleared Round 2 and are moving to Round 3.' },
    'Round 2 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in Round 2. Unfortunately, we have decided to move forward with other candidates.' },
    'Round 3 Scheduled': { color: '#0891b2', emoji: '📆', message: 'Your Round 3 (Manager/HR Interview) has been scheduled. This is your final interview round.' },
    'Round 3 Confirmed': { color: '#3b82f6', emoji: '✅', message: 'Your Round 3 (Manager/HR Interview) is confirmed. This is your final interview round.' },
    'Round 3 Completed': { color: '#6366f1', emoji: '✔️', message: 'Thank you for completing all interview rounds. We will finalize the decision soon.' },
    'Round 3 Selected': { color: '#059669', emoji: '🌟', message: 'Congratulations! You have successfully completed all interview rounds. The offer process will begin shortly.' },
    'Round 3 Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for participating in all rounds. Unfortunately, we have decided to move forward with other candidates.' },
    'Final Selected': { color: '#059669', emoji: '🎉', message: 'Congratulations! You have been selected for the position. Our team will reach out with the offer details.' },
    'Offer Extended': { color: '#14b8a6', emoji: '📧', message: 'An offer has been extended to you. Please check your email for the offer details.' },
    'Onboarded': { color: '#059669', emoji: '🎊', message: 'Welcome to the team! Your onboarding process has been initiated.' },
    'Rejected': { color: '#ef4444', emoji: '📋', message: 'Thank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates.' },
    'Not Selected': { color: '#ef4444', emoji: '📋', message: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates at this time.' },
    'Withdrawn by Candidate': { color: '#f97316', emoji: '📝', message: 'We acknowledge your decision to withdraw from the selection process. We wish you the best.' },
    'Position Closed': { color: '#6b7280', emoji: '🔒', message: 'This position has been closed. Thank you for your interest.' },
    'Rejected - Candidate non responsive': { color: '#ef4444', emoji: '📋', message: 'Your application has been closed due to non-responsiveness. Please contact us if you wish to reapply.' },
  };

  const statusInfo = statusMessages[status] || { 
    color: '#6b7280', 
    emoji: '📧', 
    message: 'Your application status has been updated.' 
  };

  const remarksSection = remarks ? `
    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
      <p style="color: #92400e; font-weight: 700; margin: 0 0 8px 0; font-size: 14px;">📌 Note from Recruiter:</p>
      <p style="color: #78350f; margin: 0; line-height: 1.6; font-size: 14px;">${escapeHtml(remarks)}</p>
    </div>
  ` : '';

  const content = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: linear-gradient(135deg, #e8f4fc 0%, #f0f7fa 100%); border-radius: 16px; padding: 28px 24px; border: 1px solid #d4e4ed;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
            Application Status Update
          </p>
          <h2 style="margin: 0 0 12px 0; color: #0D4A7A; font-size: 26px; font-weight: 600; line-height: 1.3;">
            Hello, ${escapeHtml(firstName)}
          </h2>
          <p style="margin: 0; color: #475569; font-size: 16px; line-height: 1.7;">
            There's an update on your application for <strong style="color: #0D4A7A;">${escapeHtml(jobTitle)}</strong> (${escapeHtml(jobIdCode)}) at WINGS Counselling Centre.
          </p>
        </td>
      </tr>
    </table>

    <!-- Status Update Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: ${statusInfo.color}20; border-left: 4px solid ${statusInfo.color}; border-radius: 12px; padding: 20px 22px;">
          <p style="margin: 0 0 8px 0; color: ${statusInfo.color}; font-size: 18px; font-weight: 700;">
            ${statusInfo.emoji} ${escapeHtml(status)}
          </p>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
            ${statusInfo.message}
          </p>
        </td>
      </tr>
    </table>

    ${remarksSection}

    <!-- Next Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: #f0f7fa; border-radius: 14px; padding: 22px 24px;">
          <h3 style="margin: 0 0 14px 0; color: #0D4A7A; font-size: 16px; font-weight: 700;">
            What's Next?
          </h3>
          <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
            Please log in to your candidate portal to view complete details about your application status and any next steps required.
          </p>
        </td>
      </tr>
    </table>

    <!-- Closing -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0; color: #475569; font-size: 15px; line-height: 1.7;">
            Thank you for your continued interest in joining the WINGS team. We appreciate your patience throughout this process.
          </p>
          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            With warmth,<br>
            <strong style="color: #0D4A7A; font-size: 16px;">The WINGS Counselling Team</strong>
          </p>
        </td>
      </tr>
    </table>
  `;

  const subject = `Application Update: ${status} — ${jobTitle}`;

  const mailOptions = {
    from: FROM,
    to: candidateEmail,
    subject,
    html: getMentalHealthEmailWrapper(content, "Application Status Update"),
  };

  try {
    await sendWithFallback(mailOptions);
    console.log(`[Email] Application status update sent to: ${candidateEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send application status update:", err);
    return false;
  }
}
