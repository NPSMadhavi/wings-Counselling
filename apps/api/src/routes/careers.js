// // careers.js - Complete Backend API for Recruitment Platform (ES Modules version)
// // Includes all MCQ endpoints, Q&A endpoints, and admin functionality

// import express from 'express';
// import mysql from 'mysql2/promise';
// import cors from 'cors';
// import bcrypt from 'bcryptjs';
// import crypto from 'crypto';
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const nodemailer = require('nodemailer');
// import session from 'express-session';
// import MySQLStore from 'express-mysql-session';

// const app = express();

// // =============================================================================
// // CONFIGURATION
// // =============================================================================

// const PORT = process.env.PORT || 5000;

// // Database configuration
// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'wings_db',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// };

// // Session store configuration
// const MySQLStoreSession = MySQLStore(session);
// const sessionStore = new MySQLStoreSession({
//   expiration: 7 * 24 * 60 * 60 * 1000,
//   createDatabaseTable: true,
//   schema: {
//     tableName: 'sessions',
//     columnNames: {
//       session_id: 'sid',
//       expires: 'expire',
//       data: 'sess'
//     }
//   }
// });

// // Email configuration
// const emailTransporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.SMTP_PORT) || 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   }
// });

// // Application constants
// const APPLICATION_STATUSES = [
//   'Pending', 'Under Review', 'Shortlisted', 'Round 1 Scheduled',
//   'Round 1 Completed', 'Round 1 Selected', 'Round 1 Not Selected',
//   'Reschedule Round 1', 'Round 2 Scheduled', 'Round 2 Completed',
//   'Round 2 Selected', 'Round 2 Not Selected', 'Reschedule Round 2',
//   'Round 3 Scheduled', 'Round 3 Completed', 'Round 3 Selected',
//   'Round 3 Not Selected', 'Reschedule Round 3', 'Interview Scheduled',
//   'Selected', 'Not Selected', 'Rejected - Candidate non responsive',
//   'Withdrawn by Candidate'
// ];

// const DEFAULT_ROUND1_SLOTS = ['07:30', '08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30'];
// const DEFAULT_ROUND2_SLOTS = ['07:30', '09:30', '11:30', '13:30', '15:30'];
// const DEFAULT_ROUND3_SLOTS = ['07:30', '08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30'];

// // Admin sessions management
// const adminSessions = new Map();

// // =============================================================================
// // DATABASE CONNECTION
// // =============================================================================

// let pool = null;

// async function initDatabase() {
//   try {
//     pool = await mysql.createPool(dbConfig);
//     console.log('✅ Database connected successfully');
//     await createTables();
//     await seedDefaultData();
//     return pool;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error.message);
//     throw error;
//   }
// }

// async function createTables() {
//   const queries = [
//     // Users table
//     `CREATE TABLE IF NOT EXISTS users (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       email VARCHAR(255) NOT NULL UNIQUE,
//       password TEXT NOT NULL,
//       first_name VARCHAR(255) NOT NULL,
//       last_name VARCHAR(255) NOT NULL,
//       mobile_number VARCHAR(50),
//       email_verified TINYINT(1) NOT NULL DEFAULT 0,
//       email_otp VARCHAR(20),
//       email_otp_expiry DATETIME,
//       password_reset_otp VARCHAR(20),
//       password_reset_otp_expiry DATETIME,
//       is_blocked TINYINT(1) NOT NULL DEFAULT 0,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
//     )`,

//     // Contact submissions table
//     `CREATE TABLE IF NOT EXISTS contact_submissions (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       first_name TEXT NOT NULL,
//       last_name TEXT NOT NULL,
//       email TEXT NOT NULL,
//       company TEXT,
//       project_details LONGTEXT NOT NULL,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
//     )`,

//     // Job categories table
//     `CREATE TABLE IF NOT EXISTS job_categories (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       name TEXT NOT NULL,
//       description TEXT
//     )`,

//     // Job postings table
//     `CREATE TABLE IF NOT EXISTS job_postings (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       job_id VARCHAR(100) NOT NULL UNIQUE,
//       title TEXT NOT NULL,
//       category_id INT NOT NULL,
//       location TEXT NOT NULL,
//       employment_type TEXT NOT NULL,
//       experience TEXT NOT NULL,
//       summary TEXT NOT NULL,
//       description LONGTEXT NOT NULL,
//       requirements LONGTEXT NOT NULL,
//       is_active TINYINT(1) NOT NULL DEFAULT 1,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (category_id) REFERENCES job_categories(id)
//     )`,

//     // Job applications table
//     `CREATE TABLE IF NOT EXISTS job_applications (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       job_id INT NOT NULL,
//       user_id INT NOT NULL,
//       cover_letter LONGTEXT NOT NULL,
//       resume_path TEXT NOT NULL,
//       status VARCHAR(100) NOT NULL DEFAULT 'Pending',
//       admin_remarks TEXT,
//       internal_remarks TEXT,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       screening_full_name TEXT,
//       screening_dob VARCHAR(20),
//       screening_gender VARCHAR(20),
//       screening_current_location TEXT,
//       screening_willing_work_from_office VARCHAR(20),
//       screening_willing_provide_exp_docs VARCHAR(20),
//       screening_willing_bank_statements VARCHAR(20),
//       screening_years_experience VARCHAR(50),
//       screening_educational_qualification TEXT,
//       screening_current_ctc VARCHAR(100),
//       screening_expected_ctc VARCHAR(100),
//       screening_willing_background_check VARCHAR(20),
//       screening_notice_period VARCHAR(100),
//       screening_willing_join_date VARCHAR(20),
//       screening_updated_at DATETIME,
//       interview_available_from VARCHAR(50),
//       interview_available_to VARCHAR(50),
//       interview_preferred_time VARCHAR(100),
//       interview_updated_at DATETIME,
//       scheduled_interview_date VARCHAR(50),
//       scheduled_interview_time VARCHAR(50),
//       interview_confirmation_token VARCHAR(255),
//       interview_confirmed TINYINT(1) DEFAULT 0,
//       interview_confirmed_at DATETIME,
//       meeting_link TEXT,
//       current_round INT DEFAULT 0,
//       last_rejected_at DATETIME,
//       rejection_stage VARCHAR(100),
//       under_review_at DATETIME,
//       screening_reminder_count INT DEFAULT 0,
//       screening_reminder_last_sent_at DATETIME,
//       FOREIGN KEY (job_id) REFERENCES job_postings(id),
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // User profiles table
//     `CREATE TABLE IF NOT EXISTS user_profiles (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       user_id INT NOT NULL UNIQUE,
//       date_of_birth VARCHAR(20),
//       gender VARCHAR(20),
//       address TEXT,
//       city VARCHAR(100),
//       state VARCHAR(100),
//       country VARCHAR(100),
//       pincode VARCHAR(20),
//       highest_education TEXT,
//       education_details TEXT,
//       current_job_title VARCHAR(255),
//       current_company VARCHAR(255),
//       total_experience VARCHAR(100),
//       skills TEXT,
//       linkedin_url TEXT,
//       github_url TEXT,
//       portfolio_url TEXT,
//       resume_path TEXT,
//       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // User certifications table
//     `CREATE TABLE IF NOT EXISTS user_certifications (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       user_id INT NOT NULL,
//       certificate_name TEXT NOT NULL,
//       issuing_organization TEXT NOT NULL,
//       issue_date VARCHAR(20),
//       expiry_date VARCHAR(20),
//       certificate_number VARCHAR(100),
//       certificate_url TEXT,
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // User work experience table
//     `CREATE TABLE IF NOT EXISTS user_work_experience (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       user_id INT NOT NULL,
//       company_name TEXT NOT NULL,
//       job_title TEXT NOT NULL,
//       location TEXT,
//       start_date VARCHAR(20) NOT NULL,
//       end_date VARCHAR(20),
//       is_current TINYINT(1) DEFAULT 0,
//       description TEXT,
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // Interview available dates table
//     `CREATE TABLE IF NOT EXISTS interview_available_dates (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       available_date VARCHAR(20) NOT NULL,
//       is_active TINYINT(1) NOT NULL DEFAULT 1,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//       UNIQUE KEY unique_date (available_date)
//     )`,

