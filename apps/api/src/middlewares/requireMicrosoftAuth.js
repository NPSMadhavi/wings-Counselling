/**
 * requireMicrosoftAuth middleware
 *
 * Protects routes that require the admin to have authenticated via Microsoft.
 * Used in addition to (not instead of) the existing requireAdmin JWT middleware.
 *
 * This is intentionally a separate middleware so it can be applied selectively
 * to routes that specifically require a Microsoft-linked session, while the
 * existing requireAdmin (JWT) middleware continues to protect all other routes.
 */

export function requireMicrosoftAuth(req, res, next) {
  if (!req.session || !req.session.msUser) {
    return res.status(401).json({
      error: "Microsoft authentication required. Please log in with Microsoft.",
    });
  }
  // Attach Microsoft user info to request for downstream handlers.
  req.msUser = req.session.msUser;
  return next();
}
