"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LivenessChecker from "../../components/LivenessChecker";

const TTL_MS = 90 * 1000;
const BASE_KEY = "evote_liveness_pass";

function safeNextPath(nextParam) {
  // Only allow internal paths to prevent open redirects
  if (!nextParam) return "/login";
  if (nextParam.startsWith("/") && !nextParam.startsWith("//")) return nextParam;
  return "/login";
}


export default function LivenessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scope = useMemo(() => {
    return searchParams?.get("scope") || "";
  }, [searchParams]);

  const storageKey = useMemo(() => {
    return scope ? `${BASE_KEY}:${scope}` : BASE_KEY;
  }, [scope]);


  const nextPath = useMemo(() => {
    const nextParam = searchParams?.get("next") || "";
    return safeNextPath(nextParam);
  }, [searchParams]);

  const [passed, setPassed] = useState(false);

  // If already passed very recently, jump straight to next
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.exp && Date.now() < data.exp) {
        router.replace(nextPath);
      }
    } catch { }
  }, [router, nextPath]);

  useEffect(() => {
    if (!passed) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          ok: true,
          exp: Date.now() + TTL_MS,
        })
      );
    } catch { }

    router.replace(nextPath);
  }, [passed, router, nextPath]);

  return (
    <div className="min-h-screen px-4 py-10 bg-slate-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Liveness Verification</h1>
          <p className="mt-2 text-sm text-slate-600">
            This is required before Register/Login. We only check <b>blink</b> + <b>head turn</b>.
            No face data is stored.
          </p>
          <div className="mt-3 text-xs text-slate-500">
            After you pass, you’ll be redirected to:{" "}
            <span className="font-mono text-slate-700">{nextPath}</span>
          </div>
        </div>

        <LivenessChecker
          onChange={(s) => {
            if (s?.livenessPassed) setPassed(true);
          }}
        />

        <div className="mt-6 flex gap-2 flex-wrap">
          <button
            onClick={() => router.replace(nextPath)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Back
          </button>

          <button
            onClick={() => router.replace("/")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
