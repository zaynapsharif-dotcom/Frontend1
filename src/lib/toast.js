"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function remove(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function push(type, message) {
    const id = uid();
    const toast = { id, type, message };

    setToasts((prev) => [toast, ...prev]);

    // auto dismiss
    setTimeout(() => remove(id), 3000);

    return id;
  }

  const api = useMemo(
    () => ({
      toasts,
      remove,
      success: (msg) => push("success", msg),
      error: (msg) => push("error", msg),
      info: (msg) => push("info", msg),
    }),
    [toasts]
  );

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}
