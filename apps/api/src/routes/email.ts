import "./env";
import nodemailer from 'nodemailer';

const LOGO_URL = 'https://netopsys.in/netopsys-logo.png';
const EMAIL_HEADER = `<div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; text-align: center;">
  <img src="${LOGO_URL}" alt="Netopsys" style="height: 40px; max-width: 200px;" />
</div>`;
function emailHeader(subtitle?: string): string {
  return `<div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; text-align: center;">
  <img src="${LOGO_URL}" alt="Netopsys" style="height: 40px; max-width: 200px;" />${subtitle ? `<p style="color: #e0e0ff; margin: 8px 0 0 0; font-size: 14px;">${subtitle}</p>` : ''}
</div>`;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});


interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const BCC_EMAIL = 'careers@netopsys.in';

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: options.to,
      bcc: BCC_EMAIL,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendOtpEmail(email: string, otp: string, firstName: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${EMAIL_HEADER}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Email Verification</h2>
        <p style="color: #4b5563;">Hello ${firstName},</p>
        <p style="color: #4b5563;">Your verification code is:</p>
        <div style="background: #7c3aed; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #4b5563;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>s
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Netopsys',
    html,
  });
}

export async function sendMobileOtpSms(
  mobileNumber: string,
  otp: string,
  firstName: string,
): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      To: mobileNumber,
      From: fromNumber,
      Body: `Netopsys verification code: ${otp}. It expires in 10 minutes.`,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("SMS send error:", text);
      return false;
    }

    return true;
  } catch (error) {
    console.error("SMS send error:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, otp: string, firstName: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${EMAIL_HEADER}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Password Reset</h2>
        <p style="color: #4b5563;">Hello ${firstName},</p>
        <p style="color: #4b5563;">We received a request to reset your password. Use the code below:</p>
        <div style="background: #7c3aed; color: white; font-size: 32px; font-weight: bold; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #4b5563;">This code will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - Netopsys',
    html,
  });
}

export async function sendApplicationNotification(
  jobTitle: string,
  applicantName: string,
  applicantEmail: string,
  jobId: string
): Promise<boolean> {
  const careersEmail = 'careers@netopsys.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('New Job Application')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Application Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Position:</td>
            <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Job ID:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${jobId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Applicant:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${applicantName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Email:</td>
            <td style="padding: 10px 0; color: #1f2937;">${applicantEmail}</td>
          </tr>
        </table>
        <p style="color: #4b5563; margin-top: 20px;">Please log in to the admin panel to review this application.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: careersEmail,
    subject: `New Application: ${jobTitle} - ${applicantName}`,
    html,
  });
}

