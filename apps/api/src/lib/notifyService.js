import crypto from "crypto";
import { db } from "../config/db.js";
import { isUniqueViolation } from "../config/pg-helpers.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TYPES = new Set(["article", "event"]);

let tablesReadyPromise;

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function createUnsubscribeToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function ensureNotifySubscribersTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notify_subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(320) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('article', 'event')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
      unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_notify_email_type UNIQUE (email, type)
    )
  `).catch(() => {});
}

/** Create notify_subscribers + mail_logs tables. */
export async function ensureNotifyTables() {
  if (!tablesReadyPromise) {
    tablesReadyPromise = (async () => {
      await ensureNotifySubscribersTable();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS mail_logs (
          id SERIAL PRIMARY KEY,
          subscriber_id INT,
          email VARCHAR(320) NOT NULL,
          type VARCHAR(20) NOT NULL CHECK (type IN ('article', 'event')),
          reference_id INT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'sent',
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT uq_mail_log UNIQUE (email, type, reference_id)
        )
      `);
    })();
  }
  return tablesReadyPromise;
}

export function validateSubscribeInput(email, type) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedType = String(type ?? "").trim().toLowerCase();

  if (!normalizedEmail) {
    return { ok: false, status: 400, error: "Email is required." };
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, status: 400, error: "Please enter a valid email address." };
  }
  if (!VALID_TYPES.has(normalizedType)) {
    return { ok: false, status: 400, error: "Type must be article or event." };
  }

  return { ok: true, email: normalizedEmail, type: normalizedType };
}

function toSubscriber(row, email, type) {
  return {
    id: row.id,
    email,
    type,
    unsubscribe_token: row.unsubscribe_token,
  };
}