//     // Interview bookings table
//     `CREATE TABLE IF NOT EXISTS interview_bookings (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       date_id INT NOT NULL DEFAULT 0,
//       application_id INT NOT NULL,
//       user_id INT NOT NULL,
//       booked_date VARCHAR(20) NOT NULL,
//       start_time VARCHAR(10) NOT NULL,
//       end_time VARCHAR(10) NOT NULL,
//       status VARCHAR(50) NOT NULL DEFAULT 'pending',
//       availability_state VARCHAR(50) NOT NULL DEFAULT 'booked',
//       blocked_reason TEXT,
//       confirmation_token VARCHAR(255),
//       confirmed_at DATETIME,
//       round INT NOT NULL DEFAULT 1,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//       FOREIGN KEY (application_id) REFERENCES job_applications(id),
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // Admin notifications table
//     `CREATE TABLE IF NOT EXISTS admin_notifications (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       type VARCHAR(100) NOT NULL,
//       title TEXT NOT NULL,
//       message TEXT NOT NULL,
//       application_id INT,
//       booking_id INT,
//       is_read TINYINT(1) NOT NULL DEFAULT 0,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
//     )`,

//     // Interview slot settings table
//     `CREATE TABLE IF NOT EXISTS interview_slot_settings (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       round INT NOT NULL,
//       time_slot VARCHAR(10) NOT NULL,
//       is_active TINYINT(1) NOT NULL DEFAULT 1,
//       UNIQUE KEY unique_round_slot (round, time_slot)
//     )`,

//     // MCQ Sessions table
//     `CREATE TABLE IF NOT EXISTS mcq_sessions (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       application_id INT NOT NULL,
//       job_id INT NOT NULL,
//       user_id INT NOT NULL,
//       status VARCHAR(50) NOT NULL DEFAULT 'pending',
//       generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       started_at DATETIME,
//       submitted_at DATETIME,
//       expires_at DATETIME,
//       score INT,
//       total_questions INT NOT NULL DEFAULT 30,
//       pass_threshold INT NOT NULL DEFAULT 28,
//       passed TINYINT(1),
//       warning_count INT NOT NULL DEFAULT 0,
//       auto_submitted TINYINT(1) NOT NULL DEFAULT 0,
//       questions_json JSON,
//       FOREIGN KEY (application_id) REFERENCES job_applications(id),
//       FOREIGN KEY (job_id) REFERENCES job_postings(id),
//       FOREIGN KEY (user_id) REFERENCES users(id)
//     )`,

//     // MCQ Questions table
//     `CREATE TABLE IF NOT EXISTS mcq_questions (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       session_id INT NOT NULL,
//       question_order INT NOT NULL,
//       question_text TEXT NOT NULL,
//       option_a TEXT NOT NULL,
//       option_b TEXT NOT NULL,
//       option_c TEXT NOT NULL,
//       option_d TEXT NOT NULL,
//       correct_answer VARCHAR(1) NOT NULL,
//       category VARCHAR(50) NOT NULL,
//       difficulty VARCHAR(20) NOT NULL,
//       explanation TEXT,
//       FOREIGN KEY (session_id) REFERENCES mcq_sessions(id) ON DELETE CASCADE
//     )`,

//     // MCQ Answers table
//     `CREATE TABLE IF NOT EXISTS mcq_answers (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       session_id INT NOT NULL,
//       question_id INT NOT NULL,
//       selected_answer VARCHAR(1),
//       is_correct TINYINT(1),
//       submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (session_id) REFERENCES mcq_sessions(id) ON DELETE CASCADE,
//       FOREIGN KEY (question_id) REFERENCES mcq_questions(id) ON DELETE CASCADE
//     )`,

//     // Application Questions table (Q&A)
//     `CREATE TABLE IF NOT EXISTS application_questions (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       application_id INT NOT NULL,
//       question_text TEXT NOT NULL,
//       question_type VARCHAR(50) NOT NULL,
//       options JSON,
//       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (application_id) REFERENCES job_applications(id)
//     )`,

//     // Application Answers table
//     `CREATE TABLE IF NOT EXISTS application_answers (
//       id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
//       question_id INT NOT NULL,
//       application_id INT NOT NULL,
//       answer_text TEXT NOT NULL,
//       answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (question_id) REFERENCES application_questions(id),
//       FOREIGN KEY (application_id) REFERENCES job_applications(id)
//     )`
//   ];

//   for (const query of queries) {
//     await pool.execute(query);
//   }
//   console.log('✅ Tables created/verified');
// }

// async function seedDefaultData() {
//   // Seed default job categories
//   const categories = [
//     { name: "Software Development", description: "Web apps, APIs, and product engineering roles" },
//     { name: "AI / Machine Learning", description: "Model development, automation, and applied AI roles" },
//     { name: "DevOps / Cloud", description: "Infrastructure, deployment, and cloud engineering roles" },
//     { name: "Networking", description: "Network engineering and systems roles" },
//     { name: "Cybersecurity", description: "Security engineering and risk management roles" }
//   ];

//   const [existing] = await pool.execute('SELECT COUNT(*) as count FROM job_categories');
//   if (existing[0].count === 0) {
//     for (const cat of categories) {
//       await pool.execute('INSERT INTO job_categories (name, description) VALUES (?, ?)', [cat.name, cat.description]);
//     }
//     console.log('✅ Default job categories seeded');
//   }

//   // Seed default interview slot settings
//   const [slotExists] = await pool.execute('SELECT COUNT(*) as count FROM interview_slot_settings');
//   if (slotExists[0].count === 0) {
//     const allSlots = [
//       ...DEFAULT_ROUND1_SLOTS.map(ts => ({ round: 1, timeSlot: ts })),
//       ...DEFAULT_ROUND2_SLOTS.map(ts => ({ round: 2, timeSlot: ts })),
//       ...DEFAULT_ROUND3_SLOTS.map(ts => ({ round: 3, timeSlot: ts }))
//     ];
//     for (const slot of allSlots) {
//       await pool.execute('INSERT INTO interview_slot_settings (round, time_slot, is_active) VALUES (?, ?, 1)', [slot.round, slot.timeSlot]);
//     }
//     console.log('✅ Default interview slot settings seeded');
//   }
// }

// // =============================================================================
// // MIDDLEWARE
// // =============================================================================

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors({ origin: true, credentials: true }));

// app.use(session({
//   secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
//   resave: false,
//   saveUninitialized: false,
//   store: sessionStore,
//   proxy: true,
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//     maxAge: 7 * 24 * 60 * 60 * 1000
//   }
// }));

// // =============================================================================
// // HELPER FUNCTIONS
// // =============================================================================

// function generateSessionToken() {
//   return crypto.randomBytes(32).toString('hex');
// }

// function isValidSession(token) {
//   const session = adminSessions.get(token);
//   if (!session) return false;
//   if (new Date() > session.expiresAt) {
//     adminSessions.delete(token);
//     return false;
//   }
//   return true;
// }

// function isUserAuthenticated(req, res, next) {
//   if (req.session.userId) {
//     next();
//   } else {
//     res.status(401).json({ success: false, message: "Please log in to continue" });
//   }
// }

// function isAdminAuthenticated(req, res, next) {
//   const token = req.headers.authorization?.replace('Bearer ', '');
//   if (!token || !isValidSession(token)) {
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }
//   next();
// }

// async function sendEmail(to, subject, html) {
//   try {
//     await emailTransporter.sendMail({
//       from: process.env.SMTP_FROM || 'noreply@netopsys.in',
//       to,
//       subject,
//       html
//     });
//     return true;
//   } catch (error) {
//     console.error('Email send error:', error);
//     return false;
//   }
// }

// // =============================================================================
// // AUTHENTICATION ROUTES
// // =============================================================================