export async function sendApplicationStatusUpdate(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  newStatus: string,
  remarks?: string
): Promise<boolean> {
  const statusMessages: Record<string, { color: string; message: string }> = {
    'Pending': { color: '#f59e0b', message: 'Your application is pending review.' },
    'Under Review': { color: '#3b82f6', message: 'Great news! Your application is now under review by our team. Please log in to update your screening details.' },
    'Shortlisted': { color: '#10b981', message: 'Congratulations! You have been shortlisted. Please log in to book your Round 1 (Technical Interview) time slot.' },
    // Round-specific reschedule statuses
    'Reschedule Round 1': { color: '#f59e0b', message: 'We need to reschedule your Round 1 (Technical Interview). Please log in and book a new time slot.' },
    'Reschedule Round 2': { color: '#f59e0b', message: 'We need to reschedule your Round 2 (LSP-E). Please log in and book a new time slot.' },
    'Reschedule Round 3': { color: '#f59e0b', message: 'We need to reschedule your Round 3 (Manager/HR Interview). Please log in and book a new time slot.' },
    // Round 1 statuses
    'Round 1 Scheduled': { color: '#0891b2', message: 'Your Round 1 (Technical Interview) has been scheduled. Please check your profile for details.' },
    'Round 1 Confirmed': { color: '#3b82f6', message: 'Your Round 1 (Technical Interview) is confirmed. Please be ready at the scheduled time.' },
    'Round 1 Completed': { color: '#6366f1', message: 'Thank you for attending Round 1. We will evaluate and get back to you soon.' },
    'Round 1 Selected': { color: '#10b981', message: 'Congratulations! You have cleared Round 1. Please log in to book your Round 2 (LSP-E) time slot.' },
    'Round 1 Not Selected': { color: '#ef4444', message: 'Thank you for participating in Round 1. Unfortunately, we have decided to move forward with other candidates.' },
    // Round 2 statuses
    'Round 2 Scheduled': { color: '#0891b2', message: 'Your Round 2 (LSP-E) has been scheduled. Please check your profile for details.' },
    'Round 2 Confirmed': { color: '#3b82f6', message: 'Your Round 2 (LSP-E) is confirmed. Prepare for the live practical evaluation.' },
    'Round 2 Completed': { color: '#6366f1', message: 'Thank you for attending Round 2. We will evaluate and get back to you soon.' },
    'Round 2 Selected': { color: '#10b981', message: 'Congratulations! You have cleared Round 2. Please log in to book your Round 3 (Manager/HR Interview) time slot.' },
    'Round 2 Not Selected': { color: '#ef4444', message: 'Thank you for participating in Round 2. Unfortunately, we have decided to move forward with other candidates.' },
    // Round 3 statuses
    'Round 3 Scheduled': { color: '#0891b2', message: 'Your Round 3 (Manager/HR Interview) has been scheduled. This is your final interview round.' },
    'Round 3 Confirmed': { color: '#3b82f6', message: 'Your Round 3 (Manager/HR Interview) is confirmed. This is your final interview round.' },
    'Round 3 Completed': { color: '#6366f1', message: 'Thank you for completing all interview rounds. We will finalize the decision soon.' },
    'Round 3 Selected': { color: '#059669', message: 'Congratulations! You have successfully completed all interview rounds. The offer process will begin shortly.' },
    'Round 3 Not Selected': { color: '#ef4444', message: 'Thank you for participating in all rounds. Unfortunately, we have decided to move forward with other candidates.' },
    // Final stages
    'Final Selected': { color: '#059669', message: 'Congratulations! You have been selected for the position. Our team will reach out with the offer details.' },
    'Offer Extended': { color: '#14b8a6', message: 'An offer has been extended to you. Please check your email for the offer details.' },
    'Onboarded': { color: '#059669', message: 'Welcome to the team! Your onboarding process has been initiated.' },
    // Closed/Rejected
    'Rejected': { color: '#ef4444', message: 'Thank you for your interest in this position. After careful consideration, we have decided to move forward with other candidates.' },
    'Not Selected': { color: '#ef4444', message: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates at this time.' },
    'Withdrawn by Candidate': { color: '#f97316', message: 'We acknowledge your decision to withdraw from the selection process. We wish you the best.' },
    'Position Closed': { color: '#6b7280', message: 'This position has been closed. Thank you for your interest.' },
  };

  const statusInfo = statusMessages[newStatus] || { color: '#6b7280', message: 'Your application status has been updated.' };

  const remarksSection = remarks ? `
        <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="color: #92400e; font-weight: 700; margin: 0 0 6px 0; font-size: 14px;">📌 Note from Recruiter:</p>
          <p style="color: #78350f; margin: 0; line-height: 1.6;">${remarks}</p>
        </div>
  ` : '';

  // Special high-urgency email for "Under Review" with action-required instructions
  if (newStatus === 'Under Review') {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader('Action Required — Screening Questions')}

        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Your application for <strong style="color: #1f2937;">${jobTitle}</strong> (${jobId}) at Netopsys has moved to the <strong style="color: #3b82f6;">Under Review</strong> stage. 🎉
          </p>

          <!-- Urgent action banner -->
          <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
            <p style="color: #92400e; font-weight: 700; font-size: 15px; margin: 0 0 8px 0;">⚠️ Action Required — Please complete within 5 days</p>
            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
              Kindly log in to the portal and navigate to your <strong>Profile → Jobs</strong> section. Please expand your job application to access the screening questions. Ensure all questions are completed and submitted to proceed to the next stage of the selection process.
            </p>
          </div>

          <!-- Step-by-step instructions -->
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="color: #1f2937; font-weight: 700; font-size: 15px; margin: 0 0 16px 0;">How to complete your screening questions:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                  <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">1</div>
                </td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Click the button below to go directly to your profile</td>
              </tr>
              <tr>
                <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                  <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">2</div>
                </td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Find your application for <strong>${jobTitle}</strong></td>
              </tr>
              <tr>
                <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                  <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">3</div>
                </td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Click the <strong>▼ arrow</strong> to expand the application card</td>
              </tr>
              <tr>
                <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                  <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">4</div>
                </td>
                <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle;">Fill out <strong>all screening questions</strong> and click <strong>Submit</strong></td>
              </tr>
            </table>
          </div>

          <!-- Big CTA button -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="https://netopsys.in/profile"
               style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; display: inline-block; letter-spacing: 0.3px;">
              Complete Screening Questions →
            </a>
          </div>
          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 4px;">
            Or visit: <a href="https://netopsys.in/profile" style="color: #7c3aed;">https://netopsys.in/profile</a>
          </p>

          ${remarksSection}

          <!-- Deadline warning -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
            <p style="color: #991b1b; font-size: 13px; margin: 0;">
              ⏳ <strong>Please complete the screening within 5 days</strong> to keep your application active. Incomplete applications may not proceed to the next round.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            Questions? Write to us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a>
          </p>
        </div>

        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
        </div>
      </div>
    `;

    return sendEmail({
      to: email,
      subject: `Action Required: Complete Your Screening Questions — ${jobTitle} at Netopsys`,
      html,
    });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${EMAIL_HEADER}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Application Status Update</h2>
        <p style="color: #4b5563;">Hello ${firstName},</p>
        <p style="color: #4b5563;">There's an update on your application for:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1f2937; font-weight: 600; margin: 0 0 5px 0;">${jobTitle}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Job ID: ${jobId}</p>
        </div>
        <div style="background: ${statusInfo.color}20; border-left: 4px solid ${statusInfo.color}; padding: 15px; margin: 20px 0;">
          <p style="color: ${statusInfo.color}; font-weight: 600; margin: 0 0 5px 0;">Status: ${newStatus}</p>
          <p style="color: #4b5563; margin: 0;">${statusInfo.message}</p>
        </div>
        ${remarksSection}
        <p style="color: #4b5563;">You can log in to your profile to view more details.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://netopsys.in/profile"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
            View My Application →
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please reach out to us at careers@netopsys.in</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Application Update: ${newStatus} — ${jobTitle} at Netopsys`,
    html,
  });
}

