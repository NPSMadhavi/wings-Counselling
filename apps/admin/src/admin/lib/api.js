const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const BASE = `${API_ROOT}/api`;

function buildApiUrl(path) {
  return `${BASE}${path}`;
}

export function resolveAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return API_ROOT ? `${API_ROOT}${url}` : url;
}

export function toStorageUrl(url) {
  if (!url) return "";
  if (API_ROOT && url.startsWith(API_ROOT)) {
    return url.slice(API_ROOT.length);
  }
  return url;
}

function getToken() {
  return sessionStorage.getItem("wings_admin_token") || "";
}

function authHeaders(json = true) {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function apiFetch(path, init = {}) {
  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      ...authHeaders(!(init.body instanceof FormData)),
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      const message = data?.error || "Unauthorised";

      if (/invalid token|unauthorised|expired/i.test(message)) {
        sessionStorage.removeItem("wings_admin_token");
        window.dispatchEvent(new CustomEvent("wings-admin-session-expired"));
      }
    }

    throw new Error(data?.error || "Request failed");
  }

  return data;
}

async function safeApiFetch(path, fallback, init = {}) {
  try {
    return await apiFetch(path, init);
  } catch {
    return fallback;
  }
}

export const api = {
  login: (username, password) =>
    apiFetch("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getTeam: () => apiFetch("/admin/team"),
  createTeam: (data) =>
    apiFetch("/admin/team", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTeam: (id, data) =>
    apiFetch(`/admin/team/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTeam: (id) =>
    apiFetch(`/admin/team/${id}`, {
      method: "DELETE",
    }),

  getArticles: () => apiFetch("/admin/articles"),
  createArticle: (data) =>
    apiFetch("/admin/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateArticle: (id, data) =>
    apiFetch(`/admin/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteArticle: (id) =>
    apiFetch(`/admin/articles/${id}`, {
      method: "DELETE",
    }),

  getCareers: () => apiFetch("/jobs"),
  createCareer: (data) =>
    apiFetch("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCareer: (id, data) =>
    apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCareer: (id) =>
    apiFetch(`/jobs/${id}`, {
      method: "DELETE",
    }),

  getEvents: () => apiFetch("/admin/events"),
  createEvent: (data) =>
    apiFetch("/admin/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (id, data) =>
    apiFetch(`/admin/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id) =>
    apiFetch(`/admin/events/${id}`, {
      method: "DELETE",
    }),

  getApplications: () => safeApiFetch("/admin/applications", []),
  updateApplicationStatus: (id, status, adminNotes) =>
    apiFetch(`/admin/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, adminNotes }),
    }),
  scheduleInterview: (appId, data) =>
    apiFetch(`/admin/applications/${appId}/schedule-interview`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInterviewAvailability: () => safeApiFetch("/admin/interview-availability", []),
  createInterviewSlotsBulk: (slots) =>
    apiFetch("/admin/interview-availability/bulk", {
      method: "POST",
      body: JSON.stringify({ slots }),
    }),
  deleteInterviewSlot: (id) =>
    apiFetch(`/admin/interview-availability/${id}`, {
      method: "DELETE",
    }),

  getCustomInterviewRequests: () => safeApiFetch("/admin/interview-custom-requests", []),
  resolveCustomRequest: (id, status) =>
    apiFetch(`/admin/interview-custom-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  getEmailRecipients: () => apiFetch("/admin/settings/emails"),
  createEmailRecipient: (data) =>
    apiFetch("/admin/settings/emails", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEmailRecipient: (id, data) =>
    apiFetch(`/admin/settings/emails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEmailRecipient: (id) =>
    apiFetch(`/admin/settings/emails/${id}`, {
      method: "DELETE",
    }),

  getFormSubmissionEmails: () => apiFetch("/admin/settings/primary-cc-mails"),
  getFormSubmissionEmail: (id) => apiFetch(`/admin/settings/primary-cc-mails/${id}`),
  updateFormSubmissionEmail: (id, data) =>
    apiFetch(`/admin/settings/primary-cc-mails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteFormSubmissionEmail: (id) =>
    apiFetch(`/admin/settings/primary-cc-mails/${id}`, {
      method: "DELETE",
    }),
  deleteFormSubmissionEmailsBulk: (ids) =>
    apiFetch("/admin/settings/primary-cc-mails/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  uploadFiles: async (files) => {
    const fd = new FormData();

    files.forEach((file) => {
      fd.append("files", file);
    });

    return apiFetch("/admin/upload", {
      method: "POST",
      body: fd,
    });
  },
};