// app.post("/api/auth/register", async (req, res) => {
//   try {
//     const { email, password, firstName, lastName, confirmPassword } = req.body;
//     if (!email || !password || !firstName || !lastName) {
//       return res.status(400).json({ success: false, message: "All fields are required" });
//     }
//     if (password !== confirmPassword) {
//       return res.status(400).json({ success: false, message: "Passwords do not match" });
//     }
//     if (password.length < 6) {
//       return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
//     }

//     const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       return res.status(400).json({ success: false, message: "An account with this email already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const [result] = await pool.execute(
//       'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
//       [email, hashedPassword, firstName, lastName]
//     );

//     req.session.userId = result.insertId;
//     res.json({ success: true, user: { id: result.insertId, email, firstName, lastName } });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ success: false, message: "Registration failed. Please try again." });
//   }
// });

// app.post("/api/auth/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: "Email and password are required" });
//     }

//     const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
//     if (users.length === 0) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     const user = users[0];
//     if (user.is_blocked) {
//       return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
//     }

//     const isValidPassword = await bcrypt.compare(password, user.password);
//     if (!isValidPassword) {
//       return res.status(401).json({ success: false, message: "Invalid email or password" });
//     }

//     req.session.userId = user.id;
//     res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name } });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ success: false, message: "Login failed. Please try again." });
//   }
// });

// app.post("/api/auth/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) return res.status(500).json({ success: false, message: "Logout failed" });
//     res.json({ success: true });
//   });
// });

// app.get("/api/auth/user", async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ success: false, message: "Not authenticated" });
//   }
//   const [users] = await pool.execute(
//     'SELECT id, email, first_name, last_name, mobile_number, email_verified FROM users WHERE id = ?',
//     [req.session.userId]
//   );
//   if (users.length === 0) {
//     req.session.destroy(() => { });
//     return res.status(401).json({ success: false, message: "User not found" });
//   }
//   const user = users[0];
//   res.json({
//     id: user.id,
//     email: user.email,
//     firstName: user.first_name,
//     lastName: user.last_name,
//     mobileNumber: user.mobile_number,
//     emailVerified: user.email_verified === 1
//   });
// });

// app.post("/api/auth/forgot-password", async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ success: false, message: "Email is required." });

//     const [users] = await pool.execute('SELECT id, first_name FROM users WHERE email = ?', [email]);
//     if (users.length === 0) {
//       return res.json({ success: true, message: "If that email exists, a reset code has been sent." });
//     }

//     const user = users[0];
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiry = new Date(Date.now() + 10 * 60 * 1000);

//     await pool.execute('UPDATE users SET password_reset_otp = ?, password_reset_otp_expiry = ? WHERE id = ?', [otp, expiry, user.id]);
//     await sendEmail(email, 'Password Reset - Netopsys Careers', `<h2>Password Reset Request</h2><p>Hello ${user.first_name},</p><p>Use OTP: <strong>${otp}</strong> to reset your password. Valid for 10 minutes.</p>`);

//     res.json({ success: true, message: "Password reset code sent to your email." });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     res.status(500).json({ success: false, message: "Failed to process request." });
//   }
// });

// app.post("/api/auth/reset-password", async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;
//     if (!email || !otp || !newPassword) {
//       return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
//     }
//     if (newPassword.length < 6) {
//       return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
//     }

//     const [users] = await pool.execute('SELECT id, password_reset_otp, password_reset_otp_expiry FROM users WHERE email = ?', [email]);
//     if (users.length === 0) return res.status(400).json({ success: false, message: "Invalid request." });

//     const user = users[0];
//     if (!user.password_reset_otp || !user.password_reset_otp_expiry) {
//       return res.status(400).json({ success: false, message: "No reset request found. Please request a new code." });
//     }
//     if (new Date() > new Date(user.password_reset_otp_expiry)) {
//       return res.status(400).json({ success: false, message: "Reset code has expired. Please request a new one." });
//     }
//     if (user.password_reset_otp !== otp) {
//       return res.status(400).json({ success: false, message: "Invalid code. Please try again." });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await pool.execute('UPDATE users SET password = ?, password_reset_otp = NULL, password_reset_otp_expiry = NULL WHERE id = ?', [hashedPassword, user.id]);
//     res.json({ success: true, message: "Password reset successfully! You can now log in." });
//   } catch (error) {
//     console.error("Reset password error:", error);
//     res.status(500).json({ success: false, message: "Failed to reset password." });
//   }
// });

// // =============================================================================
// // USER PROFILE ROUTES
// // =============================================================================

// app.get("/api/profile", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [profiles] = await pool.execute('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
//     const [certifications] = await pool.execute('SELECT * FROM user_certifications WHERE user_id = ?', [userId]);
//     const [workExperience] = await pool.execute('SELECT * FROM user_work_experience WHERE user_id = ? ORDER BY start_date DESC', [userId]);
//     const [applications] = await pool.execute(`
//       SELECT ja.*, jp.title as job_title, jp.job_id as job_id_code
//       FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id
//       WHERE ja.user_id = ? ORDER BY ja.created_at DESC
//     `, [userId]);

//     res.json({ profile: profiles[0] || null, certifications, workExperience, applications });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch profile" });
//   }
// });

// app.patch("/api/profile", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const profileData = req.body;
//     const [existing] = await pool.execute('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);

//     if (existing.length > 0) {
//       const updates = Object.keys(profileData).map(key => `${key} = ?`).join(', ');
//       await pool.execute(`UPDATE user_profiles SET ${updates} WHERE user_id = ?`, [...Object.values(profileData), userId]);
//     } else {
//       const columns = ['user_id', ...Object.keys(profileData)];
//       const placeholders = ['?', ...Object.keys(profileData).map(() => '?')];
//       await pool.execute(`INSERT INTO user_profiles (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, [userId, ...Object.values(profileData)]);
//     }
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update profile" });
//   }
// });

// app.patch("/api/user", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { firstName, lastName, mobileNumber } = req.body;
//     await pool.execute('UPDATE users SET first_name = ?, last_name = ?, mobile_number = ? WHERE id = ?', [firstName, lastName, mobileNumber, userId]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update user" });
//   }
// });

// app.post("/api/certifications", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { certificateName, issuingOrganization, issueDate, expiryDate, certificateNumber, certificateUrl } = req.body;
//     const [result] = await pool.execute(
//       `INSERT INTO user_certifications (user_id, certificate_name, issuing_organization, issue_date, expiry_date, certificate_number, certificate_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [userId, certificateName, issuingOrganization, issueDate, expiryDate, certificateNumber, certificateUrl]
//     );
//     res.json({ success: true, certification: { id: result.insertId, ...req.body } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to add certification" });
//   }
// });

// app.delete("/api/certifications/:id", isUserAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM user_certifications WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete certification" });
//   }
// });

// app.post("/api/work-experience", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { companyName, jobTitle, location, startDate, endDate, isCurrent, description } = req.body;
//     const [result] = await pool.execute(
//       `INSERT INTO user_work_experience (user_id, company_name, job_title, location, start_date, end_date, is_current, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [userId, companyName, jobTitle, location, startDate, endDate, isCurrent ? 1 : 0, description]
//     );
//     res.json({ success: true, experience: { id: result.insertId, ...req.body } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to add work experience" });
//   }
// });

// app.delete("/api/work-experience/:id", isUserAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM user_work_experience WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete work experience" });
//   }
// });

// // =============================================================================
// // CONTACT ROUTES
// // =============================================================================

// app.post("/api/contact", async (req, res) => {
//   try {
//     const { firstName, lastName, email, company, projectDetails } = req.body;
//     if (!firstName || !lastName || !email || !projectDetails) {
//       return res.status(400).json({ success: false, message: "Please fill in all required fields correctly." });
//     }
//     await pool.execute('INSERT INTO contact_submissions (first_name, last_name, email, company, project_details) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email, company || null, projectDetails]);
//     res.json({ success: true, message: "Thank you for your message! We'll get back to you soon." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
//   }
// });

// // =============================================================================
// // JOB CATEGORIES ROUTES
// // =============================================================================

// app.get("/api/categories", async (req, res) => {
//   try {
//     const [categories] = await pool.execute('SELECT * FROM job_categories ORDER BY id');
//     res.json(categories);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve categories." });
//   }
// });

