import React, { createContext, useContext, useState, useEffect } from "react";
import { apiUrl, queryClient } from "@/lib/queryClient";

const TOKEN_KEY = "wings_candidate_token";

/* -------------------- Context -------------------- */

const CandidateAuthContext = createContext({
  candidate: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  isAuthModalOpen: false,
  openAuthModal: (returnTo) => {},
  closeAuthModal: () => {},
});

/* -------------------- Provider -------------------- */

export function CandidateAuthProvider({ children }) {
  const [candidate, setCandidate] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReturnTo, setAuthModalReturnTo] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(apiUrl("/api/candidate/me"), {
      headers: {
        Authorization: `Bearer ${stored}`,
      },
      signal: controller.signal,
    })
      .then((r) => {
        clearTimeout(timeout);
        if (!r.ok) {
          localStorage.removeItem(TOKEN_KEY);
          setIsLoading(false);
          return;
        }

        return r.json().then((c) => {
          setToken(stored);
          setCandidate(c);
          queryClient.setQueryData(["/api/candidate/me", stored], c);
          setIsLoading(false);
        });
      })
      .catch(() => {
        clearTimeout(timeout);
        localStorage.removeItem(TOKEN_KEY);
        queryClient.setQueryData(["/api/candidate/me", ""], null);
        setIsLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  /* -------------------- Login -------------------- */

  function login(tok, cand) {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setCandidate(cand);
    queryClient.setQueryData(["/api/candidate/me", tok], cand);
  }

  /* -------------------- Logout -------------------- */

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCandidate(null);
    queryClient.setQueryData(["/api/candidate/me", ""], null);
  }

  /* -------------------- Modal -------------------- */

  function openAuthModal(returnTo = null) {
    setAuthModalReturnTo(returnTo);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  return (
    <CandidateAuthContext.Provider
      value={{
        candidate,
        token,
        login,
        logout,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalReturnTo,
      }}
    >
      {children}
    </CandidateAuthContext.Provider>
  );
}

/* -------------------- Hook -------------------- */

export function useCandidateAuth() {
  return useContext(CandidateAuthContext);
}

/* -------------------- API: Register -------------------- */

export async function candidateRegister(data) {
  const res = await fetch(apiUrl("/api/candidate/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "Registration failed");
  }

  return res.json();
}

/* -------------------- API: Login -------------------- */

export async function candidateLogin(email, password) {
  const res = await fetch(apiUrl("/api/candidate/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const e = await res.json();
    throw new Error(e.error || "Login failed");
  }

  return res.json();
}
