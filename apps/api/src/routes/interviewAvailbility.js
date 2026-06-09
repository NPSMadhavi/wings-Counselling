// import { Router } from "express";
// import {
//   ddb as db,
//   interviewAvailability,
//   interviewSlots,
//   interviewCustomRequests,
//   jobApplications,
//   candidates,
//   careers
// } from "../config/db.js";

// import { eq, desc } from "drizzle-orm";
// import { requireAdmin } from "../middlewares/auth.js";
// import { requireCandidate } from "./candidates.js";
// import { broadcastToAdmin, broadcastToCandidate } from "../lib/sse.js";
// import { sendInterviewInvite } from "../lib/email.js";

// const router = Router();

// /* ─── Admin: List all availability slots ────────────────────────────────── */
// router.get("/admin/interview-availability", requireAdmin, async (_req, res) => {
//   const slots = await db
//     .select()
//     .from(interviewAvailability)
//     .orderBy(interviewAvailability.date, interviewAvailability.timeSlot);

//   res.json(slots);
// });

// /* ─── Admin: Create availability slot ───────────────────────────────────── */
// router.post("/admin/interview-availability", requireAdmin, async (req, res) => {
//   const { date, timeSlot, duration, interviewerName, location, meetingLink, notes } = req.body;

//   if (!date || !timeSlot) {
//     res.status(400).json({ error: "date and timeSlot are required" });
//     return;
//   }

//   const [slot] = await db.insert(interviewAvailability).values({
//     date,
//     timeSlot,
//     duration: duration ?? 45,
//     interviewerName: interviewerName ?? "",
//     location: location ?? "",
//     meetingLink: meetingLink ?? "",
//     notes: notes ?? "",
//   });

//   res.status(201).json(slot);
// });

// /* ─── Admin: Bulk create availability slots ─────────────────────────────── */
// router.post("/admin/interview-availability/bulk", requireAdmin, async (req, res) => {
//   const { slots } = req.body;

//   if (!Array.isArray(slots) || slots.length === 0) {
//     res.status(400).json({ error: "slots array is required" });
//     return;
//   }

//   const created = [];

//   for (const s of slots) {
//     if (!s.date || !s.timeSlot) continue;

//     const [slot] = await db.insert(interviewAvailability).values({
//       date: s.date,
//       timeSlot: s.timeSlot,
//       duration: s.duration ?? 45,
//       interviewerName: s.interviewerName ?? "",
//       location: s.location ?? "",
//       meetingLink: s.meetingLink ?? "",
//       notes: s.notes ?? "",
//     });

//     created.push(slot);
//   }

//   res.status(201).json(created);
// });

// /* ─── Admin: Delete availability slot ───────────────────────────────────── */
// router.delete("/admin/interview-availability/:id", requireAdmin, async (req, res) => {
//   const id = Number(req.params.id);

//   const existing = await db
//     .select()
//     .from(interviewAvailability)
//     .where(eq(interviewAvailability.id, id));

//   if (existing.length === 0) {
//     res.status(404).json({ error: "Not found" });
//     return;
//   }

//   if (existing[0].isBooked) {
//     res.status(400).json({ error: "Cannot delete a booked slot" });
//     return;
//   }

//   await db.delete(interviewAvailability).where(eq(interviewAvailability.id, id));

//   res.json({ ok: true });
// });

// /* ─── Candidate: List available slots ───────────────────────────────────── */
// router.get("/candidate/interview-availability", requireCandidate, async (_req, res) => {
//   const now = new Date().toISOString().slice(0, 10);

//   const slots = await db
//     .select()
//     .from(interviewAvailability)
//     .where(eq(interviewAvailability.isBooked, false))
//     .orderBy(interviewAvailability.date, interviewAvailability.timeSlot);

//   const future = slots.filter(s => s.date >= now);

//   res.json(future);
// });

// /* ─── Candidate: Book interview slot ────────────────────────────────────── */
// router.post("/candidate/applications/:id/book-interview", requireCandidate, async (req, res) => {
//   const appId = Number(req.params.id);
//   const { availabilityId } = req.body;

//   if (!availabilityId) {
//     res.status(400).json({ error: "availabilityId is required" });
//     return;
//   }

//   const apps = await db.select().from(jobApplications).where(eq(jobApplications.id, appId));
//   if (apps.length === 0) {
//     res.status(404).json({ error: "Application not found" });
//     return;
//   }

//   const app = apps[0];

//   if (app.candidateId !== req.candidate.id) {
//     res.status(403).json({ error: "Forbidden" });
//     return;
//   }

//   if (app.status !== "shortlisted") {
//     res.status(400).json({ error: "Only shortlisted applications can book interviews" });
//     return;
//   }

//   const availRows = await db
//     .select()
//     .from(interviewAvailability)
//     .where(eq(interviewAvailability.id, Number(availabilityId)));

//   if (availRows.length === 0) {
//     res.status(404).json({ error: "Slot not found" });
//     return;
//   }

//   const avail = availRows[0];

//   if (avail.isBooked) {
//     res.status(409).json({ error: "This slot has already been booked" });
//     return;
//   }

//   await db.update(interviewAvailability)
//     .set({ isBooked: true, bookedApplicationId: appId })
//     .where(eq(interviewAvailability.id, avail.id));

