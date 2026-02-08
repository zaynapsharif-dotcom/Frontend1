"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, handleError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const ELECTION_ID = process.env.NEXT_PUBLIC_ELECTION_ID || "default";

function isActiveStatus(x) {
  // backend uses status: "active"
  return (x || "").toLowerCase() === "active";
}

export default function BallotPage() {
  const router = useRouter();
  const auth = useAuth();

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [data, setData] = useState(null);

  // Guard: require voter login
  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) router.replace("/login");
  }, [auth.isReady, auth.isLoggedIn, router]);

  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) return;

    let mounted = true;

    async function loadBallot() {
      setLoading(true);
      setBanner(null);

      try {
        const res = await apiGet(`/ballot?electionId=${encodeURIComponent(ELECTION_ID)}`, {
          token: auth.token || undefined,
        });

        if (!mounted) return;
        setData(res);
      } catch (e) {
        if (!mounted) return;
        const err = handleError(e);
        setBanner({ type: "error", message: err.message });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBallot();
    return () => {
      mounted = false;
    };
  }, [auth.isReady, auth.isLoggedIn, auth.token]);

  function onPickCandidate(candidateId) {
    router.push(`/vote?candidateId=${encodeURIComponent(candidateId)}`);
  }

  if (!auth.isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
             <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
             <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
             </div>
           </div>
           <span className="text-sm font-semibold text-slate-500 animate-pulse tracking-wide">VERIFYING SECURE SESSION...</span>
        </div>
      </div>
    );
  }

  const parties = data?.parties || [];

  // Sort parties by "order" if present
  const sortedParties = [...parties].sort((a, b) => {
    const ao = typeof a?.order === "number" ? a.order : 9999;
    const bo = typeof b?.order === "number" ? b.order : 9999;
    return ao - bo;
  });

  return (
    <main className="min-h-screen w-full bg-slate-50/50 p-6 md:p-10 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 opacity-70" />
      </div>

      <div className="mx-auto max-w-5xl space-y-10 animate-fade-in-up">
        
        {/* --- Header Section --- */}
        <div className="space-y-6">
          {/* Breadcrumb / Step Indicator */}
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
             <span className="flex items-center gap-1 text-emerald-600">
               <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px]">1</span>
               Ballot Selection
             </span>
             <span className="h-px w-8 bg-slate-200" />
             <span className="flex items-center gap-1">
               <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px]">2</span>
               Confirm Vote
             </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950 flex items-center gap-3">
                <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Official Ballot
              </h1>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Election ID: <span className="font-mono text-slate-700">{ELECTION_ID}</span>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:inline text-slate-400">Select one candidate to proceed</span>
              </div>
            </div>

            <button
              onClick={() => router.refresh()}
              className="group flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md active:scale-95"
            >
              <div className="relative">
                 <svg className="h-4 w-4 text-slate-400 transition-transform duration-700 group-hover:rotate-180 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              Refresh Data
            </button>
          </div>
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

        {/* --- Loading Skeletons --- */}
        {loading ? (
          <div className="grid gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                   {[1, 2, 3].map(j => <div key={j} className="h-24 rounded-xl bg-slate-50 animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* --- Empty State --- */}
        {!loading && sortedParties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
            <div className="rounded-full bg-slate-100 p-6 mb-6 ring-8 ring-slate-50">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Ballot is Empty</h3>
            <p className="text-slate-500 max-w-sm mt-2 leading-relaxed">The election configuration currently has no active parties or candidates listed.</p>
          </div>
        ) : null}

        {/* --- Parties Grid --- */}
        {!loading && sortedParties.length > 0 ? (
          <div className="space-y-10">
            {sortedParties.map((p) => {
              const partyId = p?.partyId || p?._id || p?.id || p?.code || p?.name;
              const partyName = p?.name || p?.title || String(partyId || "Party");
              const partyStatus = p?.status;

              const rawCandidates = Array.isArray(p?.candidates) ? p.candidates : [];
              const activeCandidates = rawCandidates.filter((c) => isActiveStatus(c?.status));

              return (
                <section
                  key={String(partyId)}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Decorative Header Background */}
                  <div className="absolute top-0 inset-x-0 h-32 bg-slate-50 opacity-50 pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)', backgroundSize: '24px 24px' }} 
                  />
                  
                  {/* Top Gradient Line */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

                  {/* Party Info Header */}
                  <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8">
                    <div className="flex items-start gap-5">
                      {/* Party Logo Box */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/10 ring-4 ring-white">
                        <span className="text-3xl font-bold font-serif">{partyName.charAt(0).toUpperCase()}</span>
                      </div>
                      
                      <div className="space-y-1 pt-1">
                        <h2 className="text-2xl font-bold text-slate-900 leading-none">{partyName}</h2>
                        <div className="flex flex-wrap items-center gap-3">
                          {p?.symbol && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">
                              <span className="text-slate-400">Sym:</span>
                              {p.symbol}
                            </span>
                          )}
                          {typeof p?.order === "number" && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">
                               <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                               Order: {p.order}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {partyStatus && (
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                        partyStatus.toLowerCase() === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${partyStatus.toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {partyStatus}
                      </div>
                    )}
                  </div>

                  {/* Candidates Area */}
                  <div className="relative border-t border-slate-100 bg-slate-50/30 p-6 md:p-8">
                    {activeCandidates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <svg className="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span className="text-slate-500 text-sm font-medium">No active candidates listed.</span>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {activeCandidates.map((c) => {
                          const id = c?.candidateId || c?._id || c?.id;
                          const name = c?.name || c?.fullName || c?.title || `Candidate ${id}`;
                          
                          return (
                            <button
                              key={String(id)}
                              onClick={() => onPickCandidate(id)}
                              className="group/card relative flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 hover:ring-1 hover:ring-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              <div className="flex w-full items-start justify-between">
                                {/* Visual Avatar */}
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-100 transition-colors group-hover/card:bg-emerald-50 group-hover/card:text-emerald-600 group-hover/card:border-emerald-100">
                                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </div>
                                
                                {/* Selection Circle */}
                                <div className="h-5 w-5 rounded-full border-2 border-slate-200 transition-colors group-hover/card:border-emerald-500 group-hover/card:bg-emerald-500 flex items-center justify-center">
                                   <svg className="h-3 w-3 text-white opacity-0 group-hover/card:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </div>
                              </div>

                              <div className="w-full space-y-1">
                                <div className="font-bold text-slate-800 line-clamp-1 group-hover/card:text-emerald-900 transition-colors">
                                  {name}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 group-hover/card:text-emerald-700/80 transition-colors">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                  ID: {String(id)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}