"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "evote_voter_auth_v1";

const AuthContext = createContext(null);

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [voter, setVoter] = useState(null);
  const [isReady, setIsReady] = useState(false);

  function saveToStorage(nextToken, nextVoter) {
    if (typeof window === "undefined") return;
    if (!nextToken) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        voter: nextVoter || null,
      })
    );
  }

  function loadFromStorage() {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (parsed?.token) {
      setToken(parsed.token);
      setVoter(parsed.voter || null);
    }
  }

  function login(nextToken, nextVoter) {
    setToken(nextToken);
    setVoter(nextVoter || null);
    saveToStorage(nextToken, nextVoter || null);
  }

  function logout() {
    setToken(null);
    setVoter(null);
    saveToStorage(null, null);
  }

  // Load once on mount
  useEffect(() => {
    loadFromStorage();
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      voter,
      isReady,
      isLoggedIn: !!token,
      login,
      logout,
      setVoter, // useful after calling /me later
    }),
    [token, voter, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}
