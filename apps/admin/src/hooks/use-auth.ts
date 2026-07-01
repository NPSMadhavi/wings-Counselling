import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/queryClient";
import { useCandidateAuth } from "@/context/CandidateAuthContext";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified?: boolean;
}

function readCandidateToken(): string | null {
  return localStorage.getItem("wings_candidate_token");
}

async function fetchUser(): Promise<AuthUser | null> {
  const token = readCandidateToken();
  if (!token) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(apiUrl("/api/candidate/me"), {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (response.status === 401) {
      localStorage.removeItem("wings_candidate_token");
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const candidateAuth = useCandidateAuth();
  const authToken = candidateAuth.token || readCandidateToken();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/candidate/me", authToken ?? ""],
    queryFn: fetchUser,
    enabled: !!authToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      candidateAuth.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/candidate/me"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