export async function sendScreeningReminderEmail(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  reminderNumber: number
): Promise<boolean> {
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];
  const ordinal = ordinals[reminderNumber - 1] || `${reminderNumber}th`;
  const daysLeft = 5 - reminderNumber;
  const urgencyColor = reminderNumber >= 4 ? '#dc2626' : reminderNumber === 3 ? '#f59e0b' : '#3b82f6';
  const urgencyBg = reminderNumber >= 4 ? '#fef2f2' : reminderNumber === 3 ? '#fef3c7' : '#eff6ff';
  const urgencyBorder = reminderNumber >= 4 ? '#fecaca' : reminderNumber === 3 ? '#fbbf24' : '#bfdbfe';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('Screening Questions — Reminder')}

      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          This is your <strong>${ordinal} reminder</strong> regarding your application for
          <strong style="color: #1f2937;">${jobTitle}</strong> (${jobId}) at Netopsys.
        </p>

        <div style="background: ${urgencyBg}; border: 2px solid ${urgencyBorder}; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
          <p style="color: ${urgencyColor}; font-weight: 700; font-size: 15px; margin: 0 0 8px 0;">
            ${reminderNumber >= 5 ? '🚨 Final Reminder — Action Required Today' : `⚠️ ${ordinal} Reminder — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
          </p>
          <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">
            We noticed you haven't completed the screening questions for your application yet.
            ${reminderNumber >= 5
      ? ' <strong>This is your final reminder.</strong> If the screening questions are not submitted today, your application will be automatically closed.'
      : ' Please log in and complete them as soon as possible to keep your application active.'
    }
          </p>
        </div>

        <!-- Step-by-step instructions -->
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <p style="color: #1f2937; font-weight: 700; font-size: 15px; margin: 0 0 16px 0;">How to complete your screening questions:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">1</div>
              </td>
              <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Click the button below to go directly to your profile</td>
            </tr>
            <tr>
              <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">2</div>
              </td>
              <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Find your application for <strong>${jobTitle}</strong></td>
            </tr>
            <tr>
              <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">3</div>
              </td>
              <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle; border-bottom: 1px solid #f3f4f6;">Click the <strong>▼ arrow</strong> to expand the application card</td>
            </tr>
            <tr>
              <td style="width: 32px; padding: 8px 12px 8px 0; vertical-align: top;">
                <div style="background: #7c3aed; color: white; width: 26px; height: 26px; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">4</div>
              </td>
              <td style="padding: 8px 0; color: #374151; font-size: 14px; vertical-align: middle;">Fill out <strong>all screening questions</strong> and click <strong>Submit</strong></td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://netopsys.in/profile"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; display: inline-block; letter-spacing: 0.3px;">
            Complete Screening Questions →
          </a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 4px;">
          Or visit: <a href="https://netopsys.in/profile" style="color: #7c3aed;">https://netopsys.in/profile</a>
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
          Questions? Write to us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a>
        </p>
      </div>

      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  const subjectMap: Record<number, string> = {
    1: `1st Reminder: Complete Your Screening Questions — ${jobTitle}`,
    2: `2nd Reminder: Screening Questions Still Pending — ${jobTitle}`,
    3: `3rd Reminder: Urgent — Screening Questions Due Soon — ${jobTitle}`,
    4: `4th Reminder: Only 1 Day Left — ${jobTitle} at Netopsys`,
    5: `Final Reminder: Complete Screening Questions Today — ${jobTitle}`,
  };

  return sendEmail({
    to: email,
    subject: subjectMap[reminderNumber] || `Reminder: Complete Your Screening Questions — ${jobTitle}`,
    html,
  });
}

export async function sendScreeningNonResponsiveRejection(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('Application Update')}

      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          Thank you for applying for the <strong style="color: #1f2937;">${jobTitle}</strong> (${jobId}) position at Netopsys.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          We truly appreciate the time and effort you put into your application, and we hope life has been treating you well.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          We reached out several times over the past 5 days requesting you to complete the screening questions, which are a necessary step in our selection process. Unfortunately, we were unable to receive a response.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          As a result, we have had to close your application for this position. We completely understand that life can get busy, and we hold no reservations — this decision was made only to keep our process moving forward fairly for all candidates.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 24px 0;">
          <p style="color: #166534; font-weight: 700; font-size: 14px; margin: 0 0 8px 0;">💚 Still interested in joining Netopsys?</p>
          <p style="color: #15803d; margin: 0; font-size: 14px; line-height: 1.6;">
            If you'd still like to be considered for this or future opportunities, we'd love to hear from you! Please send us an email at
            <a href="mailto:careers@netopsys.in" style="color: #7c3aed; font-weight: 600;">careers@netopsys.in</a>
            and our team will be happy to assist you.
          </p>
        </div>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          We wish you all the very best in your career journey and hope our paths cross again in the future.
        </p>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-top: 24px;">
          Warm regards,<br />
          <strong>The Netopsys Hiring Team</strong><br />
          <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a>
        </p>
      </div>

      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Your Application Update — ${jobTitle} at Netopsys`,
    html,
  });
}

