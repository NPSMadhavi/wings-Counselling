import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Candidate .env locations (first existing wins).
 * This avoids "values are in Downloads .env but API is running from another copy".
 */
const envCandidates = [
  path.resolve(__dirname, "../../.env"), // apps/api/.env (normal)
  path.resolve(process.cwd(), ".env"), // cwd = apps/api
  path.resolve(process.cwd(), "apps/api/.env"), // cwd = monorepo root
];

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Manual KEY=VALUE parser — more tolerant than dotenv for:
 * - UTF-8 BOM
 * - spaces around =
 * - inline comments after unquoted values
 */
function parseEnvFile(raw) {
  const parsed = {};
  const text = stripBom(raw);
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Unquoted: drop trailing inline comment
      const hash = value.indexOf(" #");
      if (hash >= 0) value = value.slice(0, hash).trim();
    }

    if (key) parsed[key] = value;
  }
  return parsed;
}

function applyParsed(parsed, { override = true } = {}) {
  for (const [key, value] of Object.entries(parsed)) {
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = typeof value === "string" ? value.trim() : value;
  }
}

let loadedFrom = null;
let loadError = null;

for (const candidate of envCandidates) {
  if (!fs.existsSync(candidate)) {
    console.log("[ENV] skip (missing):", candidate);
    continue;
  }

  try {
    const raw = fs.readFileSync(candidate, "utf8");
    const parsed = parseEnvFile(raw);

    // Also run dotenv for compatibility, then force our trimmed parse on top.
    dotenv.config({ path: candidate, override: true });
    applyParsed(parsed, { override: true });

    loadedFrom = candidate;
    console.log("[ENV] ✅ Loaded .env from:", candidate);
    console.log("[ENV] Keys found:", Object.keys(parsed).length);
    break;
  } catch (err) {
    loadError = err;
    console.error("[ENV] Failed reading", candidate, err?.message || err);
  }
}

if (!loadedFrom) {
  console.error(
    "[ENV] ❌ No .env file found. Tried:",
    envCandidates.join(" | ")
  );
  if (loadError) console.error("[ENV] Last error:", loadError);
}

console.log("[ENV] Current working directory:", process.cwd());
console.log("[ENV] __dirname:", __dirname);

// Legacy alias
if (!process.env.ADMIN_EMAIL && process.env.ADMIN_USERNAME) {
  process.env.ADMIN_EMAIL = String(process.env.ADMIN_USERNAME).trim();
}

function flag(name) {
  const v = String(process.env[name] || "").trim();
  return v ? "Loaded" : "Missing";
}

console.log("[ENV] MS_CLIENT_ID:", flag("MS_CLIENT_ID"));
console.log("[ENV] MS_TENANT_ID:", flag("MS_TENANT_ID"));
console.log("[ENV] MS_CLIENT_SECRET:", flag("MS_CLIENT_SECRET"));
console.log("[ENV] ADMIN_EMAIL:", flag("ADMIN_EMAIL"));

export function getLoadedEnvPath() {
  return loadedFrom;
}

export function getMsEnvStatus() {
  // Document uses AZURE_*; project also accepts MS_* aliases
  const pairs = [
    ["AZURE_CLIENT_ID", "MS_CLIENT_ID"],
    ["AZURE_TENANT_ID", "MS_TENANT_ID"],
    ["AZURE_CLIENT_SECRET", "MS_CLIENT_SECRET"],
  ];
  const present = {};
  const missing = [];
  for (const [azureKey, msKey] of pairs) {
    const ok = Boolean(
      String(process.env[azureKey] || process.env[msKey] || "").trim()
    );
    present[azureKey] = ok;
    present[msKey] = ok;
    if (!ok) missing.push(`${azureKey} (or ${msKey})`);
  }
  return {
    envPath: loadedFrom,
    cwd: process.cwd(),
    present,
    missing,
    configured: missing.length === 0,
  };
}
