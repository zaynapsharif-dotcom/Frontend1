"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, handleError } from "../../lib/api";
import { useAdmin } from "../../lib/admin";

const ELECTION_ID = process.env.NEXT_PUBLIC_ELECTION_ID || "default";

function pickArray(...vals) {
  for (const v of vals) {
    if (Array.isArray(v)) return v;
  }
  return [];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const admin = useAdmin();

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [totals, setTotals] = useState(null);

  // Guard
  useEffect(() => {
    if (!admin.isReady) return;
    if (!admin.isLoggedIn) router.replace("/admin/login");
  }, [admin.isReady, admin.isLoggedIn, router]);

  async function fetchTotals() {
    setBanner(null);
    setLoading(true);
    try {
      const res = await apiGet(`/admin/totals?electionId=${encodeURIComponent(ELECTION_ID)}`, {
        token: admin.token,
      });
      setTotals(res);
    } catch (e) {
      const err = handleError(e);
      setBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!admin.isReady || !admin.isLoggedIn) return;
    fetchTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin.isReady, admin.isLoggedIn]);

  async function runAction(path) {
    setBanner(null);
    setLoading(true);
    try {
      await apiPost(path, { electionId: ELECTION_ID }, { token: admin.token });
      setBanner({ type: "success", message: `Action succeeded: ${path}` });
      await fetchTotals();
    } catch (e) {
      const err = handleError(e);
      setBanner({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // ✅ Your backend shape:
  const turnoutObj = totals?.turnout && typeof totals.turnout === "object" ? totals.turnout : null;

  const perCandidate = pickArray(
    totals?.candidateTotals,
    totals?.perCandidate,
    totals?.candidates,
    totals?.candidateTotals 
  );

  const perParty = pickArray(
    totals?.partyTotals,
    totals?.perParty,
    totals?.parties,
    totals?.partyTotals 
  );

  const maxCandidateVotes = useMemo(() => {
    const vals = perCandidate.map((x) => Number(x?.votes ?? x?.count ?? 0) || 0);
    return Math.max(1, ...vals);
  }, [perCandidate]);

  if (!admin.isReady) return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50/50">
       <div className="flex flex-col items-center gap-4">
         <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
         <span className="text-sm font-semibold text-slate-400 tracking-wider">INITIALIZING DASHBOARD...</span>
       </div>
    </div>
  );

  return (
    <main className="min-h-screen w-full bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900 animate-fade-in-up">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-70" />
      </div>

      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* --- Top Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/60">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-3">
              <span className="bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">Admin Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Config: <span className="font-mono text-emerald-700 font-bold">{ELECTION_ID}</span>
              </span>
            </div>
          </div>

          <button
            onClick={fetchTotals}
            disabled={loading}
            className="group flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-700 group-hover:text-emerald-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Syncing Data..." : "Refresh Overview"}
          </button>
        </div>

        {/* --- Banner Notification --- */}
        {banner && (
          <div className={`rounded-xl border p-4 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
            banner.type === "error" 
              ? "bg-red-50 border-red-100 text-red-800" 
              : "bg-emerald-50 border-emerald-100 text-emerald-800"
          }`}>
             <div className={`shrink-0 rounded-full p-1 ${banner.type === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
               {banner.type === "error" ? (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               ) : (
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
               )}
             </div>
             <span className="text-sm font-medium pt-0.5">{banner.message}</span>
          </div>
        )}

        {/* --- KPI & Control Grid --- */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Turnout Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <svg className="w-32 h-32 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                  Voter Turnout Metrics
                </h2>
                <p className="text-sm text-slate-500 mt-1 pl-3.5">Real-time participation overview.</p>
              </div>

              {turnoutObj ? (
                <div className="mt-8 grid grid-cols-3 gap-8 border-t border-slate-100 pt-8">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Participation Rate</div>
                    <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
                      {typeof turnoutObj.turnoutRate === "number"
                        ? `${Math.round(turnoutObj.turnoutRate * 100)}%`
                        : turnoutObj.turnoutRate}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Votes Cast</div>
                    <div className="text-3xl font-bold text-slate-800 font-mono">
                      {turnoutObj.votersVoted}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Eligible</div>
                    <div className="text-3xl font-bold text-slate-400 font-mono">
                      {turnoutObj.totalVoters}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex items-center justify-center h-24 text-slate-400 text-sm italic border-t border-slate-100">
                  Waiting for data sync...
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                Lifecycle Controls
              </h2>
              <p className="text-sm text-slate-500 mt-1 pl-3.5">Manage election state.</p>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={() => runAction("/admin/open")}
                disabled={loading}
                className="w-full group relative flex items-center justify-between overflow-hidden rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 hover:shadow-md disabled:opacity-50"
              >
                <span>Open Election</span>
                <span className="bg-emerald-200/50 p-1.5 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </span>
              </button>
              
              <button
                onClick={() => runAction("/admin/close")}
                disabled={loading}
                className="w-full group relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 hover:shadow-md disabled:opacity-50"
              >
                <span>Close Election</span>
                <span className="bg-slate-200/50 p-1.5 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </span>
              </button>
              
              <div className="h-px bg-slate-100 my-2"></div>

              <button
                onClick={() => runAction("/admin/finalize")}
                disabled={loading}
                className="w-full group relative flex items-center justify-between overflow-hidden rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg disabled:opacity-50"
              >
                <span>Finalize Results</span>
                <span className="bg-slate-700 p-1.5 rounded-lg group-hover:bg-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Detailed Data Grids --- */}
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* Candidates Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <div className="p-1.5 bg-blue-100 rounded-md text-blue-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                 Candidate Performance
               </h3>
               <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Counts</span>
            </div>

            <div className="p-6 flex-1">
              {perCandidate.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  No candidate data available yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {perCandidate.map((c, idx) => {
                    const name = c?.name || c?.candidateName || c?.candidateId || `Candidate ${idx + 1}`;
                    const votes = Number(c?.votes ?? c?.count ?? 0) || 0;
                    const pct = maxCandidateVotes > 0 ? Math.round((votes / maxCandidateVotes) * 100) : 0;

                    return (
                      <div key={idx} className="group relative">
                        <div className="flex items-center justify-between gap-4 mb-2 relative z-10">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{name}</span>
                            {c?.partyId && (
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                                Party: {c.partyId}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            {votes.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Stacked Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Parties Section */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                 Party Distribution
               </h3>
               <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aggregation</span>
            </div>

            <div className="p-6 flex-1">
              {perParty.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  No party data available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {perParty.map((p, idx) => {
                    const name = p?.name || p?.partyName || p?.partyId || `Party ${idx + 1}`;
                    const votes = Number(p?.votes ?? p?.count ?? 0) || 0;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shadow-sm group-hover:scale-105 transition-transform">
                            {name.charAt(0)}
                          </div>
                          <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-900 transition-colors">{name}</div>
                        </div>
                        <div className="text-base font-mono font-bold text-slate-900">{votes.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* --- Developer Info (Accordion) --- */}
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-600 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between select-none">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              Raw Data Inspector
            </span>
            <span className="transform group-open:rotate-180 transition-transform text-slate-400">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </span>
          </summary>
          <div className="bg-slate-950 p-6 border-t border-slate-200">
            <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-80 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {JSON.stringify(totals, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </main>
  );
}