export async function sendScreeningUpdateNotification(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  jobId: string
): Promise<boolean> {
  const careersEmail = 'career@netopsys.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Candidate Screening Update')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Screening Details Updated</h2>
        <p style="color: #4b5563;">A candidate has updated their screening details for the following position:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Position:</td>
            <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Job ID:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${jobId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Candidate:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Email:</td>
            <td style="padding: 10px 0; color: #1f2937;">${candidateEmail}</td>
          </tr>
        </table>
        <p style="color: #4b5563;">Please log in to the admin panel to review the screening details and decide if you want to shortlist this candidate for an interview.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: careersEmail,
    subject: `Screening Updated: ${jobTitle} - ${candidateName}`,
    html,
  });
}

export async function sendInterviewAvailabilityNotification(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  jobId: string,
  availableFrom: string,
  availableTo: string,
  preferredTime: string
): Promise<boolean> {
  const careersEmail = 'career@netopsys.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Availability Submitted')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Candidate Interview Availability</h2>
        <p style="color: #4b5563;">A shortlisted candidate has submitted their interview availability:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Position:</td>
            <td style="padding: 10px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Job ID:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${jobId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Candidate:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${candidateEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Available From:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${availableFrom}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Available To:</td>
            <td style="padding: 10px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${availableTo}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6b7280;">Preferred Time:</td>
            <td style="padding: 10px 0; color: #1f2937;">${preferredTime}</td>
          </tr>
        </table>
        <p style="color: #4b5563;">Please schedule the interview based on the candidate's availability and update the application status.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: careersEmail,
    subject: `Interview Availability: ${jobTitle} - ${candidateName}`,
    html,
  });
}

export async function sendInterviewScheduleConfirmationRequest(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  jobId: string,
  scheduledDate: string,
  scheduledTime: string,
  confirmationLink: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Scheduled')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Please Confirm Your Interview</h2>
        <p style="color: #4b5563;">Hello ${candidateName},</p>
        <p style="color: #4b5563;">We have scheduled your interview for the following position:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1f2937; font-weight: 600; margin: 0 0 5px 0;">${jobTitle}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Job ID: ${jobId}</p>
        </div>
        <div style="background: #0891b220; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0;">
          <p style="color: #0891b2; font-weight: 600; margin: 0 0 5px 0;">Interview Details:</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Date:</strong> ${scheduledDate}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Time:</strong> ${formatTimeRange12(scheduledTime)} IST / ${formatTimeRange12(convertISTtoSGT(scheduledTime))} SGT</p>
        </div>
        <p style="color: #4b5563;">Please confirm your attendance by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Confirm Interview</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link in your browser:</p>
        <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${confirmationLink}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please reach out to us at careers@netopsys.in</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Confirm Your Interview: ${jobTitle} - Netopsys`,
    html,
  });
}

export async function sendInterviewConfirmedToCandidate(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  jobId: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Confirmed')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Your Interview is Confirmed!</h2>
        <p style="color: #4b5563;">Hello ${candidateName},</p>
        <p style="color: #4b5563;">Thank you for confirming your interview for:</p>
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1f2937; font-weight: 600; margin: 0 0 5px 0;">${jobTitle}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Job ID: ${jobId}</p>
        </div>
        <div style="background: #10b98120; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="color: #10b981; font-weight: 600; margin: 0 0 5px 0;">Confirmed Interview Details:</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Date:</strong> ${scheduledDate}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Time:</strong> ${formatTimeRange12(scheduledTime)} IST / ${formatTimeRange12(convertISTtoSGT(scheduledTime))} SGT</p>
        </div>
        <p style="color: #4b5563;">Our team will reach out to you shortly with further details about the interview process.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">If you have any questions, please reach out to us at careers@netopsys.in</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Interview Confirmed: ${jobTitle} - Netopsys`,
    html,
  });
}

