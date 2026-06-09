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

/** Returns the best available auth token: admin first, then candidate. */
function getBestToken(): string | null {
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
  const token = getBestToken();
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
    const token = getBestToken();
    const res = await fetch(apiUrl(queryKey[0] as string), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
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
