/**
 * Browser / OS notification helpers for the admin panel.
 * Requires a user gesture before requestPermission() (button click).
 */

const WINGS_ICON = "/assets/wingsLogo.png";

export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Shows the browser "Allow notifications" prompt when still default.
 * Returns: granted | denied | default | unsupported
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    o1.frequency.setValueAtTime(880, ctx.currentTime);
    o2.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);

    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    o1.start(ctx.currentTime);
    o1.stop(ctx.currentTime + 0.18);
    o2.start(ctx.currentTime + 0.12);
    o2.stop(ctx.currentTime + 0.55);
  } catch {
    /* audio blocked until user interaction */
  }
}

export function buildAdminNotificationContent(type, data = {}) {
  if (type === "new_application") {
    return {
      title: "New job application",
      body: `${data.candidateName || "Someone"} applied for ${data.jobTitle || "a role"}`,
      url: "/admin/careers?tab=applications",
    };
  }
  if (type === "new_appointment") {
    return {
      title: "New appointment request",
      body: `${data.name || "Someone"} — ${data.counsellingType || "Appointment"}`,
      url: "/admin/appointments",
    };
  }
  if (type === "new_volunteer") {
    const when = data.submittedAt
      ? new Date(data.submittedAt).toLocaleString("en-SG")
      : "just now";
    return {
      title: "New Volunteer Application Received",
      body: `${data.name || "Someone"} submitted at ${when}`,
      url: "/admin/volunteers",
    };
  }
  if (type === "new_form_submission") {
    return {
      title: "New form submission",
      body: `${data.formType || "Form"} from ${data.name || data.email || "Unknown"}`,
      url: "/admin/settings/primary-cc-mails",
    };
  }
  if (type === "email_sent") {
    return {
      title: "Email sent",
      body: data.subject || data.context || "Notification delivered successfully",
      url: "/admin/settings/primary-cc-mails",
    };
  }
  if (type === "email_failed") {
    return {
      title: "Email failed",
      body: data.reason || data.error || "Delivery failed",
      url: "/admin/settings/primary-cc-mails",
    };
  }
  if (type === "status_updated") {
    return {
      title: "Application status updated",
      body: `${data.applicationNumber || "Application"} → ${data.status || "updated"}`,
      url: "/admin/careers?tab=applications",
    };
  }
  if (type === "interview_scheduled") {
    return {
      title: "Interview scheduled",
      body: `Application #${data.applicationId || ""}`,
      url: "/admin/careers?tab=slots",
    };
  }
  if (type === "interview_booked") {
    return {
      title: "Interview booked",
      body: `${data.candidateName || "Candidate"} — ${data.date || ""} ${data.timeSlot || ""}`,
      url: "/admin/careers?tab=applications",
    };
  }
  if (type === "interview_time_requested") {
    return {
      title: "Interview time requested",
      body: data.candidateName || "A candidate requested a custom time",
      url: "/admin/careers?tab=applications",
    };
  }
  if (type === "new_job") {
    return {
      title: "New job posted",
      body: data.title || "A new job listing was created",
      url: "/admin/careers",
    };
  }
  return {
    title: "WINGS Admin",
    body: data.message || data.action || "New activity in the admin panel",
    url: "/admin",
  };
}

/**
 * Display a native OS notification (Windows action center / macOS notification center).
 */
export function showBrowserNotification(type, data = {}) {
  if (!isNotificationSupported()) return null;

  // Re-check permission at call time (may have changed since last check)
  if (Notification.permission !== "granted") return null;

  const { title, body, url } = buildAdminNotificationContent(type, data);

  // Use requireInteraction for important events so they stay in the system tray
  const requireInteraction =
    type === "new_appointment" ||
    type === "new_volunteer" ||
    type === "new_application" ||
    type === "email_failed";

  try {
    const notification = new Notification(title, {
      body,
      icon: WINGS_ICON,
      badge: WINGS_ICON,
      tag: `wings-admin-${type}-${Date.now()}`,
      requireInteraction,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (url) {
        const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
        window.location.href = `${base}${url.startsWith("/") ? url : `/${url}`}`;
      }
    };

    if (!requireInteraction) {
      setTimeout(() => notification.close(), 12000);
    }
    return notification;
  } catch {
    return null;
  }
}

/**
 * Sound + OS notification. Only fires the system notification if permission
 * is already granted — permission must be requested via a user gesture (bell click).
 */
export function notifyAdminEvent(type, data = {}) {
  playNotificationSound();
  showBrowserNotification(type, data);
}