// app.get("/api/categories/:id", async (req, res) => {
//   try {
//     const [categories] = await pool.execute('SELECT * FROM job_categories WHERE id = ?', [req.params.id]);
//     if (categories.length === 0) return res.status(404).json({ success: false, message: "Category not found." });
//     res.json(categories[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve category." });
//   }
// });

// app.post("/api/categories", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     if (!name) return res.status(400).json({ success: false, message: "Category name is required." });
//     const [result] = await pool.execute('INSERT INTO job_categories (name, description) VALUES (?, ?)', [name, description || null]);
//     res.json({ id: result.insertId, name, description });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to create category." });
//   }
// });

// app.patch("/api/categories/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     const updates = [], values = [];
//     if (name !== undefined) { updates.push('name = ?'); values.push(name); }
//     if (description !== undefined) { updates.push('description = ?'); values.push(description); }
//     if (updates.length === 0) return res.status(400).json({ success: false, message: "No fields to update." });
//     values.push(req.params.id);
//     await pool.execute(`UPDATE job_categories SET ${updates.join(', ')} WHERE id = ?`, values);
//     const [categories] = await pool.execute('SELECT * FROM job_categories WHERE id = ?', [req.params.id]);
//     res.json(categories[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update category." });
//   }
// });

// app.delete("/api/categories/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [jobs] = await pool.execute('SELECT id FROM job_postings WHERE category_id = ? LIMIT 1', [req.params.id]);
//     if (jobs.length > 0) return res.status(400).json({ success: false, message: "Cannot delete category with existing jobs." });
//     await pool.execute('DELETE FROM job_categories WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete category." });
//   }
// });

// // =============================================================================
// // JOB POSTINGS ROUTES
// // =============================================================================

// app.get("/api/jobs", async (req, res) => {
//   try {
//     const activeOnly = req.query.active === 'true';
//     let query = `SELECT jp.*, jc.name as category_name FROM job_postings jp JOIN job_categories jc ON jp.category_id = jc.id`;
//     if (activeOnly) query += ' WHERE jp.is_active = 1';
//     query += ' ORDER BY jp.created_at DESC';
//     const [jobs] = await pool.execute(query);
//     res.json(jobs);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve jobs." });
//   }
// });

// app.get("/api/jobs/:id", async (req, res) => {
//   try {
//     const [jobs] = await pool.execute(`SELECT jp.*, jc.name as category_name FROM job_postings jp JOIN job_categories jc ON jp.category_id = jc.id WHERE jp.id = ?`, [req.params.id]);
//     if (jobs.length === 0) return res.status(404).json({ success: false, message: "Job not found." });
//     res.json(jobs[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve job." });
//   }
// });

// app.get("/api/jobs/by-job-id/:jobId", async (req, res) => {
//   try {
//     const [jobs] = await pool.execute(`SELECT jp.*, jc.name as category_name FROM job_postings jp JOIN job_categories jc ON jp.category_id = jc.id WHERE jp.job_id = ?`, [req.params.jobId]);
//     if (jobs.length === 0) return res.status(404).json({ success: false, message: "Job not found." });
//     res.json(jobs[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve job." });
//   }
// });

// app.post("/api/jobs", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { jobId, title, categoryId, location, employmentType, experience, summary, description, requirements, isActive = true } = req.body;
//     if (!jobId || !title || !categoryId || !location || !employmentType || !experience || !summary || !description || !requirements) {
//       return res.status(400).json({ success: false, message: "All fields are required." });
//     }
//     const [categories] = await pool.execute('SELECT id FROM job_categories WHERE id = ?', [categoryId]);
//     if (categories.length === 0) return res.status(400).json({ success: false, message: "Invalid category ID." });
//     const [result] = await pool.execute(`INSERT INTO job_postings (job_id, title, category_id, location, employment_type, experience, summary, description, requirements, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [jobId, title, categoryId, location, employmentType, experience, summary, description, requirements, isActive ? 1 : 0]);
//     const [newJob] = await pool.execute(`SELECT jp.*, jc.name as category_name FROM job_postings jp JOIN job_categories jc ON jp.category_id = jc.id WHERE jp.id = ?`, [result.insertId]);
//     res.json(newJob[0]);
//   } catch (error) {
//     console.error(error);
//     if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "Job ID already exists." });
//     res.status(500).json({ success: false, message: "Failed to create job." });
//   }
// });

// app.patch("/api/jobs/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     const updates = [], values = [];
//     const fields = ['job_id', 'title', 'category_id', 'location', 'employment_type', 'experience', 'summary', 'description', 'requirements', 'is_active'];
//     for (const field of fields) {
//       if (req.body[field] !== undefined) {
//         updates.push(`${field} = ?`);
//         values.push(field === 'is_active' ? (req.body[field] ? 1 : 0) : req.body[field]);
//       }
//     }
//     if (updates.length === 0) return res.status(400).json({ success: false, message: "No fields to update." });
//     values.push(req.params.id);
//     await pool.execute(`UPDATE job_postings SET ${updates.join(', ')} WHERE id = ?`, values);
//     const [jobs] = await pool.execute(`SELECT jp.*, jc.name as category_name FROM job_postings jp JOIN job_categories jc ON jp.category_id = jc.id WHERE jp.id = ?`, [req.params.id]);
//     res.json(jobs[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update job." });
//   }
// });

// app.delete("/api/jobs/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM job_applications WHERE job_id = ?', [req.params.id]);
//     await pool.execute('DELETE FROM job_postings WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete job." });
//   }
// });

// // =============================================================================
// // JOB APPLICATIONS ROUTES
// // =============================================================================

// app.post("/api/applications", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { jobId, coverLetter, resumePath } = req.body;
//     if (!jobId || !coverLetter || !resumePath) return res.status(400).json({ success: false, message: "All fields are required." });

//     const [recentRejections] = await pool.execute(`SELECT * FROM job_applications WHERE user_id = ? AND job_id = ? AND status IN ('Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected') AND last_rejected_at IS NOT NULL AND last_rejected_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)`, [userId, jobId]);
//     if (recentRejections.length > 0) {
//       const rejectionDate = new Date(recentRejections[0].last_rejected_at);
//       const cooldownEndDate = new Date(rejectionDate);
//       cooldownEndDate.setMonth(cooldownEndDate.getMonth() + 6);
//       return res.status(403).json({ success: false, message: `You may reapply after ${cooldownEndDate.toLocaleDateString('en-IN')}` });
//     }

//     const [existing] = await pool.execute('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?', [userId, jobId]);
//     if (existing.length > 0) return res.status(409).json({ success: false, message: "You have already applied for this job." });

//     const [jobs] = await pool.execute('SELECT * FROM job_postings WHERE id = ? AND is_active = 1', [jobId]);
//     if (jobs.length === 0) return res.status(400).json({ success: false, message: "Job posting not found or inactive." });

//     const [result] = await pool.execute('INSERT INTO job_applications (job_id, user_id, cover_letter, resume_path) VALUES (?, ?, ?, ?)', [jobId, userId, coverLetter, resumePath]);
//     res.json({ success: true, application: { id: result.insertId, ...req.body } });
//   } catch (error) {
//     console.error("Application error:", error);
//     res.status(500).json({ success: false, message: "Failed to submit application." });
//   }
// });

// app.get("/api/applications/my", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [applications] = await pool.execute(`SELECT ja.*, jp.title as job_title, jp.job_id as job_id_code FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE ja.user_id = ? ORDER BY ja.created_at DESC`, [userId]);
//     res.json(applications);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve applications." });
//   }
// });

// app.get("/api/applications/check/:jobId", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [applications] = await pool.execute('SELECT id FROM job_applications WHERE user_id = ? AND job_id = ?', [userId, req.params.jobId]);
//     res.json({ hasApplied: applications.length > 0 });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to check application status." });
//   }
// });