//   const [slot] = await db.insert(interviewSlots).values({
//     applicationId: appId,
//     date: avail.date,
//     timeSlot: avail.timeSlot,
//     duration: avail.duration,
//     interviewerName: avail.interviewerName,
//     location: avail.location,
//     meetingLink: avail.meetingLink,
//     status: "scheduled",
//   });

//   const candidateRows = await db.select().from(candidates).where(eq(candidates.id, req.candidate.id));
//   const candidate = candidateRows[0];

//   const jobRows = app.jobId
//     ? await db.select().from(careers).where(eq(careers.id, app.jobId))
//     : [];

//   const job = jobRows[0];

//   broadcastToAdmin("interview_booked", {
//     applicationId: appId,
//     applicationNumber: app.applicationNumber,
//     candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "Candidate",
//     jobTitle: job?.title ?? "",
//     date: avail.date,
//     timeSlot: avail.timeSlot,
//   });

//   if (candidate && job) {
//     sendInterviewInvite(candidate.email, {
//       firstName: candidate.firstName,
//       jobTitle: job.title,
//       applicationNumber: app.applicationNumber,
//       date: avail.date,
//       timeSlot: avail.timeSlot,
//       duration: avail.duration,
//       interviewerName: avail.interviewerName || "WINGS HR Team",
//       location: avail.location,
//       meetingLink: avail.meetingLink,
//     }).catch(err => console.error("[Email] Interview confirmation failed:", err));
//   }

//   res.status(201).json(slot);
// });

// /* ─── Candidate: Request custom interview time ─────────────────────────── */
// router.post("/candidate/applications/:id/request-interview-time", requireCandidate, async (req, res) => {
//   const appId = Number(req.params.id);
//   const { preferredDate, preferredTimeSlot, notes } = req.body;

//   if (!preferredDate || !preferredTimeSlot) {
//     res.status(400).json({ error: "preferredDate and preferredTimeSlot are required" });
//     return;
//   }

//   const apps = await db.select().from(jobApplications).where(eq(jobApplications.id, appId));
//   if (apps.length === 0) {
//     res.status(404).json({ error: "Application not found" });
//     return;
//   }

//   if (apps[0].candidateId !== req.candidate.id) {
//     res.status(403).json({ error: "Forbidden" });
//     return;
//   }

//   if (apps[0].status !== "shortlisted") {
//     res.status(400).json({ error: "Only shortlisted applications can request interview times" });
//     return;
//   }

//   const [request] = await db.insert(interviewCustomRequests).values({
//     applicationId: appId,
//     candidateId: req.candidate.id,
//     preferredDate,
//     preferredTimeSlot,
//     notes: notes ?? "",
//     status: "pending",
//   });

//   const candidateRows = await db.select().from(candidates).where(eq(candidates.id, req.candidate.id));
//   const candidate = candidateRows[0];

//   const jobRows = apps[0].jobId
//     ? await db.select().from(careers).where(eq(careers.id, apps[0].jobId))
//     : [];

//   const job = jobRows[0];

//   broadcastToAdmin("interview_time_requested", {
//     requestId: request.id,
//     applicationId: appId,
//     applicationNumber: apps[0].applicationNumber,
//     candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "Candidate",
//     jobTitle: job?.title ?? "",
//     preferredDate,
//     preferredTimeSlot,
//     notes,
//   });

//   res.status(201).json(request);
// });

// /* ─── Admin: list requests ─────────────────────────────────────────────── */
// router.get("/admin/interview-custom-requests", requireAdmin, async (_req, res) => {
//   const requests = await db
//     .select({
//       id: interviewCustomRequests.id,
//       applicationId: interviewCustomRequests.applicationId,
//       candidateId: interviewCustomRequests.candidateId,
//       preferredDate: interviewCustomRequests.preferredDate,
//       preferredTimeSlot: interviewCustomRequests.preferredTimeSlot,
//       notes: interviewCustomRequests.notes,
//       status: interviewCustomRequests.status,
//       createdAt: interviewCustomRequests.createdAt,
//       applicationNumber: jobApplications.applicationNumber,
//       candidateName: candidates.firstName,
//       candidateLastName: candidates.lastName,
//       jobTitle: careers.title,
//     })
//     .from(interviewCustomRequests)
//     .leftJoin(jobApplications, eq(interviewCustomRequests.applicationId, jobApplications.id))
//     .leftJoin(candidates, eq(interviewCustomRequests.candidateId, candidates.id))
//     .leftJoin(careers, eq(jobApplications.jobId, careers.id))
//     .orderBy(desc(interviewCustomRequests.createdAt));

//   res.json(requests);
// });

// /* ─── Admin: update request ────────────────────────────────────────────── */
// router.put("/admin/interview-custom-requests/:id", requireAdmin, async (req, res) => {
//   const id = Number(req.params.id);
//   const { status } = req.body;

//   if (!status) {
//     res.status(400).json({ error: "status is required" });
//     return;
//   }

//   await db
//     .update(interviewCustomRequests)
//     .set({ status })
//     .where(eq(interviewCustomRequests.id, id));

//   res.json({ ok: true });
// });

// export default router;
