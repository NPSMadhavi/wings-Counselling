-- ============================================================
-- WINGS Counselling Centre – Database Setup Script (MySQL)
-- MySQL 8.0+
-- Run this script once to create all required tables.
-- Usage: mysql -u <user> -p <database> < database_mysql.sql
-- ============================================================

-- ─── Team Members ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            TEXT NOT NULL,
  title           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'counsellor',
  bio             TEXT NOT NULL DEFAULT '',
  credentials     JSON NOT NULL,
  specialisations JSON NOT NULL,
  photo_url       TEXT,
  email           TEXT,
  display_order   INT NOT NULL DEFAULT 0,
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Articles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         VARCHAR(500) NOT NULL UNIQUE,
  excerpt      TEXT NOT NULL DEFAULT '',
  content      LONGTEXT NOT NULL DEFAULT '',
  cover_image  TEXT,
  author       TEXT NOT NULL DEFAULT 'WINGS Team',
  category     TEXT NOT NULL DEFAULT 'General',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Careers / Jobs ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  job_id          VARCHAR(100) UNIQUE,
  title           TEXT NOT NULL,
  department      TEXT NOT NULL DEFAULT '',
  location        TEXT NOT NULL DEFAULT 'Kuala Lumpur',
  description     LONGTEXT NOT NULL DEFAULT '',
  requirements    LONGTEXT NOT NULL DEFAULT '',
  employment_type TEXT NOT NULL DEFAULT 'Full-Time',
  salary_range    TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  posted_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  closes_at       DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Candidates ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT NOT NULL DEFAULT '',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Job Applications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  application_number    VARCHAR(50) NOT NULL UNIQUE,
  job_id                INT,
  candidate_id          INT,
  status                TEXT NOT NULL DEFAULT 'submitted',
  resume_url            TEXT DEFAULT '',
  cover_letter          LONGTEXT NOT NULL DEFAULT '',
  current_employer      TEXT NOT NULL DEFAULT '',
  years_experience      TEXT NOT NULL DEFAULT '',
  highest_qualification TEXT NOT NULL DEFAULT '',
  specialisations       JSON NOT NULL,
  linkedin_url          TEXT NOT NULL DEFAULT '',
  notice_period         TEXT NOT NULL DEFAULT '',
  expected_salary       TEXT NOT NULL DEFAULT '',
  admin_notes           LONGTEXT NOT NULL DEFAULT '',
  submitted_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES careers(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- ─── Interview Slots (admin-scheduled interviews) ─────────────────────────────
CREATE TABLE IF NOT EXISTS interview_slots (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  application_id   INT,
  date             TEXT NOT NULL,
  time_slot        TEXT NOT NULL,
  duration         INT NOT NULL DEFAULT 60,
  interviewer_name TEXT NOT NULL DEFAULT '',
  location         TEXT NOT NULL DEFAULT '',
  meeting_link     TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'scheduled',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES job_applications(id)
);

-- ─── Interview Availability (open slots candidates can book) ──────────────────
CREATE TABLE IF NOT EXISTS interview_availability (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  date                  TEXT NOT NULL,
  time_slot             TEXT NOT NULL,
  duration              INT NOT NULL DEFAULT 45,
  interviewer_name      TEXT NOT NULL DEFAULT '',
  location              TEXT NOT NULL DEFAULT '',
  meeting_link          TEXT NOT NULL DEFAULT '',
  notes                 TEXT NOT NULL DEFAULT '',
  is_booked             BOOLEAN NOT NULL DEFAULT FALSE,
  booked_application_id INT,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Interview Custom Requests (candidate-requested alternative times) ────────
CREATE TABLE IF NOT EXISTS interview_custom_requests (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  application_id      INT NOT NULL,
  candidate_id        INT NOT NULL,
  preferred_date      TEXT NOT NULL,
  preferred_time_slot TEXT NOT NULL,
  notes               TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'pending',
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES job_applications(id)
);

-- ─── Event Subscribers ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_subscribers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  title                TEXT NOT NULL,
  description          LONGTEXT NOT NULL DEFAULT '',
  photo_urls           JSON NOT NULL,
  event_date           DATETIME,
  location             TEXT DEFAULT '',
  registration_url     TEXT DEFAULT '',
  show_donation_button BOOLEAN NOT NULL DEFAULT FALSE,
  is_published         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- All tables created. You may now follow LOCAL_SETUP.md to start the API server.
