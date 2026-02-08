"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, handleError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [me, setMe] = useState(null);

  // Guard: require login
  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) router.replace("/login");
  }, [auth.isReady, auth.isLoggedIn, router]);

  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) return;

    let mounted = true;

    async function loadMe() {
      setLoading(true);
      setBanner(null);
      try {
        const res = await apiGet("/me", { token: auth.token });

        if (!mounted) return;
        setMe(res);

        // Keep auth context in sync (optional but helpful)
        if (res && typeof res === "object") {
          auth.setVoter((prev) => ({
            ...(prev || {}),
            voterId: res.voterId ?? prev?.voterId,
            hasVoted: res.hasVoted ?? prev?.hasVoted,
            status: res.status ?? prev?.status,
          }));
        }
      } catch (e) {
        if (!mounted) return;
        const err = handleError(e);
        setBanner({ type: "error", message: err.message });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, [auth.isReady, auth.isLoggedIn, auth.token]);

  if (!auth.isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
             <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
             <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
           </div>
           <span className="text-sm font-semibold text-slate-500 animate-pulse tracking-wide">VERIFYING IDENTITY...</span>
        </div>
      </div>
    );
  }

  const voterId = me?.voterId ?? auth.voter?.voterId ?? "—";
  const hasVoted = me?.hasVoted ?? auth.voter?.hasVoted ?? false;
  const status = me?.status ?? auth.voter?.status ?? "—";

  return (
    <main className="min-h-screen w-full bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-70" />
      </div>

      <div className="mx-auto max-w-3xl space-y-8 animate-fade-in-up">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-3">
              <span className="bg-gradient-to-br from-emerald-700 to-teal-600 bg-clip-text text-transparent">Voter Profile</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed">
              Manage your verified identity, monitor your voting status, and review security logs.
            </p>
          </div>

          <button
            onClick={() => router.refresh()}
            className="group flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md active:scale-95"
          >
            <svg 
              className="h-4 w-4 text-slate-400 transition-transform duration-500 group-hover:rotate-180 group-hover:text-emerald-500" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Data
          </button>
        </div>

        {/* --- Notifications --- */}
        {banner ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
             <div className="shrink-0 rounded-full bg-red-100 p-1">
               <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="pt-0.5">{banner.message}</div>
          </div>
        ) : null}

        {/* --- Main Profile Card --- */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <div className="p-8 md:p-10 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
                <span className="text-sm font-semibold text-slate-400 tracking-wider">RETRIEVING SECURE DATA...</span>
              </div>
            ) : (
              <>
                {/* Identity & Security Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  
                  {/* ID Card */}
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-md">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    </div>
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity Token</span>
                        <div className="font-mono text-sm font-bold text-slate-700 truncate" title={String(voterId)}>
                          {String(voterId)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-emerald-600">Encrypted</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Status Card */}
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md">
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Status</span>
                        <div className="flex items-center gap-2">
                           <span className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm ${status === 'active' || status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                           <span className="font-bold text-sm text-slate-700 capitalize">
                             {String(status)}
                           </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div className={`h-1 rounded-full ${status === 'active' ? 'bg-emerald-500 w-full' : 'bg-amber-400 w-2/3'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Participation Card */}
                  <div className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md flex flex-col justify-center items-center text-center gap-2 ${hasVoted ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50/50 border-slate-200'}`}>
                     <div className={`p-3 rounded-full ${hasVoted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                       {hasVoted ? (
                         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       ) : (
                         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       )}
                     </div>
                     <div>
                       <div className={`text-sm font-bold ${hasVoted ? 'text-emerald-800' : 'text-slate-600'}`}>
                         {hasVoted ? "Vote Cast" : "Pending Vote"}
                       </div>
                     </div>
                  </div>
                </div>

                {/* Status Action Block */}
                {hasVoted ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
                    
                    <div className="shrink-0 rounded-full bg-white p-4 shadow-sm ring-1 ring-emerald-100">
                      <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-emerald-950">Voting Process Complete</h3>
                      <p className="mt-1 text-sm text-emerald-800/80 leading-relaxed max-w-xl">
                        Your ballot has been cryptographically signed and permanently recorded on the immutable election ledger. Thank you for participating.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-100/50 blur-2xl" />
                    
                    <div className="shrink-0 rounded-full bg-white p-4 shadow-sm ring-1 ring-blue-100 animate-pulse-slow">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="relative z-10 flex-1">
                      <h3 className="text-lg font-bold text-blue-950">Action Required: Ballot Pending</h3>
                      <p className="mt-1 text-sm text-blue-800/80 leading-relaxed max-w-lg">
                        You are eligible to vote in the current election cycle. Please proceed to the secure ballot area to cast your vote.
                      </p>
                    </div>
                    <button 
                      onClick={() => router.push('/ballot')}
                      className="relative z-10 shrink-0 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-105 hover:shadow-blue-500/30 active:scale-95"
                    >
                      Go to Ballot &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer Security Note */}
          <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest">
            <span>Secure Connection</span>
            <span>E2E Encrypted</span>
          </div>
        </div>
      </div>
    </main>
  );
}