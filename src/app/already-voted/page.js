"use client";

import Link from "next/link";

export default function AlreadyVotedPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6 animate-fade-in-up">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-[100px] translate-y-1/4 translate-x-1/4" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        
        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-emerald-900/5">
          
          {/* Decorative Top Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          
          <div className="p-8 sm:p-10 text-center space-y-8">
            
            {/* Success Icon Animation */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 shadow-sm mb-6">
              <svg className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-emerald-950">
                Already Voted
              </h1>
              <p className="text-slate-500 font-medium">
                Thank you for participating in this election.
              </p>
            </div>

            {/* Status Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-left shadow-inner">
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-full bg-blue-100 p-2 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Voting Locked</h3>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                    Our system shows that your vote has already been submitted securely. 
                    For security reasons, you cannot vote again or change your selection.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/profile"
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                View Profile
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md active:scale-[0.98]"
              >
                Return Home
              </Link>
            </div>

            <p className="text-xs text-slate-400 pt-4">
              Your vote is recorded on the immutable ledger.
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}