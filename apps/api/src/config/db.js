import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  mysqlTable, 
  serial, 
  text, 
  varchar, 
  boolean, 
  datetime, 
  json, 
  int, 
  longtext 
} from "drizzle-orm/mysql-core";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "wings",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = pool;
export const ddb = drizzle(pool);

/* --- Drizzle Schemas --- */
export const teamMembers = mysqlTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  role: text("role").notNull().default("counsellor"),
  bio: text("bio").notNull().default(""),
  credentials: json("credentials").notNull(),
  specialisations: json("specialisations").notNull(),
  photoUrl: text("photo_url"),
  email: text("email"),
  displayOrder: int("display_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const articles = mysqlTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: longtext("content").notNull().default(""),
  coverImage: text("cover_image"),
  author: text("author").notNull().default("WINGS Team"),
  category: text("category").notNull().default("General"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: datetime("published_at"),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const careers = mysqlTable("careers", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 100 }).unique(),
  title: text("title").notNull(),
  department: text("department").notNull().default(""),
  location: text("location").notNull().default("Kuala Lumpur"),
  description: longtext("description").notNull().default(""),
  requirements: longtext("requirements").notNull().default(""),
  employmentType: text("employment_type").notNull().default("Full-Time"),
  salaryRange: text("salary_range").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  postedAt: datetime("posted_at").default(new Date()),
  closesAt: datetime("closes_at"),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const candidates = mysqlTable("candidates", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull().default(""),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const jobApplications = mysqlTable("job_applications", {
  id: serial("id").primaryKey(),
  applicationNumber: varchar("application_number", { length: 50 }).notNull().unique(),
  jobId: int("job_id"),
  candidateId: int("candidate_id"),
  status: text("status").notNull().default("submitted"),
  resumeUrl: text("resume_url").default(""),
  coverLetter: longtext("cover_letter").notNull().default(""),
  currentEmployer: text("current_employer").notNull().default(""),
  yearsExperience: text("years_experience").notNull().default(""),
  highestQualification: text("highest_qualification").notNull().default(""),
  specialisations: json("specialisations").notNull(),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  noticePeriod: text("notice_period").notNull().default(""),
  expectedSalary: text("expected_salary").notNull().default(""),
  adminNotes: longtext("admin_notes").notNull().default(""),
  submittedAt: datetime("submitted_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});

export const interviewSlots = mysqlTable("interview_slots", {
  id: serial("id").primaryKey(),
  applicationId: int("application_id"),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  duration: int("duration").notNull().default(60),
  interviewerName: text("interviewer_name").notNull().default(""),
  location: text("location").notNull().default(""),
  meetingLink: text("meeting_link").notNull().default(""),
  status: text("status").notNull().default("scheduled"),
  createdAt: datetime("created_at").default(new Date())
});

export const interviewAvailability = mysqlTable("interview_availability", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  duration: int("duration").notNull().default(45),
  interviewerName: text("interviewer_name").notNull().default(""),
  location: text("location").notNull().default(""),
  meetingLink: text("meeting_link").notNull().default(""),
  notes: text("notes").notNull().default(""),
  isBooked: boolean("is_booked").notNull().default(false),
  bookedApplicationId: int("booked_application_id"),
  createdAt: datetime("created_at").default(new Date())
});

export const interviewCustomRequests = mysqlTable("interview_custom_requests", {
  id: serial("id").primaryKey(),
  applicationId: int("application_id"),
  candidateId: int("candidate_id"),
  preferredDate: text("preferred_date").notNull(),
  preferredTimeSlot: text("preferred_time_slot").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: datetime("created_at").default(new Date())
});

export const eventSubscribers = mysqlTable("event_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  subscribedAt: datetime("subscribed_at").default(new Date())
});

export const events = mysqlTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: longtext("description").notNull().default(""),
  photoUrls: json("photo_urls").notNull(),
  eventDate: datetime("event_date"),
  location: text("location").default(""),
  registrationUrl: text("registration_url").default(""),
  showDonationButton: boolean("show_donation_button").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date())
});