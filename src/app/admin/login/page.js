"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiPost, handleError } from "../../../lib/api";
import { useAdmin } from "../../../lib/admin";

import { enforceLiveness } from "../../../lib/livenessGuard";


export default function AdminLoginPage() {
  const router = useRouter();
  const pathname = usePathname();

useEffect(() => {
  // If not passed recently, redirect to /liveness?next=/admin/login
enforceLiveness(router, pathname || "/admin/login", "admin");
}, [router, pathname]);

  const admin = useAdmin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setBanner(null);

    const u = username.trim();
    if (!u || !password) {
      setBanner({ type: "error", message: "Username and password are required." });
      return;
    }

    setLoading(true);
    try {
      // We send both keys to be tolerant (backend can ignore extras):
      const res = await apiPost("/admin/login", {
        username: u,
        adminId: u,
        password,
      });

      const token = res?.token || res?.jwt || res?.accessToken;
      if (!token) {
        setBanner({ type: "error", message: "Login succeeded but response missing token." });
        return;
      }

      admin.login(token);
      router.push("/admin");
    } catch (err) {
      const e2 = handleError(err);
      setBanner({ type: "error", message: e2.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    // Updated background gradient to Blue/Indigo
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 p-4 sm:p-6 font-sans">
      
      {/* Background Decor - Shifted to Blue/Sky blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sky-100/30 rounded-full blur-[100px] translate-y-1/4 translate-x-1/4" />
      </div>

      <div className="w-full max-w-md space-y-8 animate-fade-in-up relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          {/* Blue Accent: Secure Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Secure Admin Access
          </div>
          
          {/* Title text color adjusted for better contrast with blue theme */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Please enter your credentials to access the dashboard.
          </p>
        </div>

        {/* Card Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          
          {/* Top Decorative Line - Blue to Indigo Gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-400" />

          {/* Error Banner (Kept Red for standard error visualization) */}
          {banner && (
            <div className="mx-6 mt-6 rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
              <div className="shrink-0">
                 <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                 </svg>
              </div>
              <p className="text-sm font-medium text-red-800">{banner.message}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="p-8 space-y-6">
            
            {/* Username Input - Blue Focus states */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Username / Admin ID
              </label>
              <div className="relative group">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  placeholder="Enter your admin ID"
                />
              </div>
            </div>

            {/* Password Input - Blue Focus states */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button - Blue/Indigo Gradient and Shadows */}
            <button
              disabled={loading}
              type="submit"
              className={`
                group relative w-full overflow-hidden rounded-xl py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 
                transition-all duration-300 hover:shadow-blue-500/30 hover:scale-[1.01]
                bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                focus:outline-none focus:ring-4 focus:ring-blue-500/30
                disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none
                ${loading ? "cursor-wait" : ""}
              `}
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
                    Sign In to Dashboard
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>
          
          {/* Footer of Card - Blue Icon Accent */}
          <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-center backdrop-blur-sm">
             <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
               <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               Protected by Evote Secure System
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}