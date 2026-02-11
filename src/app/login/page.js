"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiPost, handleError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

import { enforceLiveness } from "../../lib/livenessGuard";


export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not passed recently, redirect to /liveness?next=/login
    enforceLiveness(router, pathname || "/login");
  }, [router, pathname]);

  const auth = useAuth();

  const [voterId, setVoterId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null); // { type: "error"|"info", message }

  async function onSubmit(e) {
    e.preventDefault();
    setBanner(null);

    const payload = {
      voterId: voterId.trim(),
      password,
    };

    if (!payload.voterId || !payload.password) {
      setBanner({ type: "error", message: "Voter ID and password are required." });
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost("/auth/login", payload);

      // Expected response (MVP):
      // { token: "JWT", voter: { voterId, hasVoted, status } }
      const token = res?.token || res?.jwt || res?.accessToken;
      const voter = res?.voter || res?.profile || res?.me;

      if (!token || !voter) {
        setBanner({
          type: "error",
          message: "Login succeeded but response missing token/profile. Check backend response shape.",
        });
        return;
      }

      auth.login(token, voter);
      router.push("/ballot");
    } catch (err) {
      const e2 = handleError(err);

      if (e2.code === "ACCOUNT_LOCKED") {
        setBanner({
          type: "info",
          message:
            "Your account is locked due to multiple failed attempts. Please wait and try again later or contact support.",
        });
      } else {
        setBanner({ type: "error", message: e2.message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 p-4 sm:p-6 font-sans">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-[100px] translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">

        {/* Header Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Secure Voting Portal Access
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">

          {/* Status Banners */}
          {banner ? (
            <div
              className={`
                mb-6 rounded-xl border p-4 text-sm font-medium flex gap-3 shadow-sm
                ${banner.type === "error"
                  ? "border-red-100 bg-red-50 text-red-800"
                  : "border-blue-100 bg-blue-50 text-blue-800"
                }
              `}
            >
              <span className="shrink-0 mt-0.5">
                {banner.type === "error" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </span>
              {banner.message}
            </div>
          ) : null}


          <form onSubmit={onSubmit} className="space-y-6">
            <p className="mb-3 text-xs text-slate-500">
              You may be redirected to a quick liveness check (blink + head turn) before login.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Voter Id
              </label>
              <input
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="Enter your Voter ID"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200"
              />
            </div>

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Portal
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Protected by Enterprise Grade Security
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}