export async function sendInterviewDetailsToOrganizer(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  jobId: string,
  scheduledDate: string,
  scheduledTime: string,
  resumePath: string,
  screeningDetails: {
    fullName?: string;
    dob?: string;
    gender?: string;
    location?: string;
    experience?: string;
    education?: string;
    currentCtc?: string;
    expectedCtc?: string;
    noticePeriod?: string;
  }
): Promise<boolean> {
  const organizerEmail = 'tao@netopsys.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Confirmed - Action Required')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Candidate Interview Details</h2>
        <p style="color: #4b5563;">A candidate has confirmed their interview. Please organize the interview accordingly.</p>
        
        <h3 style="color: #1f2937; margin-top: 25px;">Position Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Position:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${jobTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Job ID:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${jobId}</td>
          </tr>
        </table>
        
        <h3 style="color: #1f2937; margin-top: 25px;">Candidate Information</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Name:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${candidateName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${candidateEmail}</td>
          </tr>
        </table>
        
        <div style="background: #0891b220; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0;">
          <p style="color: #0891b2; font-weight: 600; margin: 0 0 5px 0;">Scheduled Interview:</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Date:</strong> ${scheduledDate}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Time:</strong> ${formatTimeRange12(scheduledTime)} IST / ${formatTimeRange12(convertISTtoSGT(scheduledTime))} SGT</p>
        </div>
        
        <h3 style="color: #1f2937; margin-top: 25px;">Screening Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Full Name:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.fullName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">DOB:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.dob || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Gender:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.gender || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Location:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.location || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Experience:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.experience || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Education:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.education || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Current CTC:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.currentCtc || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Expected CTC:</td>
            <td style="padding: 8px 0; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${screeningDetails.expectedCtc || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Notice Period:</td>
            <td style="padding: 8px 0; color: #1f2937;">${screeningDetails.noticePeriod || 'N/A'}</td>
          </tr>
        </table>
        
        <p style="color: #4b5563; margin-top: 20px;"><strong>Resume:</strong> The candidate's resume is available in the admin panel or at: ${resumePath}</p>
        
        <p style="color: #4b5563; margin-top: 20px;">Please complete the interview rounds and update the application status to either "Interview Completed" or "Not Selected" accordingly.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: organizerEmail,
    subject: `Interview Scheduled: ${jobTitle} - ${candidateName} (${scheduledDate} ${formatTimeRange12(scheduledTime)})`,
    html,
  });
}

export async function sendInterviewBookedNotification(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  jobId: string,
  bookedDate: string,
  bookedTime: string
): Promise<boolean> {
  const adminEmail = 'careers@netopsys.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('New Interview Booking')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">A Candidate Has Booked an Interview Slot</h2>
        <p style="color: #4b5563;">A candidate has selected an interview slot for their first-round interview.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Candidate Details</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Name:</strong> ${candidateName}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Email:</strong> ${candidateEmail}</p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Position</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p>
        </div>
        
        <div style="background: #7c3aed20; border-left: 4px solid #7c3aed; padding: 15px; margin: 20px 0;">
          <p style="color: #7c3aed; font-weight: 600; margin: 0 0 5px 0;">Selected Interview Slot</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Date:</strong> ${bookedDate}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Time:</strong> ${formatTimeRange12(bookedTime)} IST / ${formatTimeRange12(convertISTtoSGT(bookedTime))} SGT</p>
        </div>
        
        <p style="color: #4b5563;">The candidate will receive a confirmation email asking them to confirm their attendance.</p>
        <p style="color: #4b5563;">If this time doesn't work for you, please request a reschedule through the admin panel.</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Interview Booking: ${candidateName} - ${jobTitle} (${bookedDate} ${formatTimeRange12(bookedTime)})`,
    html,
  });
}

export async function sendInterviewBookingConfirmation(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  jobId: string,
  bookedDate: string,
  bookedTime: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Confirmed!')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Dear ${candidateName},</h2>
        <p style="color: #4b5563;">Great news! Your interview has been scheduled successfully. Here are the details:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Position Details</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Job Title:</strong> ${jobTitle}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p>
        </div>
        
        <div style="background: #10b98120; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="color: #10b981; font-weight: 600; margin: 0 0 5px 0;">Your Interview Slot</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Date:</strong> ${bookedDate}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Time:</strong> ${formatTimeRange12(bookedTime)} IST / ${formatTimeRange12(convertISTtoSGT(bookedTime))} SGT</p>
        </div>
        
        <p style="color: #4b5563;">Please be prepared for your interview at the scheduled time. You will receive further instructions closer to the interview date.</p>
        
        <p style="color: #4b5563;">If you need to reschedule, please contact us at careers@netopsys.in</p>
        
        <p style="color: #4b5563; margin-top: 20px;">Best regards,<br>The Netopsys Hiring Team</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Interview Confirmed: ${jobTitle} - ${bookedDate} at ${formatTimeRange12(bookedTime)}`,
    html,
  });
}

function to12Hour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatTimeRange12(timeRange: string): string {
  return timeRange.split(' - ').map(t => to12Hour(t.trim())).join(' - ');
}

function convertISTtoSGT(istTimeRange: string): string {
  const parts = istTimeRange.split(' - ');
  const converted = parts.map(t => {
    const [h, m] = t.trim().split(':').map(Number);
    let totalMin = h * 60 + m + 150;
    if (totalMin >= 1440) totalMin -= 1440;
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  });
  return converted.join(' - ');
}

function formatDateReadable(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, m, d] = dateStr.split('-');
  return `${d}-${months[parseInt(m) - 1]}-${y}`;
}

export async function sendInterviewMeetingLinkEmail(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  jobId: string,
  scheduledDate: string,
  scheduledTime: string,
  meetingLink: string,
  roundName: string
): Promise<boolean> {
  const formattedDate = formatDateReadable(scheduledDate);
  const sgtTime = convertISTtoSGT(scheduledTime);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${emailHeader('Interview Details')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Your Interview Details</h2>
        <p style="color: #4b5563;">Hello ${candidateName},</p>
        <p style="color: #4b5563;">Here are the details for your upcoming interview at Netopsys. Please review the information below and join on time.</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <p style="color: #1f2937; font-weight: 600; margin: 0 0 5px 0;">${jobTitle}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Job ID: ${jobId}</p>
        </div>

        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #1e40af; font-weight: 600; margin: 0 0 10px 0;">${roundName}</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280; width: 120px;">Date:</td>
              <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">India Time (IST):</td>
              <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${formatTimeRange12(scheduledTime)} IST</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Singapore Time (SGT):</td>
              <td style="padding: 6px 0; color: #1f2937; font-weight: 600;">${formatTimeRange12(sgtTime)} SGT</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Join Interview Meeting
          </a>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 0;">
            <a href="${meetingLink}" style="color: #3b82f6; text-decoration: underline;">${meetingLink}</a>
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
          <p style="color: #4b5563; font-size: 14px;">
            <strong>Important:</strong> Please join the meeting 5 minutes before the scheduled time. Ensure you have a stable internet connection and a quiet environment.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          If you have any issues, questions, or need any help, please contact us at 
          <a href="mailto:careers@netopsys.in" style="color: #7c3aed; text-decoration: none; font-weight: 600;">careers@netopsys.in</a>
        </p>

        <p style="color: #4b5563; margin-top: 20px;">Best regards,<br>The Netopsys Hiring Team</p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Interview Details & Meeting Link: ${roundName} - ${jobTitle} | Netopsys`,
    html,
  });
}

