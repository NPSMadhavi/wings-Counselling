import nodemailer from "nodemailer";

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

const FROM = process.env.EMAIL_FROM ?? "WINGS Counselling Centre <noreply@wingscounselling.com>";

export async function sendApplicationAcknowledgement(to, data) {
  const transporter = getTransporter();
  if (!transporter) { console.log("[Email] SMTP not configured – skipping send"); return; }
  await transporter.sendMail({
    from: FROM, to,
    subject: `Application Received – ${data.jobTitle} | Ref: ${data.applicationNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#004689;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">WINGS Counselling Centre</h2>
        </div>
        <div style="padding:32px;background:#f8fafc;border-radius:0 0 12px 12px">
          <p>Dear <strong>${data.firstName}</strong>,</p>
          <p>Thank you for applying for the position of <strong>${data.jobTitle}</strong>.</p>
          <p>Your application has been received. Your application reference number is:</p>
          <div style="background:#004689;color:#fff;padding:16px;border-radius:8px;text-align:center;font-size:20px;font-weight:bold;letter-spacing:2px;margin:16px 0">${data.applicationNumber}</div>
          <p>Please keep this reference number for your records. Our team will review your application and be in touch.</p>
          <p>Warm regards,<br><strong>WINGS Counselling Centre HR Team</strong></p>
        </div>
      </div>`,
  });
}

export async function sendStatusUpdate(to, data) {
  const transporter = getTransporter();
  if (!transporter) { console.log("[Email] SMTP not configured – skipping send"); return; }

  const isShortlisted = data.status === "shortlisted";
  const subject = isShortlisted
    ? `Congratulations! You've been Shortlisted – ${data.jobTitle}`
    : `Application Update – ${data.jobTitle} | Ref: ${data.applicationNumber}`;

  const body = isShortlisted
    ? `<p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>${data.jobTitle}</strong>.</p><p>Our team will be in touch soon with the next steps regarding the interview process.</p>`
    : `<p>Thank you for your interest in the position of <strong>${data.jobTitle}</strong>.</p><p>After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We appreciate the time you invested in applying and encourage you to apply for future opportunities.</p>`;

  await transporter.sendMail({
    from: FROM, to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#004689;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">WINGS Counselling Centre</h2>
        </div>
        <div style="padding:32px;background:#f8fafc;border-radius:0 0 12px 12px">
          <p>Dear <strong>${data.firstName}</strong>,</p>
          ${body}
          ${data.adminNote ? `<p><em>Additional note: ${data.adminNote}</em></p>` : ""}
          <p>Reference: <strong>${data.applicationNumber}</strong></p>
          <p>Warm regards,<br><strong>WINGS Counselling Centre HR Team</strong></p>
        </div>
      </div>`,
  });
}

export async function sendInterviewInvite(to, data) {
  const transporter = getTransporter();
  if (!transporter) { console.log("[Email] SMTP not configured – skipping send"); return; }
  await transporter.sendMail({
    from: FROM, to,
    subject: `Interview Invitation – ${data.jobTitle} | Ref: ${data.applicationNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#004689;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:#fff;margin:0">WINGS Counselling Centre</h2>
        </div>
        <div style="padding:32px;background:#f8fafc;border-radius:0 0 12px 12px">
          <p>Dear <strong>${data.firstName}</strong>,</p>
          <p>We would like to invite you for an interview for the position of <strong>${data.jobTitle}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;font-weight:bold;color:#004689">Date</td><td style="padding:8px">${data.date}</td></tr>
            <tr style="background:#f0f4f8"><td style="padding:8px;font-weight:bold;color:#004689">Time</td><td style="padding:8px">${data.timeSlot}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#004689">Duration</td><td style="padding:8px">${data.duration} minutes</td></tr>
            <tr style="background:#f0f4f8"><td style="padding:8px;font-weight:bold;color:#004689">Interviewer</td><td style="padding:8px">${data.interviewerName}</td></tr>
            ${data.location ? `<tr><td style="padding:8px;font-weight:bold;color:#004689">Location</td><td style="padding:8px">${data.location}</td></tr>` : ""}
            ${data.meetingLink ? `<tr style="background:#f0f4f8"><td style="padding:8px;font-weight:bold;color:#004689">Meeting Link</td><td style="padding:8px"><a href="${data.meetingLink}">${data.meetingLink}</a></td></tr>` : ""}
          </table>
          <p>Please confirm your attendance by replying to this email.</p>
          <p>Reference: <strong>${data.applicationNumber}</strong></p>
          <p>Warm regards,<br><strong>WINGS Counselling Centre HR Team</strong></p>
        </div>
      </div>`,
  });
}
