const DEFAULT_LOCAL_ORIGIN = "http://localhost:5173";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function parseOrigin(raw) {
  const trimmed = String(raw).trim().replace(/\/$/, "");
  const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.origin;
}

function getConfiguredPortalRaw() {
  return (
    process.env.CANDIDATE_PORTAL_URL ||
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_APP_ORIGIN ||
    process.env.ADMIN_APP_ORIGIN ||
    null
  );
}

function getLocalDevOrigin() {
  const configured = getConfiguredPortalRaw();
  if (configured) {
    try {
      const origin = parseOrigin(configured);
      if (isLocalhostOrigin(origin)) {
        return origin;
      }
    } catch {
      // Fall through to default local origin.
    }
  }

  return DEFAULT_LOCAL_ORIGIN;
}

function getCandidatePortalOrigin() {
  const configured = getConfiguredPortalRaw();

  if (!configured) {
    return isProduction() ? DEFAULT_LOCAL_ORIGIN : getLocalDevOrigin();
  }

  try {
    const origin = parseOrigin(configured);

    if (!isProduction() && !isLocalhostOrigin(origin)) {
      const localOrigin = getLocalDevOrigin();
      console.warn(
        `[Portal] Non-localhost URL ignored in development (${origin}). Using ${localOrigin}.`
      );
      return localOrigin;
    }

    return origin;
  } catch {
    return isProduction() ? DEFAULT_LOCAL_ORIGIN : getLocalDevOrigin();
  }
}

/**
 * Build the candidate-facing interview booking URL for a specific application.
 */
export function buildInterviewBookingLink(applicationId) {
  const appId = Number(applicationId);
  if (!Number.isFinite(appId) || appId <= 0) {
    throw new Error(`Invalid applicationId for booking link: ${applicationId}`);
  }

  const origin = getCandidatePortalOrigin();
  return `${origin}/candidate/interview-booking/${appId}`;
}

export { getCandidatePortalOrigin };
