import { QueryClient, type QueryFunction } from "@tanstack/react-query";

const API_ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (!API_ROOT) {
    return path;
  }

  return `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
}

async function throwIfNotOk(res: Response) {
  if (res.ok) return;

  const text = await res.text().catch(() => "");
  let message = text || res.statusText;

  try {
    const parsed = JSON.parse(text);
    message = parsed.message || parsed.error || message;
  } catch {
    // keep plain text message
  }

  throw new Error(message);
}

const CANDIDATE_API_PREFIXES = [
  "/api/candidate/",
  "/api/applications/",
  "/api/profile",
];

function usesCandidateAuth(url: string): boolean {
  return CANDIDATE_API_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/** Pick the correct token for the API path (candidate vs admin). */
function getAuthToken(url: string): string | null {
  if (usesCandidateAuth(url)) {
    return localStorage.getItem("wings_candidate_token");
  }

  return (
    sessionStorage.getItem("wings_admin_token") ||
    localStorage.getItem("wings_candidate_token")
  );
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = getAuthToken(url);
  const res = await fetch(apiUrl(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const token = getAuthToken(url);
    const res = await fetch(apiUrl(url), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });

    if (
      res.status === 401 &&
      (unauthorizedBehavior === "returnNull" || usesCandidateAuth(url))
    ) {
      return null;
    }

    await throwIfNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