// app.get("/api/applications/:id", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [applications] = await pool.execute(`SELECT ja.*, jp.title as job_title, jp.job_id as job_id_code FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE ja.id = ? AND ja.user_id = ?`, [req.params.id, userId]);
//     if (applications.length === 0) return res.status(404).json({ success: false, message: "Application not found." });
//     res.json(applications[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to retrieve application." });
//   }
// });

// app.patch("/api/applications/:id/screening", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const applicationId = req.params.id;
//     const [applications] = await pool.execute('SELECT * FROM job_applications WHERE id = ? AND user_id = ?', [applicationId, userId]);
//     if (applications.length === 0) return res.status(404).json({ success: false, message: "Application not found." });
//     if (applications[0].status !== 'Under Review') return res.status(400).json({ success: false, message: "Screening details can only be updated when application is Under Review." });

//     const { screeningFullName, screeningDob, screeningGender, screeningCurrentLocation, screeningWillingWorkFromOffice, screeningWillingProvideExpDocs, screeningWillingBankStatements, screeningYearsExperience, screeningEducationalQualification, screeningCurrentCtc, screeningExpectedCtc, screeningWillingBackgroundCheck, screeningNoticePeriod, screeningWillingJoinDate } = req.body;

//     await pool.execute(`UPDATE job_applications SET screening_full_name = ?, screening_dob = ?, screening_gender = ?, screening_current_location = ?, screening_willing_work_from_office = ?, screening_willing_provide_exp_docs = ?, screening_willing_bank_statements = ?, screening_years_experience = ?, screening_educational_qualification = ?, screening_current_ctc = ?, screening_expected_ctc = ?, screening_willing_background_check = ?, screening_notice_period = ?, screening_willing_join_date = ?, screening_updated_at = NOW() WHERE id = ?`, [screeningFullName, screeningDob, screeningGender, screeningCurrentLocation, screeningWillingWorkFromOffice, screeningWillingProvideExpDocs, screeningWillingBankStatements, screeningYearsExperience, screeningEducationalQualification, screeningCurrentCtc, screeningExpectedCtc, screeningWillingBackgroundCheck, screeningNoticePeriod, screeningWillingJoinDate, applicationId]);

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Update screening error:", error);
//     res.status(500).json({ success: false, message: "Failed to update screening details." });
//   }
// });

// app.patch("/api/applications/:id/interview-availability", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const applicationId = req.params.id;
//     const { interviewAvailableFrom, interviewAvailableTo, interviewPreferredTime } = req.body;

//     const [applications] = await pool.execute('SELECT status FROM job_applications WHERE id = ? AND user_id = ?', [applicationId, userId]);
//     if (applications.length === 0) return res.status(404).json({ success: false, message: "Application not found." });

//     const allowedStatuses = ['Shortlisted', 'Reschedule Round 1', 'Reschedule Round 2', 'Reschedule Round 3'];
//     if (!allowedStatuses.includes(applications[0].status)) return res.status(400).json({ success: false, message: "Interview availability can only be set when application is Shortlisted or requires rescheduling." });

//     await pool.execute(`UPDATE job_applications SET interview_available_from = ?, interview_available_to = ?, interview_preferred_time = ?, interview_updated_at = NOW() WHERE id = ?`, [interviewAvailableFrom, interviewAvailableTo, interviewPreferredTime, applicationId]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error("Update interview availability error:", error);
//     res.status(500).json({ success: false, message: "Failed to update interview availability." });
//   }
// });

// // =============================================================================
// // INTERVIEW SLOT ROUTES (Candidate)
// // =============================================================================

// app.get("/api/interview-dates/available", isUserAuthenticated, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const todayStr = today.toISOString().split('T')[0];
//     const [dates] = await pool.execute(`SELECT id, available_date FROM interview_available_dates WHERE is_active = 1 AND available_date > ? ORDER BY available_date LIMIT 7`, [todayStr]);
//     const formattedDates = dates.map(date => ({ id: date.id, availableDate: date.available_date, displayDate: new Date(date.available_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }) }));
//     res.json(formattedDates);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch available dates." });
//   }
// });

// app.get("/api/interview-dates/:date/time-slots", isUserAuthenticated, async (req, res) => {
//   try {
//     const date = req.params.date;
//     const round = parseInt(req.query.round) || 1;

//     let slotsForRound = round === 2 ? DEFAULT_ROUND2_SLOTS : (round === 3 ? DEFAULT_ROUND3_SLOTS : DEFAULT_ROUND1_SLOTS);
//     const [settings] = await pool.execute('SELECT time_slot, is_active FROM interview_slot_settings WHERE round = ?', [round]);
//     if (settings.length > 0) slotsForRound = settings.filter(s => s.is_active === 1).map(s => s.time_slot);

//     const [bookings] = await pool.execute(`SELECT start_time, end_time, round FROM interview_bookings WHERE booked_date = ? AND status != 'cancelled' AND availability_state != 'blocked'`, [date]);
//     const roundBookings = bookings.filter(b => b.round === round);
//     const blockedTimes = new Set();
//     for (const booking of roundBookings) {
//       const startHour = parseInt(booking.start_time.split(':')[0]);
//       const startMin = booking.start_time.split(':')[1];
//       const endHour = parseInt(booking.end_time.split(':')[0]);
//       for (let h = startHour; h < endHour; h++) blockedTimes.add(`${String(h).padStart(2, '0')}:${startMin}`);
//     }
//     const availableSlots = slotsForRound.filter(slot => !blockedTimes.has(slot));
//     res.json({ date, availableSlots, allSlots: slotsForRound });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch time slots." });
//   }
// });

// app.post("/api/interview-dates/book", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { applicationId, bookedDate, startTime, round } = req.body;
//     if (!applicationId || !bookedDate || !startTime) return res.status(400).json({ success: false, message: "Application ID, date, and time are required." });

//     const [applications] = await pool.execute('SELECT * FROM job_applications WHERE id = ? AND user_id = ?', [applicationId, userId]);
//     if (applications.length === 0) return res.status(403).json({ success: false, message: "Application not found or unauthorized." });

//     const actualRound = round || 1;
//     const duration = actualRound === 2 ? 2 : 1;
//     const [hours, minutes] = startTime.split(':').map(Number);
//     const endTime = `${String(hours + duration).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

//     const [existing] = await pool.execute(`SELECT id FROM interview_bookings WHERE application_id = ? AND round = ? AND status NOT IN ('cancelled', 'blocked')`, [applicationId, actualRound]);
//     if (existing.length > 0) return res.status(400).json({ success: false, message: "You already have an interview booked for this application." });

//     const [bookingResult] = await pool.execute(`INSERT INTO interview_bookings (application_id, user_id, booked_date, start_time, end_time, round, date_id) VALUES (?, ?, ?, ?, ?, ?, 0)`, [applicationId, userId, bookedDate, startTime, endTime, actualRound]);

//     let statusUpdate = actualRound === 1 ? 'Round 1 Scheduled' : (actualRound === 2 ? 'Round 2 Scheduled' : 'Round 3 Scheduled');
//     await pool.execute(`UPDATE job_applications SET scheduled_interview_date = ?, scheduled_interview_time = ?, interview_confirmed = 1, interview_confirmed_at = NOW(), status = ?, current_round = ? WHERE id = ?`, [bookedDate, `${startTime} - ${endTime}`, statusUpdate, actualRound, applicationId]);

//     res.json({ success: true, booking: { id: bookingResult.insertId }, message: "Interview booked successfully!" });
//   } catch (error) {
//     console.error('Error booking interview slot:', error);
//     res.status(500).json({ success: false, message: "Failed to book interview slot." });
//   }
// });

// app.get("/api/applications/:applicationId/booking", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [applications] = await pool.execute('SELECT id FROM job_applications WHERE id = ? AND user_id = ?', [req.params.applicationId, userId]);
//     if (applications.length === 0) return res.status(403).json({ success: false, message: "Application not found or unauthorized." });
//     const [bookings] = await pool.execute(`SELECT * FROM interview_bookings WHERE application_id = ? AND status NOT IN ('cancelled', 'blocked') ORDER BY created_at DESC LIMIT 1`, [req.params.applicationId]);
//     res.json({ booking: bookings[0] || null });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch booking." });
//   }
// });

