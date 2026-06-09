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

async function fetchUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem("wings_candidate_token");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(apiUrl("/api/candidate/me"), {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    });

    if (response.status === 401) {
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

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/candidate/me"],
    queryFn: fetchUser,
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