export async function sendNewQuestionEmail(
  candidateEmail: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  questionText: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('New Question from Netopsys')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          The Netopsys team has posted a new question regarding your application for
          <strong style="color: #1f2937;">${jobTitle}</strong> (${jobId}).
        </p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px 20px; margin: 24px 0;">
          <p style="color: #1e40af; font-weight: 700; font-size: 13px; margin: 0 0 6px 0;">Question:</p>
          <p style="color: #1e3a8a; font-size: 15px; margin: 0; line-height: 1.6;">${questionText}</p>
        </div>
        <p style="color: #4b5563; font-size: 14px;">Please log in to your profile and navigate to your application to submit your answer.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://netopsys.in/profile"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block;">
            Answer the Question →
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">Questions? Write to us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a></p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: candidateEmail,
    subject: `New Question on Your Application: ${jobTitle} — Netopsys`,
    html,
  });
}

export async function sendMcqInviteEmail(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  testUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('Technical Evaluation — Round 1')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          Your interview for <strong style="color: #1f2937;">${jobTitle}</strong> (${jobId}) at Netopsys includes an
          <strong>AI-generated Technical Evaluation</strong> as part of Round 1.
        </p>
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="color: #1e40af; font-weight: 700; font-size: 15px; margin: 0 0 12px 0;">📋 What to expect:</p>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 2;">
            <li><strong>30 multiple-choice questions</strong> personalised to your role and profile</li>
            <li><strong>45-minute timer</strong> — once started, the clock does not stop</li>
            <li>Questions cover technical knowledge, reasoning, aptitude, and role-specific scenarios</li>
            <li>A minimum of <strong>28 / 30</strong> is required to proceed to Round 2</li>
          </ul>
        </div>
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
          <p style="color: #92400e; font-weight: 700; margin: 0 0 6px 0;">⚠️ Important — Before you begin:</p>
          <ul style="color: #78350f; margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.9;">
            <li>Ensure you have a stable internet connection</li>
            <li>Use a laptop or desktop — mobile devices are not recommended</li>
            <li>Do not switch tabs, minimise the window, or press F12 during the test</li>
            <li>Right-clicking and copy/paste are disabled during the evaluation</li>
            <li>Repeated tab switches will automatically submit the test</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${testUrl}"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 700; display: inline-block; letter-spacing: 0.3px;">
            Begin Technical Evaluation →
          </a>
        </div>
        <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 4px;">
          Or visit: <a href="${testUrl}" style="color: #7c3aed;">${testUrl}</a>
        </p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
          Questions? Write to us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a>
        </p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: `Technical Evaluation Ready — ${jobTitle} at Netopsys`,
    html,
  });
}

