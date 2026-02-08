"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet, handleError } from "../lib/api";

export default function HomePage() {
  const [status, setStatus] = useState("checking"); // checking | up | down
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      setStatus("checking");
      setMessage("");
      try {
        await apiGet("/health");
        if (!mounted) return;
        setStatus("up");
      } catch (e) {
        if (!mounted) return;
        const err = handleError(e);
        setStatus("down");
        setMessage(err.message);
      }
    }

    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-[85vh] w-full flex flex-col items-center justify-center bg-slate-50/50 p-6 md:p-12 animate-fade-in-up">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] translate-y-1/2" />
      </div>

      <div className="w-full max-w-6xl space-y-12">
        
        {/* --- Hero Section --- */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <div
              className={[
                "inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm transition-all duration-500",
                status === "up"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : status === "down"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-slate-50 border-slate-200 text-slate-500",
              ].join(" ")}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'up' ? 'bg-emerald-500' : status === 'down' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status === 'up' ? 'bg-emerald-500' : status === 'down' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
              </span>
              {status === "checking" ? "Connecting to Nodes..." : status === "up" ? "System Operational" : "System Offline"}
            </div>
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">
              Secure Voting
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Experience the next generation of decentralized elections. 
            Transparent, immutable, and powered by advanced cryptography.
          </p>

          {/* Error Message Display */}
          {status === "down" && message ? (
            <div className="inline-block px-4 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              Error: {message}
            </div>
          ) : null}
        </div>

        {/* --- Interactive Cards Grid --- */}
        <div className="grid gap-6 md:grid-cols-3 pt-8">
          
          {/* Card 1: Register */}
          <Link
            href="/register"
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Register</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  New to the platform? Create your secure voter identity using OTP verification.
                </p>
              </div>
              <div className="pt-2 flex items-center text-sm font-bold text-emerald-600 group-hover:underline decoration-2 underline-offset-4">
                Get Started &rarr;
              </div>
            </div>
          </Link>

          {/* Card 2: Login */}
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200"
          >
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Voter Login</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Access the ballot and cast your vote using your Voter ID and password.
                </p>
              </div>
              <div className="pt-2 flex items-center text-sm font-bold text-blue-600 group-hover:underline decoration-2 underline-offset-4">
                Sign In &rarr;
              </div>
            </div>
          </Link>

          {/* Card 3: Admin */}
          <Link
            href="/admin/login"
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-500/10 hover:border-slate-400"
          >
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg className="w-24 h-24 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Admin Portal</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  Restricted access. Manage election cycles, monitor nodes, and finalize results.
                </p>
              </div>
              <div className="pt-2 flex items-center text-sm font-bold text-slate-600 group-hover:underline decoration-2 underline-offset-4">
                Access Dashboard &rarr;
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}