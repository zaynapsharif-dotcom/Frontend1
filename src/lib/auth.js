"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [voter, setVoterState] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const saveToStorage = useCallback((nextToken, nextVoter) => {
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
  }, []);

  const loadFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw);

    if (parsed?.token) {
      setToken(parsed.token);
      setVoterState(parsed.voter || null);
    }
  }, []);

  const login = useCallback(
    (nextToken, nextVoter) => {
      setToken(nextToken);
      setVoterState(nextVoter || null);
      saveToStorage(nextToken, nextVoter || null);
    },
    [saveToStorage]
  );

  const logout = useCallback(() => {
    setToken(null);
    setVoterState(null);
    saveToStorage(null, null);
  }, [saveToStorage]);

  /**
   * Safely update voter data in both React state and localStorage.
   *
   * Why this matters:
   * After successful voting, the frontend may need to set hasVoted=true.
   * If we only update React state, localStorage can stay stale and restore
   * old voter data after refresh.
   */
  const updateVoter = useCallback(
    (nextVoterOrUpdater) => {
      setVoterState((currentVoter) => {
        const nextVoter =
          typeof nextVoterOrUpdater === "function"
            ? nextVoterOrUpdater(currentVoter)
            : nextVoterOrUpdater;

        saveToStorage(token, nextVoter || null);
        return nextVoter || null;
      });
    },
    [saveToStorage, token]
  );

  // Load once on mount
  useEffect(() => {
    loadFromStorage();
    setIsReady(true);
  }, [loadFromStorage]);

  const value = useMemo(
    () => ({
      token,
      voter,
      isReady,
      isLoggedIn: !!token,
      login,
      logout,

      // Preferred method: updates state + localStorage.
      updateVoter,

      // Backward-compatible alias for old code that calls auth.setVoter(...).
      // This now persists to localStorage too.
      setVoter: updateVoter,
    }),
    [token, voter, isReady, login, logout, updateVoter]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider />");
  return ctx;
}