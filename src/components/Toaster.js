"use client";

import { useToast } from "../lib/toast";

export default function Toaster() {
  const toast = useToast();

  if (!toast.toasts.length) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toast.toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-300 animate-in slide-in-from-right-10 fade-in zoom-in-95",
            "bg-white/95 border-l-[6px]", // Thick colored left border for quick identification
            t.type === "success"
              ? "border-emerald-100 border-l-emerald-500 shadow-emerald-500/10"
              : t.type === "error"
              ? "border-red-100 border-l-red-500 shadow-red-500/10"
              : "border-blue-100 border-l-blue-500 shadow-blue-500/10",
          ].join(" ")}
          role="alert"
        >
          <div className="flex items-start gap-3">
            
            {/* Context Icon based on type */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" ? (
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : t.type === "error" ? (
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>

            <div className="flex-1 pt-0.5">
              <p className="text-sm font-medium text-slate-800 leading-snug">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => toast.remove(t.id)}
              className="shrink-0 rounded-md p-1 text-slate-400 opacity-70 transition-opacity hover:bg-slate-100 hover:text-slate-600 hover:opacity-100"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}