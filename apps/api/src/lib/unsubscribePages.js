function getSiteUrl() {
  return (
    process.env.CLIENT_URL ||
    process.env.SITE_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

function buildConfirmPath(token) {
  return `/api/notify/unsubscribe/${encodeURIComponent(token)}/confirm`;
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pageShell({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:24px;min-height:100vh;box-sizing:border-box;font-family:'DM Sans','Segoe UI',Arial,sans-serif;background:#F9F9F9;">
  ${body}
</body>
</html>`;
}

export function renderUnsubscribeConfirmPage(token) {
  const siteUrl = getSiteUrl();
  const confirmUrl = buildConfirmPath(token);
  const year = new Date().getFullYear();

  return pageShell({
    title: "Unsubscribe – WINGS Counselling Centre",
    body: `
  <div style="min-height:calc(100vh - 48px);display:flex;align-items:center;justify-content:center;">
    <div style="width:100%;max-width:520px;background:#FFFFFF;border-radius:20px;box-shadow:0 12px 40px rgba(15,23,42,0.12);padding:40px 32px 28px;text-align:center;">
      <div style="width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9V13" stroke="#D97706" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M12 17H12.01" stroke="#D97706" stroke-width="2.8" stroke-linecap="round"/>
          <path d="M10.29 3.86L1.82 18A2 2 0 003.64 21H20.36A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z" stroke="#D97706" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="margin:0 0 16px;color:#1B4585;font-family:'Outfit','Segoe UI',Arial,sans-serif;font-size:28px;font-weight:700;line-height:1.25;">
        We're sorry to see you go.
      </h1>
      <p style="margin:0 0 28px;color:#64748B;font-size:16px;line-height:1.7;">
        You have requested to unsubscribe from WINGS event and article updates.
      </p>
      <p style="margin:0 0 24px;color:#111827;font-size:18px;font-weight:700;line-height:1.4;">
        Would you like to continue?
      </p>
      <a href="${escapeHtml(siteUrl)}" style="display:block;width:100%;max-width:100%;box-sizing:border-box;background:#1B4585;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;line-height:1;padding:16px 24px;border-radius:12px;margin:0 0 18px;">
        Keep Me Subscribed
      </a>
      <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;color:#1B4585;font-size:15px;font-weight:600;text-decoration:underline;">
        Yes, Unsubscribe Me
      </a>
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;color:#9CA3AF;font-size:13px;line-height:1.5;">
        © ${year} WINGS Counselling &amp; Wellness Centre
      </div>
    </div>
  </div>`,
  });
}

export function renderUnsubscribeSuccessPage() {
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();
  const logoUrl = `${siteUrl}/assets/wingsLogo.png`;

  return pageShell({
    title: "Unsubscribed – WINGS Counselling Centre",
    body: `
  <div style="min-height:calc(100vh - 48px);display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <div style="width:100%;max-width:560px;text-align:center;margin-bottom:24px;">
      <img src="${escapeHtml(logoUrl)}" alt="WINGS Counselling Centre" style="display:inline-block;max-width:220px;width:220px;height:auto;" />
    </div>
    <div style="width:100%;max-width:560px;background:#FFFFFF;border-radius:20px;box-shadow:0 12px 40px rgba(15,23,42,0.1);padding:40px 32px 32px;text-align:center;">
      <div style="width:72px;height:72px;margin:0 auto 24px;border-radius:50%;background:#DBEAFE;display:flex;align-items:center;justify-content:center;">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17L4 12" stroke="#1B4585" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="margin:0 0 16px;color:#111827;font-family:'Outfit','Segoe UI',Arial,sans-serif;font-size:30px;font-weight:700;line-height:1.25;">
        You've been unsubscribed
      </h1>
      <p style="margin:0 0 28px;color:#64748B;font-size:16px;line-height:1.7;">
        You have successfully unsubscribed from WINGS Counselling &amp; Wellness Centre email updates.
      </p>
      <div style="background:#EFF6FF;border-radius:14px;padding:22px 24px;text-align:left;margin:0 0 24px;">
        <p style="margin:0 0 12px;color:#1B4585;font-size:15px;font-weight:600;">You will no longer receive</p>
        <ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:15px;line-height:1.8;">
          <li>New articles and expert insights</li>
          <li>Invitations to upcoming events</li>
          <li>Community updates and announcements</li>
        </ul>
      </div>
      <p style="margin:0 0 28px;color:#94A3B8;font-size:14px;line-height:1.6;">
        If you change your mind, you can subscribe again anytime through our website.
      </p>
      <a href="${escapeHtml(siteUrl)}" style="display:block;width:100%;box-sizing:border-box;background:#1B4585;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:600;padding:16px 24px;border-radius:12px;margin:0 0 14px;">
        Back to Home
      </a>
      <a href="${escapeHtml(`${siteUrl}/events`)}" style="display:block;width:100%;box-sizing:border-box;background:#FFFFFF;color:#1B4585;text-decoration:none;font-size:16px;font-weight:600;padding:15px 24px;border-radius:12px;border:1.5px solid #1B4585;">
        Resubscribe
      </a>
    </div>
    <p style="margin:28px 0 0;color:#9CA3AF;font-size:13px;line-height:1.5;">
      © ${year} WINGS Counselling &amp; Wellness Centre
    </p>
  </div>`,
  });
}

export function renderUnsubscribeErrorPage(message) {
  const siteUrl = getSiteUrl();

  return pageShell({
    title: "Unsubscribe – WINGS Counselling Centre",
    body: `
  <div style="min-height:calc(100vh - 48px);display:flex;align-items:center;justify-content:center;">
    <div style="width:100%;max-width:520px;background:#FFFFFF;border-radius:20px;box-shadow:0 12px 40px rgba(15,23,42,0.12);padding:40px 32px;text-align:center;">
      <h1 style="margin:0 0 16px;color:#B91C1C;font-family:'Outfit','Segoe UI',Arial,sans-serif;font-size:24px;font-weight:700;">
        Unable to process request
      </h1>
      <p style="margin:0 0 24px;color:#64748B;font-size:16px;line-height:1.7;">${escapeHtml(message)}</p>
      <a href="${escapeHtml(siteUrl)}" style="display:inline-block;background:#1B4585;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">
        Back to Home
      </a>
    </div>
  </div>`,
  });
}
