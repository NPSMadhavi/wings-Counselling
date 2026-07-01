import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import "./env.js";

import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

import {
  prepareQuery,
  formatQueryResult,
  toPgPlaceholders,
} from "./pg-helpers.js";

const { Pool } = pg;

function getPoolConfig() {
  const shared = {
    max: Number(process.env.PG_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30_000,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS) || 5_000,
    ssl:
      process.env.PG_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  };

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ...shared };
  }

  return {
    host: process.env.PG_HOST || process.env.DB_HOST || "localhost",
    port: Number(process.env.PG_PORT || process.env.DB_PORT) || 5433,
    user: process.env.PG_USER || process.env.DB_USER || "postgres",
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.PG_NAME || process.env.DB_NAME || "postgres",
    ...shared,
  };
}

const pool = new Pool(getPoolConfig());

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected pool error:", err.message);
});

async function runQuery(client, sql, params = []) {
  const { text, values, isInsert } = prepareQuery(sql, params);
  const result = await client.query(text, values);
  return formatQueryResult(result, isInsert);
}

async function query(sql, params = []) {
  return runQuery(pool, sql, params);
}

async function execute(sql, params = []) {
  return query(sql, params);
}

async function getConnection() {
  const client = await pool.connect();
  return {
    query: (sql, params) => runQuery(client, sql, params),
    execute: (sql, params) => runQuery(client, sql, params),
    beginTransaction: async () => {
      await client.query("BEGIN");
    },
    commit: async () => {
      await client.query("COMMIT");
    },
    rollback: async () => {
      await client.query("ROLLBACK");
    },
    release: () => client.release(),
  };
}

/** Get column names for a table via information_schema */
export async function getTableColumns(tableName) {
  const [rows] = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName.toLowerCase()]
  );
  return rows.map((r) => r.column_name);
}

/** Check if a table exists */
export async function tableExists(tableName) {
  const [rows] = await query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = current_schema()
       AND table_name = $1`,
    [tableName.toLowerCase()]
  );
  return rows.length > 0;
}

/** Check if a column exists on a table */
export async function columnExists(tableName, columnName) {
  const [rows] = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
       AND column_name = $2`,
    [tableName.toLowerCase(), columnName.toLowerCase()]
  );
  return rows.length > 0;
}

export async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT NOW() AS now");
    console.log("[PostgreSQL] Connection OK:", result.rows[0]?.now);
    return { ok: true, timestamp: result.rows[0]?.now };
  } catch (err) {
    const hints = {
      ECONNREFUSED:
        "PostgreSQL is not running or PG_PORT is wrong (this machine listens on 5433, not 5433).",
      "28P01": "Wrong password — update PG_PASSWORD in apps/api/.env.",
      "3D000": 'Database missing — run: CREATE DATABASE "Wings";',
    };
    const hint = hints[err?.code] ? ` Hint: ${hints[err.code]}` : "";
    console.error("[PostgreSQL] Connection failed:", err.message + hint);
    throw err;
  } finally {
    client?.release();
  }
}

export const db = { query, execute, getConnection, pool };
export { pool, query, execute, getConnection, toPgPlaceholders };
export const ddb = drizzle(pool);

/* ================= DRIZZLE SCHEMAS (PostgreSQL) ================= */

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  role: text("role").notNull().default("counsellor"),
  bio: text("bio").notNull().default(""),
  credentials: jsonb("credentials").notNull(),
  specialisations: jsonb("specialisations").notNull(),
  photoUrl: text("photo_url"),
  email: text("email"),
  displayOrder: integer("display_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  coverImage: text("cover_image"),
  author: text("author").notNull().default("WINGS Team"),
  category: text("category").notNull().default("General"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 100 }).unique(),
  title: text("title").notNull(),
  department: text("department").notNull().default(""),
  location: text("location").notNull().default("Kuala Lumpur"),
  description: text("description").notNull().default(""),
  requirements: text("requirements").notNull().default(""),
  employmentType: text("employment_type").notNull().default("Full-Time"),
  salaryRange: text("salary_range").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  postedAt: timestamp("posted_at").defaultNow(),
  closesAt: timestamp("closes_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("job_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  applicationNumber: varchar("application_number", { length: 50 }).notNull().unique(),
  jobId: integer("job_id"),
  candidateId: integer("candidate_id"),
  status: text("status").notNull().default("submitted"),
  resumeUrl: text("resume_url").default(""),
  coverLetter: text("cover_letter").notNull().default(""),
  currentEmployer: text("current_employer").notNull().default(""),
  yearsExperience: text("years_experience").notNull().default(""),
  highestQualification: text("highest_qualification").notNull().default(""),
  specialisations: jsonb("specialisations").notNull(),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  noticePeriod: text("notice_period").notNull().default(""),
  expectedSalary: text("expected_salary").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interviewSlots = pgTable("interview_slots", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id"),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  duration: integer("duration").notNull().default(60),
  interviewerName: text("interviewer_name").notNull().default(""),
  location: text("location").notNull().default(""),
  meetingLink: text("meeting_link").notNull().default(""),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewAvailability = pgTable("interview_availability", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  duration: integer("duration").notNull().default(45),
  interviewerName: text("interviewer_name").notNull().default(""),
  location: text("location").notNull().default(""),
  meetingLink: text("meeting_link").notNull().default(""),
  notes: text("notes").notNull().default(""),
  isBooked: boolean("is_booked").notNull().default(false),
  bookedApplicationId: integer("booked_application_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviewCustomRequests = pgTable("interview_custom_requests", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id"),
  candidateId: integer("candidate_id"),
  preferredDate: text("preferred_date").notNull(),
  preferredTimeSlot: text("preferred_time_slot").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventSubscribers = pgTable("event_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

export const notifySubscribers = pgTable("notify_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mailLogs = pgTable("mail_logs", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id"),
  email: varchar("email", { length: 320 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  referenceId: integer("reference_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  photoUrls: jsonb("photo_urls").notNull(),
  eventDate: timestamp("event_date"),
  location: text("location").default(""),
  registrationUrl: text("registration_url").default(""),
  showDonationButton: boolean("show_donation_button").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
