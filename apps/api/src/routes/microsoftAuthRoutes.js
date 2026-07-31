/**
 * Microsoft Entra ID OAuth 2.0 Authorization Code Flow routes.
 *
 * GET  /api/auth/microsoft           → redirect browser to Microsoft login
 * GET  /api/auth/microsoft/callback  → exchange code for tokens, issue JWT
 *
 * Security notes:
 * - A cryptographically random `state` value is stored in the server session
 *   to prevent CSRF attacks (validated in callback).
 * - Access tokens are NEVER sent to the frontend or stored in the URL.
 * - Only non-sensitive user info (name, email, MS account id) is stored in
 *   the session, and a short-lived JWT is issued for the existing admin flow.
 * - Any Microsoft account that successfully signs in against your tenant
 *   can access the Admin Portal (no ADMIN_EMAIL allow-list required).
 *   Organization boundary is enforced by MS_TENANT_ID (single-tenant app).
 */

import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  getMsalClient,
  getMissingMsEnvVars,
  getMsEnvStatus,
  getAdminEmail,
  LOGIN_SCOPES,
  getRedirectUri,
  getFrontendUrl,
} from "../config/microsoftConfig.js";
import { getJwtSecret } from "../middlewares/auth.js";

const router = Router();

/* ─────────────────────────────────────────────────────────────
   Debug — check whether MS env vars are loaded (no secrets)
   GET /api/auth/microsoft/status
   ───────────────────────────────────────────────────────────── */
router.get("/auth/microsoft/status", (_req, res) => {
  const status = getMsEnvStatus();
  return res.json({
    configured: status.configured,
    envPath: status.envPath,
    cwd: status.cwd,
    present: status.present,
    missing: status.missing,
    adminEmailSet: Boolean(getAdminEmail()),
    hint: status.configured
      ? "Microsoft env vars are loaded. Continue with Microsoft opens the Microsoft account picker (email + password on Microsoft's page)."
      : "API process did not load MS_* from apps/api/.env. Stop ALL node processes, cd into THIS project, then npm run dev.",
  });
});

/* ─────────────────────────────────────────────────────────────
   STEP 1 — Initiate Microsoft login
   GET /api/auth/microsoft
   ───────────────────────────────────────────────────────────── */
router.get("/auth/microsoft", async (req, res) => {
  const frontendUrl = getFrontendUrl();
  const loginUrl = `${frontendUrl}/admin`;

  // Check env vars upfront so admin gets a clear error instead of a 500.
  const missing = getMissingMsEnvVars();
  if (missing.length > 0) {
    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent(
        "Microsoft login is not configured. Missing: " + missing.join(", ")
      )}`
    );
  }

  try {
    const state = crypto.randomBytes(32).toString("hex");

    req.session.msOAuthState = state;

    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    const msalClient = getMsalClient();

    const authCodeUrlParams = {
      scopes: LOGIN_SCOPES,
      redirectUri: getRedirectUri(),
      state,
      prompt: "select_account",
    };

    console.log("[MS Auth] Building auth URL with redirect:", getRedirectUri());

    // Race the MSAL call against an 8-second timeout so the route never hangs
    // indefinitely if the authority metadata network call stalls.
    const authUrl = await Promise.race([
      msalClient.getAuthCodeUrl(authCodeUrlParams),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("MSAL getAuthCodeUrl timed out after 8 seconds")),
          8000
        )
      ),
    ]);

    console.log("[MS Auth] Redirecting to Microsoft:", authUrl.substring(0, 120) + "...");

    return res.redirect(authUrl);
  } catch (err) {
    console.error("[MS Auth] Failed to build auth URL:", err?.message, err?.stack);
    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent(
        "Failed to connect to Microsoft: " + (err?.message || "Unknown error")
      )}`
    );
  }
});

/* ─────────────────────────────────────────────────────────────
   STEP 2 — Microsoft redirects back here after login
   GET /api/auth/microsoft/callback
   ───────────────────────────────────────────────────────────── */
