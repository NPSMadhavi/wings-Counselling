import { Router } from "express";
import { db } from "../config/db.js";
import { requireAdmin } from "../middlewares/auth.js";
import { subscribe } from "../lib/notifyService.js";

const router = Router();

/* Public — subscribe (legacy endpoint, event type only) */
router.post("/event-subscribe", async (req, res) => {
  const { email } = req.body ?? {};
  try {
    const result = await subscribe(email, "event");

    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    if (result.alreadySubscribed) {
      return res.status(409).json({
        error: "This email is already subscribed. Please enter another email.",
        alreadySubscribed: true,
      });
    }

    return res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* Admin — list event subscribers */
router.get("/admin/event-subscribers", requireAdmin, async (_req, res) => {
  const [rows] = await db.execute(
    `SELECT id, email, created_at
     FROM events_notify
     WHERE status = 'active'
     ORDER BY created_at DESC`
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      subscribedAt: r.created_at,
    }))
  );
});

/* Admin — unsubscribe / remove subscriber */
router.delete("/admin/event-subscribers/:id", requireAdmin, async (req, res) => {
  await db.execute(`DELETE FROM events_notify WHERE id = ?`, [Number(req.params.id)]);
  res.json({ ok: true });
});

export default router;
