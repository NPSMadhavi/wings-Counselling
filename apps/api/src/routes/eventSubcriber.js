import { Router } from "express";
import { ddb as db, eventSubscribers } from "../config/db.js";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

/* Public — subscribe */
router.post("/event-subscribe", async (req, res) => {
  const { email } = req.body ?? {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  try {
    await db.insert(eventSubscribers).values({ email: email.toLowerCase().trim() });
    return res.status(201).json({ ok: true });
  } catch (e) {
    if (e?.code === "23505" || e?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "already_subscribed" });
    }
    res.status(500).json({ error: e.message });
  }
});

/* Admin — list subscribers */
router.get("/admin/event-subscribers", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(eventSubscribers).orderBy(desc(eventSubscribers.subscribedAt));
  res.json(rows);
});

/* Admin — delete subscriber */
router.delete("/admin/event-subscribers/:id", requireAdmin, async (req, res) => {
  await db.delete(eventSubscribers).where(eq(eventSubscribers.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;