// app.delete("/api/bookings/:bookingId", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [bookings] = await pool.execute('SELECT application_id FROM interview_bookings WHERE id = ? AND user_id = ?', [req.params.bookingId, userId]);
//     if (bookings.length === 0) return res.status(403).json({ success: false, message: "Booking not found or unauthorized." });
//     await pool.execute('UPDATE interview_bookings SET status = "cancelled" WHERE id = ?', [req.params.bookingId]);
//     await pool.execute(`UPDATE job_applications SET scheduled_interview_date = NULL, scheduled_interview_time = NULL, interview_confirmed = 0, interview_confirmed_at = NULL, meeting_link = NULL WHERE id = ?`, [bookings[0].application_id]);
//     res.json({ success: true, message: "Booking cancelled successfully." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to cancel booking." });
//   }
// });

// // =============================================================================
// // ADMIN ROUTES
// // =============================================================================

// app.post("/api/admin/login", async (req, res) => {
//   try {
//     const password = req.body?.password?.trim() || "";
//     const adminPassword = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
//     if (!adminPassword) return res.status(500).json({ success: false, message: "Admin password not configured." });
//     if (!password || password !== adminPassword) return res.status(401).json({ success: false, message: "Invalid password." });
//     const token = generateSessionToken();
//     adminSessions.set(token, { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
//     res.json({ success: true, token });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Login failed." });
//   }
// });

// app.post("/api/admin/verify", async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (!token || !isValidSession(token)) return res.status(401).json({ success: false, message: "Invalid or expired session." });
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Verification failed." });
//   }
// });

// app.post("/api/admin/logout", async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (token) adminSessions.delete(token);
//     res.json({ success: true });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Logout failed." });
//   }
// });

// app.get("/api/admin/applications", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [applications] = await pool.execute(`
//       SELECT ja.*, u.first_name, u.last_name, u.email as user_email, jp.title as job_title, jp.job_id as job_id_code, jp.category_id, jc.name as category_name
//       FROM job_applications ja
//       JOIN users u ON ja.user_id = u.id
//       JOIN job_postings jp ON ja.job_id = jp.id
//       LEFT JOIN job_categories jc ON jp.category_id = jc.id
//       ORDER BY ja.created_at DESC
//     `);
//     const enrichedApps = applications.map(app => ({
//       ...app, applicantName: `${app.first_name} ${app.last_name}`, applicantEmail: app.user_email
//     }));
//     res.json(enrichedApps);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch applications." });
//   }
// });

// app.patch("/api/admin/applications/:id/status", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { status, remarks, internalRemarks } = req.body;
//     const applicationId = req.params.id;
//     if (!status || !APPLICATION_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status." });

//     const rejectionStatuses = ['Not Selected', 'Round 1 Not Selected', 'Round 2 Not Selected', 'Round 3 Not Selected', 'Rejected - Candidate non responsive', 'Withdrawn by Candidate'];
//     if (rejectionStatuses.includes(status) && (!internalRemarks || !internalRemarks.trim())) {
//       return res.status(400).json({ success: false, message: "Internal rejection reason is required when rejecting a candidate." });
//     }

//     let updateQuery = 'UPDATE job_applications SET status = ?, admin_remarks = ?, internal_remarks = ?';
//     const params = [status, remarks || null, internalRemarks || null];
//     if (rejectionStatuses.includes(status)) {
//       updateQuery += ', last_rejected_at = NOW(), rejection_stage = ?';
//       params.push(status);
//     }
//     if (status === 'Round 1 Selected') updateQuery += ', current_round = 2';
//     else if (status === 'Round 2 Selected') updateQuery += ', current_round = 3';
//     else if (status === 'Shortlisted') updateQuery += ', current_round = 1';
//     updateQuery += ' WHERE id = ?';
//     params.push(applicationId);
//     await pool.execute(updateQuery, params);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update application status." });
//   }
// });

// app.patch("/api/admin/applications/:id/internal-remarks", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { internalRemarks } = req.body;
//     await pool.execute('UPDATE job_applications SET internal_remarks = ? WHERE id = ?', [internalRemarks, req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update internal remarks." });
//   }
// });

// app.get("/api/admin/users", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [users] = await pool.execute(`SELECT id, email, first_name, last_name, mobile_number, email_verified, is_blocked, created_at FROM users ORDER BY created_at DESC`);
//     res.json(users);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch users." });
//   }
// });

// app.get("/api/admin/users/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const [users] = await pool.execute(`SELECT id, email, first_name, last_name, mobile_number, email_verified, is_blocked, created_at FROM users WHERE id = ?`, [userId]);
//     if (users.length === 0) return res.status(404).json({ success: false, message: "User not found." });
//     const [profile] = await pool.execute('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
//     const [certifications] = await pool.execute('SELECT * FROM user_certifications WHERE user_id = ?', [userId]);
//     const [workExperience] = await pool.execute('SELECT * FROM user_work_experience WHERE user_id = ? ORDER BY start_date DESC', [userId]);
//     const [applications] = await pool.execute(`SELECT ja.id, ja.status, ja.created_at, jp.title as jobTitle, jp.job_id as jobIdCode FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE ja.user_id = ? ORDER BY ja.created_at DESC`, [userId]);
//     res.json({ user: users[0], profile: profile[0] || null, certifications, workExperience, applications });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch user details." });
//   }
// });

// app.patch("/api/admin/users/:id/block", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { isBlocked } = req.body;
//     await pool.execute('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlocked ? 1 : 0, req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update user status." });
//   }
// });

// app.get("/api/admin/interview-dates", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [dates] = await pool.execute('SELECT * FROM interview_available_dates ORDER BY available_date');
//     res.json(dates);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch interview dates." });
//   }
// });

// app.post("/api/admin/interview-dates/toggle", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { date, isActive } = req.body;
//     const [existing] = await pool.execute('SELECT id FROM interview_available_dates WHERE available_date = ?', [date]);
//     if (existing.length > 0) {
//       await pool.execute('UPDATE interview_available_dates SET is_active = ? WHERE available_date = ?', [isActive ? 1 : 0, date]);
//     } else {
//       await pool.execute('INSERT INTO interview_available_dates (available_date, is_active) VALUES (?, ?)', [date, isActive ? 1 : 0]);
//     }
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to toggle date availability." });
//   }
// });

// app.post("/api/admin/interview-dates/bulk-update", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { dates, isActive } = req.body;
//     for (const date of dates) {
//       const [existing] = await pool.execute('SELECT id FROM interview_available_dates WHERE available_date = ?', [date]);
//       if (existing.length > 0) {
//         await pool.execute('UPDATE interview_available_dates SET is_active = ? WHERE available_date = ?', [isActive ? 1 : 0, date]);
//       } else {
//         await pool.execute('INSERT INTO interview_available_dates (available_date, is_active) VALUES (?, ?)', [date, isActive ? 1 : 0]);
//       }
//     }
//     res.json({ success: true, dates, count: dates.length });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to bulk update dates." });
//   }
// });

// app.delete("/api/admin/interview-dates/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM interview_available_dates WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete date." });
//   }
// });

// app.get("/api/admin/slot-settings", isAdminAuthenticated, async (req, res) => {
//   try {
//     const round = req.query.round ? parseInt(req.query.round) : null;
//     let query = 'SELECT * FROM interview_slot_settings';
//     const params = [];
//     if (round) { query += ' WHERE round = ?'; params.push(round); }
//     query += ' ORDER BY round, time_slot';
//     const [settings] = await pool.execute(query, params);
//     res.json(settings);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch slot settings." });
//   }
// });

// app.patch("/api/admin/slot-settings/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { isActive } = req.body;
//     await pool.execute('UPDATE interview_slot_settings SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to update slot setting." });
//   }
// });

// app.patch("/api/admin/applications/:id/meeting-link", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { meetingLink } = req.body;
//     await pool.execute('UPDATE job_applications SET meeting_link = ? WHERE id = ?', [meetingLink, req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to save meeting link." });
//   }
// });

