"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "evote_admin_auth_v1";

const AdminContext = createContext(null);

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AdminProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  function saveToStorage(nextToken) {
    if (typeof window === "undefined") return;
    if (!nextToken) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken }));
  }

  function loadFromStorage() {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);
    if (parsed?.token) setToken(parsed.token);
  }

  function login(nextToken) {
    setToken(nextToken);
    saveToStorage(nextToken);
  }

  function logout() {
    setToken(null);
    saveToStorage(null);
  }

  useEffect(() => {
    loadFromStorage();
    setIsReady(true);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isReady,
      isLoggedIn: !!token,
      login,
      logout,
    }),
    [token, isReady]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider />");
  return ctx;
}
