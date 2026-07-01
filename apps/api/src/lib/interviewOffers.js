import { db } from "../config/db.js";

export const INTERVIEW_BOOKING_STATUSES = [
  "Shortlisted",
  "Round 1 Selected",
  "Round 2 Selected",
  "Reschedule Interview",
  "Reschedule Round 1",
  "Reschedule Round 2",
  "Reschedule Round 3",
];

export function statusAllowsInterviewBooking(status) {
  return INTERVIEW_BOOKING_STATUSES.includes(String(status || "").trim());
}

let offersTableReady = false;

export async function ensureApplicationInterviewOffersTable() {
  if (offersTableReady) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS application_interview_offers (
      id SERIAL PRIMARY KEY,
      application_id INT NOT NULL,
      availability_id INT NOT NULL,
      round_status VARCHAR(80) NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (application_id, availability_id)
    )
  `);
  offersTableReady = true;
}

/** Slots currently enabled in the admin calendar (active dates × active time settings). */
export async function fetchEligibleAvailabilitySlotIds() {
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await db.execute(
    `SELECT ia.id
     FROM interview_availability ia
     INNER JOIN interview_dates d ON d.date = ia.date AND d.is_active = true
     INNER JOIN interview_slot_settings s ON s.time_slot = ia.time_slot AND s.is_active = true
     WHERE ia.is_booked = false
       AND ia.date::date >= ?::date
     ORDER BY ia.date::date ASC, ia.time_slot ASC`,
    [today]
  );
  return rows.map((row) => row.id);
}

export async function snapshotInterviewOffersForApplication(applicationId, roundStatus = "") {
  await ensureApplicationInterviewOffersTable();
  const slotIds = await fetchEligibleAvailabilitySlotIds();

  await db.execute(
    `DELETE FROM application_interview_offers WHERE application_id = ?`,
    [applicationId]
  );

  for (const availabilityId of slotIds) {
    await db.execute(
      `INSERT INTO application_interview_offers (application_id, availability_id, round_status)
       VALUES (?, ?, ?)
       ON CONFLICT (application_id, availability_id) DO NOTHING`,
      [applicationId, availabilityId, roundStatus]
    );
  }

  console.log(
    `[Interview] Snapshotted ${slotIds.length} offer(s) for applicationId=${applicationId} round="${roundStatus}"`
  );
  return slotIds.length;
}

export async function clearInterviewOffersForApplication(applicationId) {
  await ensureApplicationInterviewOffersTable();
  await db.execute(
    `DELETE FROM application_interview_offers WHERE application_id = ?`,
    [applicationId]
  );
}

export async function countOffersForApplication(applicationId) {
  await ensureApplicationInterviewOffersTable();
  const [rows] = await db.execute(
    `SELECT COUNT(*)::int AS count FROM application_interview_offers WHERE application_id = ?`,
    [applicationId]
  );
  return Number(rows[0]?.count ?? 0);
}

export async function fetchOfferedSlotsForApplication(applicationId) {
  await ensureApplicationInterviewOffersTable();
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await db.execute(
    `SELECT
       ia.id,
       ia.date,
       ia.time_slot AS "timeSlot",
       ia.duration,
       ia.interviewer_name AS "interviewerName",
       ia.location,
       ia.meeting_link AS "meetingLink",
       ia.notes
     FROM application_interview_offers o
     INNER JOIN interview_availability ia ON ia.id = o.availability_id
     WHERE o.application_id = ?
       AND ia.is_booked = false
       AND ia.date::date >= ?::date
     ORDER BY ia.date::date ASC, ia.time_slot ASC`,
    [applicationId, today]
  );
  return rows;
}

export async function isSlotOfferedToApplication(applicationId, availabilityId) {
  await ensureApplicationInterviewOffersTable();
  const [rows] = await db.execute(
    `SELECT o.id
     FROM application_interview_offers o
     INNER JOIN interview_availability ia ON ia.id = o.availability_id
     WHERE o.application_id = ?
       AND o.availability_id = ?
       AND ia.is_booked = false
     LIMIT 1`,
    [applicationId, availabilityId]
  );
  return rows.length > 0;
}

export function mapOfferedSlotRow(row) {
  return {
    id: row.id,
    date: row.date,
    timeSlot: row.timeSlot ?? row.timeslot ?? row.time_slot ?? "",
    duration: row.duration,
    interviewerName: row.interviewerName ?? row.interviewername ?? row.interviewer_name ?? "",
    location: row.location ?? "",
    meetingLink: row.meetingLink ?? row.meetinglink ?? row.meeting_link ?? "",
    notes: row.notes ?? "",
  };
}
