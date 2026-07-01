import { Link } from "wouter";

export default function UnsubscribeSuccess() {
  const year = new Date().getFullYear();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9F9F9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, textAlign: "center", marginBottom: 24 }}>
        <img
          src="/assets/wingsLogo.png"
          alt="WINGS Counselling Centre"
          style={{ display: "inline-block", maxWidth: 220, width: 220, height: "100%" }}
          width={220}
          height={220}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(15,23,42,0.1)",
          padding: "40px 32px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "#DBEAFE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M20 6L9 17L4 12"
              stroke="#1B4585"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            margin: "0 0 16px",
            color: "#111827",
            fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif",
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          You&apos;ve been unsubscribed
        </h1>

        <p style={{ margin: "0 0 28px", color: "#64748B", fontSize: 16, lineHeight: 1.7 }}>
          You have successfully unsubscribed from WINGS Counselling &amp; Wellness Centre email
          updates.
        </p>

        <div
          style={{
            background: "#EFF6FF",
            borderRadius: 14,
            padding: "22px 24px",
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#1B4585", fontSize: 15, fontWeight: 600 }}>
            You will no longer receive
          </p>
          <ul
            style={{
              margin: 0,
              padding: "0 0 0 18px",
              color: "#475569",
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            <li>New articles and expert insights</li>
            <li>Invitations to upcoming events</li>
            <li>Community updates and announcements</li>
          </ul>
        </div>

        <p style={{ margin: "0 0 28px", color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
          If you change your mind, you can subscribe again anytime through our website.
        </p>

        <Link
          href="/"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            background: "#1B4585",
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
            padding: "16px 24px",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          Back to Home
        </Link>

        <Link
          href="/events"
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            background: "#FFFFFF",
            color: "#1B4585",
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 600,
            padding: "15px 24px",
            borderRadius: 12,
            border: "1.5px solid #1B4585",
          }}
        >
          Resubscribe
        </Link>
      </div>

      <p style={{ margin: "28px 0 0", color: "#9CA3AF", fontSize: 13, lineHeight: 1.5 }}>
        © {year} WINGS Counselling &amp; Wellness Centre
      </p>
    </div>
  );
}
