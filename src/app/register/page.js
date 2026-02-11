"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiPost, handleError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

import { enforceLiveness } from "../../lib/livenessGuard";


export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not passed recently, redirect to /liveness?next=/register
    enforceLiveness(router, pathname || "/register");
  }, [router, pathname]);

  const auth = useAuth();

  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [voterId, setVoterId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null); // { type: "error"|"success", message }

  async function sendOtp(e) {
    e.preventDefault();
    setBanner(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setBanner({ type: "error", message: "Phone is required." });
      return;
    }

    setLoading(true);
    try {
      await apiPost("/auth/otp/send", { phone: cleanPhone });
      setBanner({ type: "success", message: "OTP sent. Check your phone." });
      setStep(2);
    } catch (err) {
      const e2 = handleError(err);
      setBanner({ type: "error", message: e2.message });
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndCreate(e) {
    e.preventDefault();
    setBanner(null);

    const payload = {
      voterId: voterId.trim(),
      phone: phone.trim(),
      otpCode: otpCode.trim(),
      password,
    };

    if (!payload.voterId || !payload.phone || !payload.otpCode || !payload.password) {
      setBanner({ type: "error", message: "All fields are required." });
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost("/auth/register/verify-otp-and-create", payload);

      // We assume backend returns something like:
      // { token: "JWT", voter: { voterId, hasVoted, status, ... } }
      const token = res?.token || res?.jwt || res?.accessToken;
      const voter = res?.voter || res?.profile || res?.me;

      if (!token || !voter) {
        setBanner({
          type: "error",
          message: "Register succeeded but response missing token/profile. Check backend response shape.",
        });
        return;
      }

      auth.login(token, voter);
      router.push("/ballot");
    } catch (err) {
      const e2 = handleError(err);
      setBanner({ type: "error", message: e2.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/30 p-4 font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* Decorative Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-[20%] -right-[5%] w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="w-full max-w-md space-y-6 animate-fade-in-up">

        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">
            Create Account
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {step === 1 ? "Begin secure registration" : "Verify & Complete Profile"}
          </p>
        </div>

        {/* Notifications */}
        {banner ? (
          <div
            className={`
              rounded-xl p-4 border flex items-start gap-3 shadow-sm
              ${banner.type === "error"
                ? "bg-red-50 border-red-100 text-red-800"
                : "bg-emerald-50 border-emerald-100 text-emerald-800"
              }
            `}
          >
            <span className="mt-0.5 shrink-0">
              {banner.type === "error" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </span>
            <span className="text-sm font-medium leading-relaxed">{banner.message}</span>
          </div>
        ) : null}

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 relative overflow-hidden">

          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

          {step === 1 ? (
            <form onSubmit={sendOtp} className="space-y-6">
              <p className="mb-3 text-xs text-slate-500">
                You may be redirected to a quick liveness check (blink + head turn) before registration.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Mobile Number
                </label>
                <div className="relative group">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +9647XXXXXXXXX"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-slate-900 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-200 hover:bg-slate-50"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium ml-1">
                  We'll send a one-time password to verify this number.
                </p>
              </div>

              <button
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Sending...
                  </span>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyAndCreate} className="space-y-5">

              {/* Phone Summary */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <span className="font-mono font-medium">{phone.trim()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-200 underline-offset-2 transition-colors"
                >
                  Change
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">OTP Code</label>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm tracking-widest placeholder:tracking-normal placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Voter ID</label>
                  <input
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    placeholder="Your official ID"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Profile..." : "Complete Registration"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Secure • Encrypted • Private
        </p>

      </div>
    </main>
  );
}