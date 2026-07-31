/**
 * Microsoft MSAL Configuration
 *
 * This module lazily creates a ConfidentialClientApplication for Microsoft
 * Entra ID (Azure AD) OAuth 2.0 Authorization Code Flow (admin login) and
 * Client Credentials Flow (Graph API mail).
 *
 * All values are read from process.env — never hardcoded.
 * dotenv is already loaded by apps/api/src/config/env.js before any route is
 * executed, so process.env is populated by the time getMsalClient() is called.
 */

import * as msal from "@azure/msal-node";
import { getLoadedEnvPath, getMsEnvStatus } from "./env.js";

/**
 * Validate that the required Microsoft environment variables are present.
 * Returns an array of missing variable names (empty array = all present).
 */
export function getMissingMsEnvVars() {
  const status = getMsEnvStatus();

  console.log("[MS Config] Checking environment variables:");
  console.log("[MS Config] .env path:", status.envPath || "(none loaded)");
  console.log("[MS Config] cwd:", status.cwd);
  for (const [key, ok] of Object.entries(status.present)) {
    const preview =
      ok && process.env[key]
        ? `Present (${String(process.env[key]).substring(0, 8)}...)`
        : "Missing";
    console.log(`[MS Config] ${key}:`, preview);
  }

  if (status.missing.length > 0) {
    console.error("[MS Config] ❌ Missing variables:", status.missing);
  } else {
    console.log("[MS Config] ✅ All Microsoft environment variables are present");
  }

  return status.missing;
}

export { getLoadedEnvPath, getMsEnvStatus };

/**
 * Allowed admin email for password login and Microsoft OAuth.
 * Prefer ADMIN_EMAIL; fall back to legacy ADMIN_USERNAME.
 */
export function getAdminEmail() {
  return String(
    process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || ""
  )
    .trim()
    .toLowerCase();
}

/**
 * Build the MSAL configuration object from environment variables.
 * Called lazily so dotenv has already loaded before this runs.
 */
function buildMsalConfig() {
  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  const authority = `https://login.microsoftonline.com/${tenantId}`;

  return {
    auth: {
      clientId,
      clientSecret,
      authority,
      // knownAuthorities skips the OIDC metadata discovery network call that
      // can hang indefinitely in some environments, causing the auth redirect
      // to never respond. With this set MSAL trusts the authority without a
      // separate metadata HTTP request.
      knownAuthorities: ["login.microsoftonline.com"],
    },
    system: {
      loggerOptions: {
        loggerCallback(logLevel, message) {
          if (logLevel <= msal.LogLevel.Warning) {
            console.warn("[MSAL]", message);
          }
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Warning,
      },
      // 10 second timeout on any MSAL network call so a network hiccup
      // never causes the route to hang forever.
      networkClient: undefined,
    },
  };
}

// Module-level singleton — created once per process, lazily on first use.
let _msalClient = null;

export function resetMsalClient() {
  _msalClient = null;
}

/**
 * Returns the shared ConfidentialClientApplication instance.
 * Throws a clear error if Microsoft env vars are missing so the admin knows
 * exactly what to add to .env before testing.
 */
export function getMsalClient() {
  if (_msalClient) return _msalClient;

  const missing = getMissingMsEnvVars();
  if (missing.length > 0) {
    throw new Error(
      `Microsoft login is not configured. Add the following variables to apps/api/.env: ${missing.join(", ")}`
    );
  }

  _msalClient = new msal.ConfidentialClientApplication(buildMsalConfig());
  return _msalClient;
}

/**
 * OAuth 2.0 scopes used for the admin login (Authorization Code Flow).
 * These are delegated permissions — the admin consents on behalf of themselves.
 */
export const LOGIN_SCOPES = ["openid", "profile", "email", "User.Read"];

/**
 * The redirect URI must match exactly what is registered in Microsoft Entra.
 * In development:  http://localhost:5001/api/auth/microsoft/callback
 * In production:   set MS_REDIRECT_URI in .env to your production URL.
 */
export function getRedirectUri() {
  return (
    process.env.MS_REDIRECT_URI ||
    "http://localhost:5001/api/auth/microsoft/callback"
  );
}

/**
 * Frontend URL used for post-login and post-logout redirects.
 */
export function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  );
}
