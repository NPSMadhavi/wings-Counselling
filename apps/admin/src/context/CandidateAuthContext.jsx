import React, { createContext, useContext, useState, useEffect } from "react";

const TOKEN_KEY = "wings_candidate_token";
const BASE = "/api";

/* -------------------- Context -------------------- */

const CandidateAuthContext = createContext({
  candidate: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

/* -------------------- Provider -------------------- */

export function CandidateAuthProvider({ children }) {
  const [candidate, setCandidate] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);

    if (!stored) {
      setIsLoading(false);
      return;
    }

    fetch(`${BASE}/candidate/me`, {
      headers: {
        Authorization: `Bearer ${stored}`,
      },
    })
      .then((r) => {
        if (!r.ok) {
          localStorage.removeItem(TOKEN_KEY);
          setIsLoading(false);
          return;
        }

        return r.json().then((c) => {
          setToken(stored);
          setCandidate(c);
          setIsLoading(false);
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setIsLoading(false);
      });
  }, []);

  /* -------------------- Login -------------------- */

  function login(tok, cand) {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setCandidate(cand);
  }

  /* -------------------- Logout -------------------- */

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCandidate(null);
  }

  return (
    <CandidateAuthContext.Provider
      value={{ candidate, token, login, logout, isLoading }}
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
  const res = await fetch(`${BASE}/candidate/register`, {
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
  const res = await fetch(`${BASE}/candidate/login`, {
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