import { Router } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../middlewares/auth.js";
import { getAdminEmail, getFrontendUrl } from "../config/microsoftConfig.js";

const router = Router();

/* ─────────────────────────────────────────────────────────────
   Admin login with email + password
   POST /api/admin/login
   Body: { email, password }  (username accepted as alias for email)
   ───────────────────────────────────────────────────────────── */
router.post("/admin/login", (req, res) => {
  try {
    const body = req.body || {};
    const email = String(body.email || body.username || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    const ADMIN_EMAIL = getAdminEmail();
    const ADMIN_PASS = String(process.env.ADMIN_PASSWORD || "");

    if (!ADMIN_EMAIL || !ADMIN_PASS) {
      console.error(
        "Admin login: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env"
      );
      return res.status(500).json({
        error:
          "Admin login is not configured on the server. Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/api/.env",
      });
    }

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASS) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: ADMIN_EMAIL, username: ADMIN_EMAIL },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("admin/login:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ─────────────────────────────────────────────────────────────
   Logout — destroys server session and redirects to login page.
   Works for both email/password and Microsoft login sessions.
   GET /api/auth/logout
   ───────────────────────────────────────────────────────────── */
router.get("/auth/logout", (req, res) => {
  const frontendUrl = getFrontendUrl();
  const loginUrl = `${frontendUrl}/admin`;

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("[Auth] Session destroy error:", err?.message);
      }
    });
  }

  res.clearCookie("wings_session");
  return res.redirect(loginUrl);
});

export default router;
