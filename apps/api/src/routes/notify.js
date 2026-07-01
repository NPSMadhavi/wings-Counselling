import { Router } from "express";
import {
  ensureNotifyTables,
  subscribe,
  subscribeAll,
  getSubscriberByToken,
  unsubscribeByToken,
  listNotifySubscribersForAdmin,
} from "../lib/notifyService.js";
import { sendSubscribeConfirmationEmail } from "../lib/email.js";
import { requireAdmin } from "../middlewares/auth.js";
import {
  renderUnsubscribeConfirmPage,
  renderUnsubscribeSuccessPage,
  renderUnsubscribeErrorPage,
} from "../lib/unsubscribePages.js";

const router = Router();

const subscribeAttempts = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;

function rateLimitSubscribe(req, res, next) {
  const key = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const entry = subscribeAttempts.get(key) || { count: 0, resetAt: now + RATE_WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }

  entry.count += 1;
  subscribeAttempts.set(key, entry);

  if (entry.count > RATE_MAX) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  return next();
}

/* POST /api/notify/subscribe */
router.post("/notify/subscribe", rateLimitSubscribe, async (req, res) => {
  try {
    const { email, type } = req.body ?? {};
    const normalizedType = String(type ?? "").trim().toLowerCase();
    const result =
      normalizedType === "all"
        ? await subscribeAll(email)
        : await subscribe(email, type);

    if (!result.ok) {
      return res.status(result.status || 400).json({ error: result.error });
    }

    if (result.alreadySubscribed) {
      return res.status(409).json({
        ok: false,
        alreadySubscribed: true,
        error: "This email is already subscribed. Please enter another email.",
        message: "This email is already subscribed. Please enter another email.",
      });
    }

    const message =
      normalizedType === "all"
        ? "Thank you! You will receive updates when new articles and events are published."
        : result.type === "event"
          ? "Thank you! You will receive an email whenever a new event is published."
          : "Thank you! You will receive an email whenever a new article is published.";

    sendSubscribeConfirmationEmail({
      email: String(email ?? "").trim().toLowerCase(),
      type: normalizedType === "all" ? "all" : result.type ?? normalizedType,
      subscribers: result.subscribers ?? null,
      subscriber: result.subscriber ?? null,
    }).catch((err) => {
      console.error("[Notify] subscribe confirmation email failed:", err?.message);
    });

    return res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error("[Notify] subscribe error:", err?.message);
    return res.status(500).json({ error: "Failed to subscribe. Please try again." });
  }
});

/* GET /api/notify/unsubscribe/:token/status — validate token for React page */
router.get("/notify/unsubscribe/:token/status", async (req, res) => {
  try {
    const subscriber = await getSubscriberByToken(req.params.token);
    if (!subscriber.ok) {
      return res.status(subscriber.status || 404).json({ ok: false, error: subscriber.error });
    }
    return res.json({
      ok: true,
      alreadyUnsubscribed: Boolean(subscriber.alreadyUnsubscribed),
    });
  } catch (err) {
    console.error("[Notify] unsubscribe status error:", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong." });
  }
});

/* POST /api/notify/unsubscribe/:token/confirm — remove from DB (React page) */
router.post("/notify/unsubscribe/:token/confirm", async (req, res) => {
  try {
    const result = await unsubscribeByToken(req.params.token);
    if (!result.ok && result.status !== 404) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[Notify] unsubscribe confirm error:", err?.message);
    return res.status(500).json({ ok: false, error: "Something went wrong." });
  }
});

/* GET /api/notify/unsubscribe/:token/confirm — confirm + success page (email links) */
router.get("/notify/unsubscribe/:token/confirm", async (req, res) => {
  try {
    const result = await unsubscribeByToken(req.params.token);
    if (!result.ok) {
      if (result.status === 404) {
        return res.type("html").send(renderUnsubscribeSuccessPage());
      }
      return res
        .status(result.status || 400)
        .type("html")
        .send(renderUnsubscribeErrorPage(result.error || "Unable to unsubscribe."));
    }
    return res.type("html").send(renderUnsubscribeSuccessPage());
  } catch (err) {
    console.error("[Notify] unsubscribe confirm error:", err?.message);
    return res
      .status(500)
      .type("html")
      .send(renderUnsubscribeErrorPage("Something went wrong. Please try again later."));
  }
});

/* GET /api/notify/unsubscribe/:token — confirmation page (served as HTML from API) */
router.get("/notify/unsubscribe/:token", async (req, res) => {
  try {
    const subscriber = await getSubscriberByToken(req.params.token);
    if (!subscriber.ok) {
      return res
        .status(subscriber.status || 404)
        .type("html")
        .send(renderUnsubscribeErrorPage(subscriber.error || "Invalid unsubscribe link."));
    }
    if (subscriber.alreadyUnsubscribed) {
      return res.type("html").send(renderUnsubscribeSuccessPage());
    }
    return res.type("html").send(renderUnsubscribeConfirmPage(req.params.token));
  } catch (err) {
    console.error("[Notify] unsubscribe page error:", err?.message);
    return res
      .status(500)
      .type("html")
      .send(renderUnsubscribeErrorPage("Something went wrong. Please try again later."));
  }
});

/* GET /api/admin/notify-subscribers — article & event notify lists */
router.get("/admin/notify-subscribers", requireAdmin, async (_req, res) => {
  try {
    const data = await listNotifySubscribersForAdmin();
    return res.json(data);
  } catch (err) {
    console.error("[Notify] admin list error:", err?.message);
    return res.status(500).json({ error: "Failed to load notify subscribers." });
  }
});

export { ensureNotifyTables };
export default router;