/** Subscribe an email to article or event notifications. */
export async function subscribe(email, type) {
  await ensureNotifyTables();

  const validation = validateSubscribeInput(email, type);
  if (!validation.ok) return validation;

  const { email: normalizedEmail, type: normalizedType } = validation;

  const [existing] = await db.execute(
    `SELECT id, unsubscribe_token, status
     FROM notify_subscribers
     WHERE LOWER(email) = ? AND type = ?
     LIMIT 1`,
    [normalizedEmail, normalizedType]
  );

  if (existing.length) {
    const row = existing[0];
    if (row.status === "active") {
      return {
        ok: true,
        alreadySubscribed: true,
        subscriber: toSubscriber(row, normalizedEmail, normalizedType),
      };
    }

    const token = row.unsubscribe_token || createUnsubscribeToken();
    await db.execute(
      `UPDATE notify_subscribers
       SET status = 'active', unsubscribe_token = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [token, row.id]
    );

    return {
      ok: true,
      alreadySubscribed: false,
      subscriber: toSubscriber({ ...row, unsubscribe_token: token }, normalizedEmail, normalizedType),
    };
  }

  try {
    const token = createUnsubscribeToken();
    const [result] = await db.execute(
      `INSERT INTO notify_subscribers (email, type, status, unsubscribe_token)
       VALUES (?, ?, 'active', ?)`,
      [normalizedEmail, normalizedType, token]
    );

    return {
      ok: true,
      alreadySubscribed: false,
      subscriber: toSubscriber(
        { id: result.insertId, unsubscribe_token: token },
        normalizedEmail,
        normalizedType
      ),
    };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: true, alreadySubscribed: true };
    }
    throw err;
  }
}

/** Subscribe to both article and event notifications (footer). */
export async function subscribeAll(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { ok: false, status: 400, error: "Email is required." };
  }
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, status: 400, error: "Please enter a valid email address." };
  }

  const articleResult = await subscribe(normalizedEmail, "article");
  if (!articleResult.ok) return articleResult;

  const eventResult = await subscribe(normalizedEmail, "event");
  if (!eventResult.ok) return eventResult;

  return {
    ok: true,
    type: "all",
    alreadySubscribed: Boolean(articleResult.alreadySubscribed && eventResult.alreadySubscribed),
    subscribers: {
      article: articleResult.subscriber ?? null,
      event: eventResult.subscriber ?? null,
    },
    subscriber: articleResult.subscriber ?? eventResult.subscriber ?? null,
  };
}

/** Look up subscriber by unsubscribe token. */
export async function getSubscriberByToken(token) {
  await ensureNotifyTables();

  const cleanToken = String(token ?? "").trim();
  if (!cleanToken) {
    return { ok: false, status: 400, error: "Invalid unsubscribe link." };
  }

  const [rows] = await db.execute(
    `SELECT id, email, type, status
     FROM notify_subscribers
     WHERE unsubscribe_token = ?
     LIMIT 1`,
    [cleanToken]
  );

  if (!rows.length) {
    return { ok: false, status: 404, error: "Subscription not found." };
  }

  const row = rows[0];
  return {
    ok: true,
    alreadyUnsubscribed: row.status === "unsubscribed",
    email: row.email,
    type: row.type,
    id: row.id,
  };
}

/** Unsubscribe via token — sets status to unsubscribed (no more emails). */
export async function unsubscribeByToken(token) {
  await ensureNotifyTables();

  const cleanToken = String(token ?? "").trim();
  if (!cleanToken) {
    return { ok: false, status: 400, error: "Invalid unsubscribe link." };
  }

  const [rows] = await db.execute(
    `SELECT id, email, type, status
     FROM notify_subscribers
     WHERE unsubscribe_token = ?
     LIMIT 1`,
    [cleanToken]
  );

  if (!rows.length) {
    return { ok: false, status: 404, error: "Subscription not found." };
  }

  const row = rows[0];
  if (row.status === "unsubscribed") {
    return {
      ok: true,
      alreadyUnsubscribed: true,
      email: row.email,
      type: row.type,
    };
  }

  await db.execute(
    `UPDATE notify_subscribers
     SET status = 'unsubscribed', updated_at = CURRENT_TIMESTAMP
     WHERE LOWER(email) = ?`,
    [normalizeEmail(row.email)]
  );

  return { ok: true, email: row.email, type: row.type };
}

/** Active subscribers only — unsubscribed users are skipped. */
export async function getActiveSubscribers(type) {
  await ensureNotifyTables();

  const normalizedType = String(type ?? "").trim().toLowerCase();
  if (!VALID_TYPES.has(normalizedType)) return [];

  const [rows] = await db.execute(
    `SELECT id, email, unsubscribe_token
     FROM notify_subscribers
     WHERE type = ? AND status = 'active'
     ORDER BY id ASC`,
    [normalizedType]
  );

  return rows;
}

export async function wasNotificationSent(email, type, referenceId) {
  await ensureNotifyTables();

  const [rows] = await db.execute(
    `SELECT id FROM mail_logs
     WHERE email = ? AND type = ? AND reference_id = ? AND status = 'sent'
     LIMIT 1`,
    [normalizeEmail(email), type, Number(referenceId)]
  );

  return rows.length > 0;
}

export async function recordMailLog({ subscriberId, email, type, referenceId, status = "sent" }) {
  await ensureNotifyTables();

  try {
    await db.execute(
      `INSERT INTO mail_logs (subscriber_id, email, type, reference_id, status)
       VALUES (?, ?, ?, ?, ?)`,
      [subscriberId ?? null, normalizeEmail(email), type, Number(referenceId), status]
    );
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }
}

/** Admin — list article & event notify subscribers. */
export async function listNotifySubscribersForAdmin() {
  await ensureNotifyTables();

  const [rows] = await db.execute(
    `SELECT id, email, type, status, created_at, updated_at
     FROM notify_subscribers
     ORDER BY id DESC`
  );

  const mapRow = (row) => ({
    id: row.id,
    email: row.email,
    type: row.type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  return {
    articles: rows.filter((r) => r.type === "article").map(mapRow),
    events: rows.filter((r) => r.type === "event").map(mapRow),
  };
}