router.get("/auth/microsoft/callback", async (req, res) => {
  const frontendUrl = getFrontendUrl();
  const loginUrl = `${frontendUrl}/admin`;

  // ── Handle errors returned by Microsoft ──────────────────────
  if (req.query.error) {
    const msError = req.query.error_description || req.query.error;
    console.warn("[MS Auth] Microsoft returned error:", msError);

    // User cancelled login — redirect gracefully without showing MS details.
    if (req.query.error === "access_denied") {
      return res.redirect(`${loginUrl}?msError=${encodeURIComponent("Login cancelled")}`);
    }
    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent("Microsoft login failed. Please try again.")}`
    );
  }

  // ── Extract and validate the authorization code ───────────────
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent("No authorization code received from Microsoft")}`
    );
  }

  // ── CSRF — validate state matches what we stored in session ───
  const savedState = req.session.msOAuthState;
  if (!savedState || savedState !== state) {
    console.warn("[MS Auth] State mismatch — possible CSRF attack");
    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent("Invalid login state. Please try again.")}`
    );
  }

  // Clear the one-time state from session immediately.
  delete req.session.msOAuthState;

  try {
    const msalClient = getMsalClient();

    // ── Exchange the authorization code for tokens ────────────────
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: LOGIN_SCOPES,
      redirectUri: getRedirectUri(),
    });

    // ── Extract authenticated user information ────────────────────
    const msAccount = tokenResponse.account;
    const msEmail =
      msAccount?.username ||
      tokenResponse.idTokenClaims?.email ||
      tokenResponse.idTokenClaims?.preferred_username ||
      "";
    const msName =
      msAccount?.name ||
      tokenResponse.idTokenClaims?.name ||
      "";

    if (!msEmail) {
      console.warn("[MS Auth] Could not retrieve email from Microsoft token");
      return res.redirect(
        `${loginUrl}?msError=${encodeURIComponent("Could not retrieve your email from Microsoft. Please try again.")}`
      );
    }

    // Any successfully signed-in Microsoft account in this tenant is allowed.
    // (No ADMIN_EMAIL allow-list — user chooses email + password on Microsoft's page.)
    const normalizedMsEmail = msEmail.toLowerCase().trim();
    console.log(`[MS Auth] Microsoft login success: ${normalizedMsEmail}`);

    // ── Store minimal user info in session (not the access token) ─
    req.session.msUser = {
      name: msName,
      email: normalizedMsEmail,
      accountId: msAccount?.homeAccountId || "",
      tenantId: msAccount?.tenantId || "",
      loginMethod: "microsoft",
    };

    // ── Issue JWT for the existing admin frontend / requireAdmin flow ─
    const token = jwt.sign(
      {
        email: normalizedMsEmail,
        username: normalizedMsEmail,
        name: msName,
        loginMethod: "microsoft",
      },
      getJwtSecret(),
      { expiresIn: "1d" }
    );

    // Save session before redirect.
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    // ── Redirect to frontend with the JWT token ───────────────────
    // The frontend reads the token from the URL fragment and stores it in
    // sessionStorage, exactly as the existing login flow does.
    // Using the URL hash (#) keeps the token out of server logs.
    const dashboardUrl = `${frontendUrl}/admin`;
    return res.redirect(`${dashboardUrl}?msToken=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[MS Auth] Token exchange failed:", err?.message);

    // Detect common configuration errors and give the admin a helpful message.
    let userMessage = "Microsoft login failed. Please try again.";

    if (/AADSTS70011|invalid_client/.test(err?.message || "")) {
      userMessage = "Microsoft login failed: Invalid Client ID or Client Secret.";
    } else if (/redirect_uri/.test(err?.message || "")) {
      userMessage =
        "Microsoft login failed: Redirect URI mismatch. Check MS_REDIRECT_URI in .env and Microsoft Entra registration.";
    } else if (/AADSTS65001/.test(err?.message || "")) {
      userMessage =
        "Microsoft login failed: Admin consent has not been granted for the required permissions.";
    }

    return res.redirect(
      `${loginUrl}?msError=${encodeURIComponent(userMessage)}`
    );
  }
});

export default router;
