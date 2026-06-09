import { Router } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../middlewares/auth.js";

const router = Router();

router.post("/admin/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    const ADMIN_USER = process.env.ADMIN_USERNAME;
    const ADMIN_PASS = process.env.ADMIN_PASSWORD;

    if (!ADMIN_USER || !ADMIN_PASS) {
      console.error("Admin login: ADMIN_USERNAME or ADMIN_PASSWORD not set in .env");
      return res.status(500).json({
        error: "Admin login is not configured on the server. Set ADMIN_USERNAME and ADMIN_PASSWORD in apps/api/.env",
      });
    }

    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, getJwtSecret(), { expiresIn: "1d" });

    res.json({ token });
  } catch (err) {
    console.error("admin/login:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;