export async function sendMcqResultEmail(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  score: number,
  totalQuestions: number,
  passed: boolean,
  autoSubmitted = false,
  autoSubmitReason: "timer_expired" | "max_warnings" | null = null,
  warningCount = 0,
  startedAt: Date | null = null,
  submittedAt: Date | null = null
): Promise<boolean> {
  const passThreshold = 28;
  const color = passed ? '#10b981' : '#ef4444';
  const bg = passed ? '#f0fdf4' : '#fef2f2';
  const border = passed ? '#86efac' : '#fecaca';

  const fmt = (d: Date | null) => d
    ? d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST'
    : 'N/A';

  const timeTakenMins = startedAt && submittedAt
    ? Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
    : null;

  const autoSubmitBlock = autoSubmitted ? (() => {
    if (autoSubmitReason === 'timer_expired') {
      return `
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
          <p style="color: #92400e; font-weight: 700; font-size: 14px; margin: 0 0 10px 0;">⏱ Why was my test submitted automatically?</p>
          <p style="color: #78350f; font-size: 13px; line-height: 1.7; margin: 0 0 12px 0;">
            Your test was auto-submitted by our system when the 45-minute timer reached zero. This is a standard security measure — once the time limit is reached, the system finalises the test immediately with whatever answers were recorded up to that point.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #78350f;">
            <tr>
              <td style="padding: 5px 0; font-weight: 600; width: 40%;">Test started at</td>
              <td style="padding: 5px 0;">${fmt(startedAt)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Auto-submitted at</td>
              <td style="padding: 5px 0;">${fmt(submittedAt)}</td>
            </tr>
            ${timeTakenMins !== null ? `
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Time on test</td>
              <td style="padding: 5px 0;">${timeTakenMins} minute(s) (limit: 45 min)</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Focus violations</td>
              <td style="padding: 5px 0;">${warningCount} of 5 recorded</td>
            </tr>
          </table>
          <p style="color: #92400e; font-size: 12px; margin: 12px 0 0 0;">
            If you believe this was an error, please contact us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a> within 48 hours.
          </p>
        </div>`;
    }
    if (autoSubmitReason === 'max_warnings') {
      return `
        <div style="background: #fff1f2; border: 1px solid #fca5a5; border-left: 4px solid #ef4444; border-radius: 8px; padding: 18px 20px; margin: 24px 0;">
          <p style="color: #991b1b; font-weight: 700; font-size: 14px; margin: 0 0 10px 0;">🔒 Why was my test submitted automatically?</p>
          <p style="color: #7f1d1d; font-size: 13px; line-height: 1.7; margin: 0 0 12px 0;">
            Our proctoring system detected ${warningCount} focus-loss event(s) (e.g. switching tabs, opening another window, or losing focus on the test window). Each event was flagged and a warning was issued in real time. When the 5th violation was recorded, the system immediately finalised the test as a security measure to maintain exam integrity.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #7f1d1d;">
            <tr>
              <td style="padding: 5px 0; font-weight: 600; width: 40%;">Test started at</td>
              <td style="padding: 5px 0;">${fmt(startedAt)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Auto-submitted at</td>
              <td style="padding: 5px 0;">${fmt(submittedAt)}</td>
            </tr>
            ${timeTakenMins !== null ? `
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Time on test</td>
              <td style="padding: 5px 0;">${timeTakenMins} minute(s)</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 5px 0; font-weight: 600;">Violations recorded</td>
              <td style="padding: 5px 0; font-weight: 700;">${warningCount} / 5 (threshold reached)</td>
            </tr>
          </table>
          <p style="color: #991b1b; font-size: 12px; margin: 12px 0 0 0;">
            If you believe any of these events were triggered in error, please contact us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a> within 48 hours with your reasoning.
          </p>
        </div>`;
    }
    return '';
  })() : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('Technical Evaluation — Result')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${firstName},</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          ${autoSubmitted
      ? `Your Technical Evaluation for <strong>${jobTitle}</strong> (${jobId}) has been finalised. Here is your result.`
      : `Thank you for completing the Technical Evaluation for <strong>${jobTitle}</strong> (${jobId}).`}
        </p>
        <div style="background: ${bg}; border: 2px solid ${border}; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: ${color}; font-size: 40px; font-weight: 800; margin: 0;">${score} / ${totalQuestions}</p>
          <p style="color: ${color}; font-weight: 700; font-size: 18px; margin: 8px 0 0 0;">
            ${passed ? '✅ Passed' : '❌ Not Cleared'}
          </p>
          <p style="color: #6b7280; font-size: 13px; margin: 8px 0 0 0;">Pass threshold: ${passThreshold} / ${totalQuestions}${timeTakenMins !== null ? ` &nbsp;·&nbsp; Time taken: ${timeTakenMins} min` : ''}</p>
        </div>
        ${autoSubmitBlock}
        ${passed ? `
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; padding: 16px 18px; margin: 20px 0;">
          <p style="color: #166534; font-weight: 700; margin: 0 0 6px 0;">🎉 Congratulations!</p>
          <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
            You have successfully cleared Round 1. Our team will reach out with the next steps for Round 2 (LSP-E). Please log in to your profile to book your Round 2 slot.
          </p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://netopsys.in/profile"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block;">
            Book Round 2 Slot →
          </a>
        </div>
        ` : `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px 18px; margin: 20px 0;">
          <p style="color: #991b1b; font-weight: 700; margin: 0 0 6px 0;">Thank you for your effort</p>
          <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.6;">
            Unfortunately, your score did not meet the minimum threshold for this role.
            We encourage you to continue developing your skills and you are welcome to reapply after 6 months.
          </p>
        </div>
        `}
        <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
          Questions? Write to us at <a href="mailto:careers@netopsys.in" style="color: #7c3aed;">careers@netopsys.in</a>
        </p>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: passed
      ? `Congratulations — You've Cleared Round 1! Schedule Your Round 2 Interview`
      : `Technical Evaluation Result — ${jobTitle} at Netopsys`,
    html,
  });
}

