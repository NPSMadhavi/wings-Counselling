import { db } from "../config/db.js";

async function ensureFormSubmissionEmailsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS form_submission_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_type VARCHAR(120) NOT NULL,
      source_id INT NULL,
      primary_mail TEXT NOT NULL,
      cc_mail TEXT NULL,
      subject VARCHAR(500) NOT NULL,
      content MEDIUMTEXT NOT NULL,
      remarks TEXT NULL,
      sender_email VARCHAR(320) NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await ensureFormSubmissionEmailsTable();
  tableReady = true;
}

/**
 * Persist a form-triggered outbound email for the admin Primary & CC Mails inbox.
 */
export async function recordFormSubmissionEmail({
  formType,
  sourceId = null,
  primaryMail,
  ccMail = "",
  subject,
  content,
  remarks = "",
  senderEmail = null,
}) {
  try {
    await ensureTable();

    await db.execute(
      `INSERT INTO form_submission_emails
        (form_type, source_id, primary_mail, cc_mail, subject, content, remarks, sender_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formType,
        sourceId,
        primaryMail,
        ccMail || "",
        subject,
        content,
        remarks || "",
        senderEmail,
      ]
    );
  } catch (err) {
    console.warn("[Email] Failed to record form submission email:", err);
  }
}

export function formatAppointmentEmailContent(appointment) {
  const lines = [
    `New appointment request from ${appointment.name || "Unknown"}`,
    "",
    `Counselling Type: ${appointment.counselling_type || "—"}`,
    `Sub Types: ${appointment.sub_counselling_types || appointment.remarks || "—"}`,
    `Description: ${appointment.description || "—"}`,
    "",
    `NRIC/FIN: ${appointment.nric_fin_number || "—"}`,
    `Email: ${appointment.email || "—"}`,
    `Phone: ${appointment.phone || "—"}`,
    `Age: ${appointment.age ?? "—"}`,
    `Gender: ${appointment.gender || "—"}`,
    `Nationality: ${appointment.nationality || "—"}`,
  ];

  if (appointment.remarks) {
    lines.push("", `Remarks: ${appointment.remarks}`);
  }

  return lines.join("\n");
}

export function formatApplicationEmailContent(data) {
  return [
    `New ${data.formLabel || "application"} from ${data.firstName || ""} ${data.lastName || ""}`.trim(),
    "",
    `Position: ${data.jobTitle || "—"}`,
    `Application Ref: ${data.applicationNumber || "—"}`,
    `Applicant Email: ${data.email || "—"}`,
    `Status: ${data.status || "submitted"}`,
  ].join("\n");
}

export function formatVolunteerEmailContent(volunteer) {
  const lines = [
    `New volunteer application from ${volunteer.name || "Unknown"}`,
    "",
    `Email: ${volunteer.email || "—"}`,
    `Phone (H/P): ${volunteer.phone_hp || "—"}`,
    `Phone (Res): ${volunteer.phone_res || "—"}`,
    `Address: ${volunteer.address || "—"}`,
    `Citizenship: ${volunteer.citizenship || "—"}`,
    `Age: ${volunteer.age ?? "—"}`,
    `Gender: ${volunteer.gender || "—"}`,
    "",
    `Interest Areas: ${volunteer.interest_areas || "—"}`,
    `Other Contribution: ${volunteer.other_contribution || "—"}`,
    `Skills & Hobbies: ${volunteer.skills_hobbies || "—"}`,
    `Preferred Days: ${volunteer.preferred_days || "—"}`,
    `Time: ${volunteer.time_from || "—"} - ${volunteer.time_to || "—"}`,
    `Commitment: ${volunteer.commitment_duration || "—"} ${volunteer.commitment_unit || ""}`,
  ];
  return lines.join("\n");
}
