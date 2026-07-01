import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

export default function UnsubscribeConfirm() {
  const { token: rawToken } = useParams();
  const token = String(rawToken || "").trim();
  const [status, setStatus] = useState("loading");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    fetch(`/api/notify/unsubscribe/${encodeURIComponent(token)}/status`)
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.alreadyUnsubscribed) {
          window.location.assign(`${window.location.origin}/unsubscribe/success`);
          return;
        }
        setStatus(data?.ok ? "ready" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleUnsubscribe = async () => {
    setConfirming(true);
    try {
      const res = await fetch(
        `/api/notify/unsubscribe/${encodeURIComponent(token)}/confirm`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("failed");
      window.location.assign(`${window.location.origin}/unsubscribe/success`);
    } catch {
      setConfirming(false);
      setStatus("error");
    }
  };

  const year = new Date().getFullYear();

  if (status === "loading") {
    return (
      <PageShell>
        <p style={{ color: "#64748B", fontSize: 16 }}>Loading...</p>
      </PageShell>
    );
  }

  if (status === "invalid" || status === "error") {
    return (
      <PageShell>
        <Card>
          <h1 style={styles.errorTitle}>Unable to process request</h1>
          <p style={styles.muted}>
            {status === "error"
              ? "Something went wrong. Please try again later."
              : "This unsubscribe link is invalid or has already been used."}
          </p>
          <Link href="/" style={styles.primaryBtn}>
            Back to Home
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card>
        <div style={styles.warnIconWrap}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9V13" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 17H12.01" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
            <path
              d="M10.29 3.86L1.82 18A2 2 0 003.64 21H20.36A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
              stroke="#D97706"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 style={styles.title}>We&apos;re sorry to see you go.</h1>
        <p style={styles.muted}>
          You have requested to unsubscribe from WINGS event and article updates.
        </p>
        <p style={styles.question}>Would you like to continue?</p>
        <Link href="/" style={styles.primaryBtn}>
          Keep Me Subscribed
        </Link>
        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={confirming}
          style={styles.linkBtn}
        >
          {confirming ? "Unsubscribing..." : "Yes, Unsubscribe Me"}
        </button>
        <div style={styles.cardFooter}>© {year} WINGS Counselling &amp; Wellness Centre</div>
      </Card>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9F9F9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
        padding: "40px 32px 28px",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

const styles = {
  warnIconWrap: {
    width: 72,
    height: 72,
    margin: "0 auto 24px",
    borderRadius: "50%",
    background: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: "0 0 16px",
    color: "#1B4585",
    fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif",
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  muted: {
    margin: "0 0 28px",
    color: "#64748B",
    fontSize: 16,
    lineHeight: 1.7,
  },
  question: {
    margin: "0 0 24px",
    color: "#111827",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  primaryBtn: {
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
    marginBottom: 18,
  },
  linkBtn: {
    display: "inline-block",
    background: "none",
    border: "none",
    color: "#1B4585",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
  cardFooter: {
    marginTop: 32,
    paddingTop: 20,
    borderTop: "1px solid #E5E7EB",
    color: "#9CA3AF",
    fontSize: 13,
    lineHeight: 1.5,
  },
  errorTitle: {
    margin: "0 0 16px",
    color: "#B91C1C",
    fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif",
    fontSize: 24,
    fontWeight: 700,
  },
};