// app.post("/api/admin/applications/:id/schedule-interview", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { scheduledDate, scheduledTime } = req.body;
//     const applicationId = req.params.id;
//     await pool.execute('UPDATE job_applications SET scheduled_interview_date = ?, scheduled_interview_time = ?, interview_confirmation_token = ?, interview_confirmed = 0 WHERE id = ?', [scheduledDate, scheduledTime, crypto.randomBytes(32).toString('hex'), applicationId]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to schedule interview." });
//   }
// });

// app.post("/api/admin/applications/:id/resend-confirmation", isAdminAuthenticated, async (req, res) => {
//   try {
//     const token = crypto.randomBytes(32).toString('hex');
//     await pool.execute('UPDATE job_applications SET interview_confirmation_token = ? WHERE id = ?', [token, req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to resend confirmation." });
//   }
// });

// app.post("/api/admin/applications/:id/request-reschedule", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { message } = req.body;
//     const [app] = await pool.execute('SELECT current_round FROM job_applications WHERE id = ?', [req.params.id]);
//     const currentRound = app[0]?.current_round || 1;
//     const rescheduleStatus = `Reschedule Round ${currentRound}`;
//     await pool.execute('UPDATE job_applications SET status = ?, admin_remarks = ?, scheduled_interview_date = NULL, scheduled_interview_time = NULL WHERE id = ?', [rescheduleStatus, message || 'We need to reschedule your interview.', req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to request reschedule." });
//   }
// });

// app.get("/api/admin/notifications", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [notifications] = await pool.execute('SELECT * FROM admin_notifications ORDER BY created_at DESC');
//     res.json(notifications);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch notifications." });
//   }
// });

// app.get("/api/admin/notifications/unread", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [result] = await pool.execute('SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0');
//     const [notifications] = await pool.execute('SELECT * FROM admin_notifications WHERE is_read = 0 ORDER BY created_at DESC');
//     res.json({ count: result[0].count, notifications });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch unread notifications." });
//   }
// });

// app.patch("/api/admin/notifications/:id/read", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to mark notification as read." });
//   }
// });

// app.post("/api/admin/notifications/read-all", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0');
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to mark all as read." });
//   }
// });

// // =============================================================================
// // MCQ ROUTES
// // =============================================================================

// app.get("/api/admin/mcq/session/:appId", isAdminAuthenticated, async (req, res) => {
//   try {
//     const appId = req.params.appId;
//     const [sessions] = await pool.execute('SELECT * FROM mcq_sessions WHERE application_id = ? ORDER BY generated_at DESC LIMIT 1', [appId]);
//     if (sessions.length === 0) return res.json({ success: true, session: null });
//     const session = sessions[0];
//     const [questions] = await pool.execute('SELECT * FROM mcq_questions WHERE session_id = ? ORDER BY question_order', [session.id]);
//     const [answers] = await pool.execute('SELECT * FROM mcq_answers WHERE session_id = ?', [session.id]);
//     const answerMap = new Map(answers.map(a => [a.question_id, a]));
//     const questionsWithAnswers = questions.map(q => ({
//       ...q, selectedAnswer: answerMap.get(q.id)?.selected_answer || null, isCorrect: answerMap.get(q.id)?.is_correct === 1
//     }));
//     res.json({ success: true, session: { ...session, questions: questionsWithAnswers } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch MCQ session." });
//   }
// });

// app.post("/api/admin/mcq/generate/:appId", isAdminAuthenticated, async (req, res) => {
//   try {
//     const appId = req.params.appId;
//     const [applications] = await pool.execute(`
//       SELECT ja.*, u.first_name, u.last_name, u.email, jp.job_id, jp.title, up.skills, up.total_experience
//       FROM job_applications ja
//       JOIN users u ON ja.user_id = u.id
//       JOIN job_postings jp ON ja.job_id = jp.id
//       LEFT JOIN user_profiles up ON u.id = up.user_id
//       WHERE ja.id = ?
//     `, [appId]);

//     if (applications.length === 0) return res.status(404).json({ success: false, message: "Application not found." });
//     const app = applications[0];

//     // Delete existing session and related data
//     const [existingSessions] = await pool.execute('SELECT id FROM mcq_sessions WHERE application_id = ?', [appId]);
//     for (const session of existingSessions) {
//       await pool.execute('DELETE FROM mcq_answers WHERE session_id = ?', [session.id]);
//       await pool.execute('DELETE FROM mcq_questions WHERE session_id = ?', [session.id]);
//       await pool.execute('DELETE FROM mcq_sessions WHERE id = ?', [session.id]);
//     }

//     // Determine pass threshold based on experience
//     const experience = parseFloat(app.total_experience) || 0;
//     let passThreshold = 28;
//     if (experience < 1) passThreshold = 20;
//     else if (experience < 2) passThreshold = 22;
//     else if (experience < 3) passThreshold = 24;
//     else if (experience < 4) passThreshold = 25;
//     else if (experience < 5) passThreshold = 26;
//     else if (experience < 6) passThreshold = 27;

//     const [result] = await pool.execute('INSERT INTO mcq_sessions (application_id, job_id, user_id, total_questions, pass_threshold, status) VALUES (?, ?, ?, 30, ?, "pending")', [appId, app.job_id, app.user_id, passThreshold]);

//     // Generate sample questions (in production, call AI API here)
//     const sampleQuestions = [];
//     for (let i = 1; i <= 30; i++) {
//       const categories = ['technical', 'reasoning', 'aptitude', 'real_world', 'role_specific'];
//       const category = categories[Math.floor(Math.random() * categories.length)];
//       const difficulty = Math.random() < 0.3 ? 'easy' : (Math.random() < 0.5 ? 'medium' : 'hard');
//       sampleQuestions.push({
//         session_id: result.insertId,
//         question_order: i,
//         question_text: `Sample question ${i} based on ${app.title}`,
//         option_a: 'Option A',
//         option_b: 'Option B',
//         option_c: 'Option C',
//         option_d: 'Option D',
//         correct_answer: 'A',
//         category,
//         difficulty,
//         explanation: 'This is a sample explanation.'
//       });
//     }

//     for (const q of sampleQuestions) {
//       await pool.execute(`INSERT INTO mcq_questions (session_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_answer, category, difficulty, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [q.session_id, q.question_order, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.category, q.difficulty, q.explanation]);
//     }

//     // Send invite email
//     const testUrl = `${req.headers.origin}/technical-evaluation/${app.job_id}/${appId}-${app.first_name.toLowerCase().replace(/\s+/g, '-')}`;
//     await sendEmail(app.email, 'Technical Evaluation Invitation', `<h2>Technical Evaluation Invitation</h2><p>Hello ${app.first_name},</p><p>You have been invited to take the technical evaluation for ${app.title} position.</p><p>Click here to start: <a href="${testUrl}">${testUrl}</a></p><p>The test has 30 questions and must be completed within 45 minutes.</p>`);

//     res.json({ success: true, message: "MCQ questions generated and invite sent." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to generate MCQ questions." });
//   }
// });

// app.post("/api/admin/mcq/invite/:appId", isAdminAuthenticated, async (req, res) => {
//   try {
//     const appId = req.params.appId;
//     const [apps] = await pool.execute(`
//       SELECT ja.*, u.first_name, u.email, jp.job_id, jp.title
//       FROM job_applications ja
//       JOIN users u ON ja.user_id = u.id
//       JOIN job_postings jp ON ja.job_id = jp.id
//       WHERE ja.id = ?
//     `, [appId]);
//     if (apps.length === 0) return res.status(404).json({ success: false, message: "Application not found." });
//     const app = apps[0];
//     const testUrl = `${req.headers.origin}/technical-evaluation/${app.job_id}/${appId}-${app.first_name.toLowerCase().replace(/\s+/g, '-')}`;
//     await sendEmail(app.email, 'Technical Evaluation Invitation', `<h2>Technical Evaluation Invitation</h2><p>Hello ${app.first_name},</p><p>You have been invited to take the technical evaluation for ${app.title} position.</p><p>Click here to start: <a href="${testUrl}">${testUrl}</a></p><p>The test has 30 questions and must be completed within 45 minutes.</p>`);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to send invite." });
//   }
// });