export async function sendNewAnswerEmail(
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  jobId: string,
  questionText: string,
  answerText: string
): Promise<boolean> {
  const careersEmail = 'careers@netopsys.in';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${emailHeader('Candidate Answered a Question')}
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">New Answer Received</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
          <strong>${candidateName}</strong> (${candidateEmail}) has answered a question for their application for
          <strong>${jobTitle}</strong> (${jobId}).
        </p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
          <p style="color: #1e40af; font-weight: 700; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase;">Question</p>
          <p style="color: #1e3a8a; margin: 0; font-size: 14px;">${questionText}</p>
        </div>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
          <p style="color: #15803d; font-weight: 700; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase;">Answer</p>
          <p style="color: #166534; margin: 0; font-size: 14px;">${answerText}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://netopsys.in/admin"
             style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">
            View in Admin Panel →
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: careersEmail,
    subject: `Answer Received: ${candidateName} — ${jobTitle}`,
    html,
  });
}

interface ReportRow {
  questionOrder: number;
  questionText: string;
  selectedAnswer: string | null;
  selectedText: string;
  correctAnswer: string;
  correctText: string;
  isCorrect: boolean;
  category: string;
  explanation: string;
}

export async function sendMcqReportEmail(
  email: string,
  firstName: string,
  jobTitle: string,
  jobId: string,
  score: number,
  total: number,
  passed: boolean,
  rows: ReportRow[]
): Promise<boolean> {
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : "0.0";
  const color = passed ? "#10b981" : "#ef4444";
  const bg = passed ? "#f0fdf4" : "#fef2f2";
  const border = passed ? "#86efac" : "#fecaca";

  const categoryLabel: Record<string, string> = {
    technical: "Technical", reasoning: "Reasoning", aptitude: "Aptitude",
    real_world: "Real-World", role_specific: "Role-Specific",
  };

  const questionRows = rows.map(r => {
    const rowBg = r.isCorrect ? "#f0fdf4" : (r.selectedAnswer === null ? "#f9fafb" : "#fef2f2");
    const statusIcon = r.isCorrect ? "✅" : (r.selectedAnswer === null ? "⬜" : "❌");
    return `
      <tr style="background:${rowBg};">
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;vertical-align:top;white-space:nowrap;">${statusIcon} Q${r.questionOrder}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;vertical-align:top;">${r.questionText.replace(/```[\s\S]*?```/g, "[code snippet]")}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top;color:${r.isCorrect ? "#16a34a" : r.selectedAnswer ? "#dc2626" : "#9ca3af"};">${r.selectedAnswer ?? "—"}: ${r.selectedText}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top;color:#16a34a;">${r.correctAnswer}: ${r.correctText}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top;color:#4b5563;">${r.explanation || "—"}</td>
      </tr>`;
  }).join("");

  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:900px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;">
        <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:4px;">Technical Evaluation Report</div>
        <div style="color:rgba(255,255,255,0.8);font-size:14px;">${jobTitle} — ${jobId}</div>
      </div>
      <div style="padding:32px 40px;">
        <p style="color:#374151;font-size:15px;margin:0 0 20px;">Hi ${firstName},</p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 24px;">
          Here is your detailed question-by-question report for the technical evaluation. Review the explanations carefully — they highlight the correct reasoning for each question.
        </p>

        <div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;gap:24px;">
          <div>
            <div style="font-size:32px;font-weight:900;color:${color};">${score}/${total}</div>
            <div style="color:#6b7280;font-size:13px;">Score (${pct}%)</div>
          </div>
          <div style="border-left:2px solid ${border};padding-left:24px;">
            <div style="font-size:18px;font-weight:700;color:${color};">${passed ? "PASSED ✓" : "NOT PASSED ✗"}</div>
            <div style="color:#6b7280;font-size:13px;">Pass threshold: 28/30</div>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px 8px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;white-space:nowrap;">#</th>
                <th style="padding:10px 8px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Question</th>
                <th style="padding:10px 8px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;white-space:nowrap;">Your Answer</th>
                <th style="padding:10px 8px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;white-space:nowrap;">Correct Answer</th>
                <th style="padding:10px 8px;text-align:left;color:#374151;border-bottom:2px solid #e5e7eb;">Explanation</th>
              </tr>
            </thead>
            <tbody>${questionRows}</tbody>
          </table>
        </div>

        <div style="margin-top:28px;padding:16px 20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
          <p style="color:#374151;font-size:13px;margin:0;">
            If you have any questions about this report, feel free to reach out to us at <a href="mailto:careers@netopsys.in" style="color:#7c3aed;">careers@netopsys.in</a>.
          </p>
        </div>
      </div>
      <div style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;">&copy; ${new Date().getFullYear()} Netopsys. All rights reserved.</p>
      </div>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: `Your Technical Evaluation Report — ${jobTitle} (${jobId})`,
    html,
  });
}
