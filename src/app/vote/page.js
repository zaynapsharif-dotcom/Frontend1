"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost, handleError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useToast } from "../../lib/toast";
import { friendlyError } from "../../lib/format";

const ELECTION_ID = process.env.NEXT_PUBLIC_ELECTION_ID || "default";

export default function VotePage() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const toast = useToast();

  const candidateId = params.get("candidateId") || "";

  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null); // { tokenId, nonce, expiresAt }
  const [stage, setStage] = useState("confirm"); // confirm | issued

  // Guard: require login
  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) router.replace("/login");
  }, [auth.isReady, auth.isLoggedIn, router]);

  // Missing candidateId
  useEffect(() => {
    if (!auth.isReady) return;
    if (!auth.isLoggedIn) return;
    if (!candidateId) {
      setBanner({
        type: "error",
        message: "Missing candidateId. Go back to Ballot and select a candidate.",
      });
    }
  }, [auth.isReady, auth.isLoggedIn, candidateId]);

  const canProceed = useMemo(() => {
    return auth.isReady && auth.isLoggedIn && !!candidateId && !loading;
  }, [auth.isReady, auth.isLoggedIn, candidateId, loading]);

  async function issueToken() {
    setBanner(null);
    setLoading(true);

    try {
      const res = await apiPost(
        "/vote/issue-token",
        { electionId: ELECTION_ID },
        { token: auth.token }
      );

      const tokenId = res?.tokenId;
      const nonce = res?.nonce;
      const expiresAt = res?.expiresAt;

      if (!tokenId || !nonce) {
        setBanner({
          type: "error",
          message: "Token issued but response missing tokenId/nonce. Check backend response.",
        });
        return;
      }

      setTokenInfo({ tokenId, nonce, expiresAt });
      setStage("issued");
      toast.success("Token issued.");
    } catch (err) {
      const e2 = handleError(err);

      if (e2.code === "ALREADY_VOTED") {
        toast.info(friendlyError(e2.code, e2.message));
        router.push("/already-voted");
        return;
      }

      setBanner({ type: "error", message: friendlyError(e2.code, e2.message) });
      toast.error(friendlyError(e2.code, e2.message));
    } finally {
      setLoading(false);
    }
  }

  async function submitVote() {
    if (!tokenInfo?.tokenId || !tokenInfo?.nonce) {
      setBanner({ type: "error", message: "Missing voting token. Please issue token again." });
      return;
    }

    setBanner(null);
    setLoading(true);

    try {
      const payload = {
        tokenId: tokenInfo.tokenId,
        candidateId,
        electionId: ELECTION_ID,
        nonce: tokenInfo.nonce,
      };

      const res = await apiPost("/vote/submit", payload, { token: auth.token });

      if (res?.status === "accepted" || res?.status === "ok") {
        toast.success("Vote accepted.");
        router.push("/already-voted");
        return;
      }

      // treat no-error as success
      toast.success("Vote submitted.");
      router.push("/already-voted");
    } catch (err) {
      const e2 = handleError(err);

      if (e2.code === "ALREADY_VOTED" || e2.code === "TOKEN_ALREADY_USED") {
        toast.info(friendlyError(e2.code, e2.message));
        router.push("/already-voted");
        return;
      }

      if (e2.code === "TOKEN_EXPIRED") {
        toast.error(friendlyError(e2.code, e2.message));
        setBanner({ type: "error", message: friendlyError(e2.code, e2.message) });
        setTokenInfo(null);
        setStage("confirm");
        return;
      }

      toast.error(friendlyError(e2.code, e2.message));
      setBanner({ type: "error", message: friendlyError(e2.code, e2.message) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-2xl animate-fade-in-up">
        
        {/* Header Section */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-950">
            Secure Vote Submission
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Complete the secure handshake to finalize your choice.
          </p>
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] backdrop-blur-xl p-6 sm:p-10">
          
          {/* Subtle decorative gradient blob inside card */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative space-y-8">
            
            {/* Context Info Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="group rounded-2xl bg-slate-50/80 p-4 border border-slate-100 transition-all hover:border-emerald-200 hover:shadow-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Election ID
                </span>
                <span className="font-mono text-sm font-medium text-emerald-900 break-all">
                  {ELECTION_ID}
                </span>
              </div>

              <div className="group rounded-2xl bg-slate-50/80 p-4 border border-slate-100 transition-all hover:border-emerald-200 hover:shadow-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Candidate Selection
                </span>
                <span className="font-mono text-sm font-medium text-emerald-900 break-all">
                  {candidateId || "—"}
                </span>
              </div>
            </div>

            {/* Token Security Block */}
            {tokenInfo ? (
              <div className="overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/30">
                <div className="bg-emerald-100/50 px-4 py-2 flex items-center gap-2 border-b border-emerald-100">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase text-emerald-800 tracking-wide">
                    Security Token Generated
                  </span>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-500 font-medium">Token ID:</span>
                    <span className="font-mono text-slate-700 break-all">{tokenInfo.tokenId}</span>
                  </div>
                  <div className="h-px bg-emerald-100/50" />
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-slate-500 font-medium">Nonce:</span>
                    <span className="font-mono text-slate-700 break-all">{tokenInfo.nonce}</span>
                  </div>
                  {tokenInfo.expiresAt ? (
                    <>
                      <div className="h-px bg-emerald-100/50" />
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-500 font-medium">Expires:</span>
                        <span className="font-mono text-slate-700 break-all">
                          {String(tokenInfo.expiresAt)}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Error Banner */}
            {banner ? (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
                <svg className="w-5 h-5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm font-medium">{banner.message}</span>
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => router.push("/ballot")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
                disabled={loading}
              >
                Back to Ballot
              </button>

              {stage === "confirm" ? (
                <button
                  onClick={issueToken}
                  disabled={!canProceed}
                  className="group relative w-full sm:w-auto sm:ml-auto overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.01] focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? "Issuing..." : "Issue Security Token"}
                    {!loading && (
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </span>
                </button>
              ) : (
                <button
                  onClick={submitVote}
                  disabled={!canProceed}
                  className="group relative w-full sm:w-auto sm:ml-auto overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:scale-[1.01] focus:ring-4 focus:ring-blue-500/30 disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? "Submitting..." : "Confirm & Submit Vote"}
                    {!loading && (
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </button>
              )}
            </div>
            
            <p className="text-center text-xs text-slate-400 font-medium pt-2">
              Flow: Issue Token &rarr; Submit Vote. Secure & Verified.
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}