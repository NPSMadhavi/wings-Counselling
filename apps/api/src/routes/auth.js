import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USERNAME;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD;

  // DEBUG logs
  console.log("Entered Username:", username);
  console.log("Entered Password:", password);

  console.log("ENV Username:", ADMIN_USER);
  console.log("ENV Password:", ADMIN_PASS);

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Missing credentials" });
  }

  if (
    username !== ADMIN_USER ||
    password !== ADMIN_PASS
  ) {
    console.log("❌ Credentials mismatch");
    return res
      .status(401)
      .json({ error: "Invalid credentials" });
  }

  console.log("✅ Login success");

  const token = jwt.sign(
    { username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token });
});

export default router;