// app.patch("/api/admin/mcq/sessions/:sessionId/void", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('UPDATE mcq_sessions SET status = "voided" WHERE id = ?', [req.params.sessionId]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to void session." });
//   }
// });

// app.patch("/api/admin/mcq/override/:appId", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { overrideType, reason } = req.body;
//     const appId = req.params.appId;
//     const passed = overrideType === 'pass';
//     const newStatus = passed ? 'Round 1 Selected' : 'Round 1 Not Selected';

//     await pool.execute('UPDATE job_applications SET status = ?, internal_remarks = CONCAT(IFNULL(internal_remarks, ""), ?) WHERE id = ?', [newStatus, `\n[Admin Override - ${reason}]`, appId]);
//     const [sessions] = await pool.execute('SELECT id FROM mcq_sessions WHERE application_id = ? ORDER BY generated_at DESC LIMIT 1', [appId]);
//     if (sessions.length > 0) {
//       await pool.execute('UPDATE mcq_sessions SET passed = ? WHERE id = ?', [passed ? 1 : 0, sessions[0].id]);
//     }

//     const [apps] = await pool.execute(`
//       SELECT ja.*, u.first_name, u.email, jp.title, jp.job_id
//       FROM job_applications ja
//       JOIN users u ON ja.user_id = u.id
//       JOIN job_postings jp ON ja.job_id = jp.id
//       WHERE ja.id = ?
//     `, [appId]);
//     if (apps.length > 0) {
//       const app = apps[0];
//       await sendEmail(app.email, `Technical Evaluation Result Update - ${app.title}`, `<h2>Technical Evaluation Result</h2><p>Hello ${app.first_name},</p><p>Your technical evaluation result has been updated to: <strong>${passed ? 'PASSED' : 'NOT SELECTED'}</strong></p><p>Reason: ${reason}</p>`);
//     }

//     res.json({ success: true, newStatus });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to override result." });
//   }
// });

// app.post("/api/admin/mcq/report/:appId/email", isAdminAuthenticated, async (req, res) => {
//   try {
//     const appId = req.params.appId;
//     const [sessions] = await pool.execute('SELECT * FROM mcq_sessions WHERE application_id = ? ORDER BY generated_at DESC LIMIT 1', [appId]);
//     if (sessions.length === 0) return res.status(404).json({ success: false, message: "No MCQ session found." });
//     const session = sessions[0];
//     const [questions] = await pool.execute('SELECT * FROM mcq_questions WHERE session_id = ? ORDER BY question_order', [session.id]);
//     const [answers] = await pool.execute('SELECT * FROM mcq_answers WHERE session_id = ?', [session.id]);
//     const answerMap = new Map(answers.map(a => [a.question_id, a]));

//     let reportHtml = `<h2>Technical Evaluation Report</h2><p>Score: ${session.score}/${session.total_questions} (${((session.score / session.total_questions) * 100).toFixed(1)}%)</p><p>Result: ${session.passed ? 'PASSED' : 'NOT SELECTED'}</p><h3>Detailed Breakdown:</h3>`;
//     for (const q of questions) {
//       const answer = answerMap.get(q.id);
//       const isCorrect = answer?.is_correct === 1;
//       reportHtml += `<div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc;"><p><strong>Q${q.question_order}:</strong> ${q.question_text}</p><p>Your answer: ${answer?.selected_answer || 'Not answered'}</p><p>Correct answer: ${q.correct_answer}</p><p>Status: ${isCorrect ? '✓ Correct' : '✗ Incorrect'}</p>${q.explanation ? `<p><em>Explanation: ${q.explanation}</em></p>` : ''}</div>`;
//     }

//     const [apps] = await pool.execute('SELECT u.email, u.first_name FROM job_applications ja JOIN users u ON ja.user_id = u.id WHERE ja.id = ?', [appId]);
//     if (apps.length > 0) {
//       await sendEmail(apps[0].email, 'Technical Evaluation Detailed Report', reportHtml);
//     }
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to send report email." });
//   }
// });

// // =============================================================================
// // Q&A ROUTES
// // =============================================================================

// app.get("/api/admin/applications/:id/qa", isAdminAuthenticated, async (req, res) => {
//   try {
//     const [questions] = await pool.execute('SELECT * FROM application_questions WHERE application_id = ? ORDER BY created_at', [req.params.id]);
//     const [answers] = await pool.execute('SELECT * FROM application_answers WHERE application_id = ? ORDER BY answered_at', [req.params.id]);
//     res.json({ questions, answers });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch Q&A." });
//   }
// });

// app.post("/api/admin/applications/:id/questions", isAdminAuthenticated, async (req, res) => {
//   try {
//     const { questionText, questionType, options } = req.body;
//     const [result] = await pool.execute('INSERT INTO application_questions (application_id, question_text, question_type, options) VALUES (?, ?, ?, ?)', [req.params.id, questionText, questionType, options ? JSON.stringify(options) : null]);

//     const [apps] = await pool.execute('SELECT u.email, u.first_name FROM job_applications ja JOIN users u ON ja.user_id = u.id WHERE ja.id = ?', [req.params.id]);
//     if (apps.length > 0) {
//       await sendEmail(apps[0].email, 'New Question from Recruiter', `<h2>New Question</h2><p>Hello ${apps[0].first_name},</p><p>A recruiter has asked a new question regarding your application. Please log in to the portal to answer it.</p><p><strong>Question:</strong> ${questionText}</p>`);
//     }
//     res.json({ success: true, question: { id: result.insertId, questionText, questionType, options } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to create question." });
//   }
// });

// app.delete("/api/admin/questions/:id", isAdminAuthenticated, async (req, res) => {
//   try {
//     await pool.execute('DELETE FROM application_answers WHERE question_id = ?', [req.params.id]);
//     await pool.execute('DELETE FROM application_questions WHERE id = ?', [req.params.id]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to delete question." });
//   }
// });

// app.get("/api/applications/:id/qa", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const [apps] = await pool.execute('SELECT user_id FROM job_applications WHERE id = ?', [req.params.id]);
//     if (apps.length === 0 || apps[0].user_id !== userId) return res.status(403).json({ success: false, message: "Not authorized" });
//     const [questions] = await pool.execute('SELECT * FROM application_questions WHERE application_id = ? ORDER BY created_at', [req.params.id]);
//     const [answers] = await pool.execute('SELECT * FROM application_answers WHERE application_id = ? ORDER BY answered_at', [req.params.id]);
//     res.json({ questions, answers });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch Q&A." });
//   }
// });

// app.post("/api/applications/:id/answers", isUserAuthenticated, async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const { questionId, answerText } = req.body;
//     const [apps] = await pool.execute('SELECT user_id FROM job_applications WHERE id = ?', [req.params.id]);
//     if (apps.length === 0 || apps[0].user_id !== userId) return res.status(403).json({ success: false, message: "Not authorized" });
//     await pool.execute('INSERT INTO application_answers (question_id, application_id, answer_text) VALUES (?, ?, ?)', [questionId, req.params.id, answerText]);
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to submit answer." });
//   }
// });

// // =============================================================================
// // UTILITY ROUTES
// // =============================================================================

// app.get("/api/application-statuses", (req, res) => {
//   res.json(APPLICATION_STATUSES);
// });

// app.get("/api/slot-settings", async (req, res) => {
//   try {
//     const round = req.query.round ? parseInt(req.query.round) : null;
//     let query = 'SELECT * FROM interview_slot_settings';
//     const params = [];
//     if (round) { query += ' WHERE round = ?'; params.push(round); }
//     query += ' ORDER BY round, time_slot';
//     const [settings] = await pool.execute(query, params);
//     res.json(settings);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to fetch slot settings." });
//   }
// });

// // =============================================================================
// // START SERVER
// // =============================================================================

// async function startServer() {
//   await initDatabase();
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log(`📋 API endpoints available at http://localhost:${PORT}/api/`);
//   });
// }

// startServer().catch(console.error);

// export default app;