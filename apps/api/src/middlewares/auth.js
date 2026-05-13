import jwt from "jsonwebtoken";

function getJwtSecret() {
  return process.env.JWT_SECRET || "wings-admin-secret-change-in-prod";
}

export function requireAdmin(req, res, next) {
  const token =
    (req.headers.authorization &&
      req.headers.authorization.replace("Bearer ", "")) ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.admin = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export { getJwtSecret };
