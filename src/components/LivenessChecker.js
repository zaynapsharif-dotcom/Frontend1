"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { earFromLandmarks, yawProxy, ema } from "../lib/geometry";

// UMD bundles (MediaPipe via CDN)
const FACE_MESH_UMD = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
const CAMERA_UTILS_UMD = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

// load <script> once
const scriptCache = new Map();
function loadScriptOnce(src, timeoutMs = 15000) {
  if (scriptCache.has(src)) return scriptCache.get(src);
  const p = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.async = true;
    el.src = src;
    const timer = setTimeout(() => {
      el.remove();
      reject(new Error(`Timeout loading ${src}`));
    }, timeoutMs);
    el.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    el.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

function StepPill({ active, done, children }) {
  return (
    <div
      className={[
        "px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
        done
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : active
            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
            : "bg-white text-slate-500 border-slate-200",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function PulseDot({ on }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span
        className={[
          "absolute inline-flex h-full w-full rounded-full opacity-75",
          on ? "animate-ping bg-emerald-400" : "bg-slate-300",
        ].join(" ")}
      />
      <span className={["relative inline-flex h-2.5 w-2.5 rounded-full", on ? "bg-emerald-500" : "bg-slate-300"].join(" ")} />
    </span>
  );
}

export default function LivenessChecker({
  earThreshold = 0.18,
  earCloseMinMs = 120,
  yawAbsThreshold = 0.55,
  yawHoldMinMs = 250,
  onChange,
}) {
  // DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Instances
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  // UI state
  const [isRunning, setIsRunning] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [blinkCount, setBlinkCount] = useState(0);
  const [turnedLeft, setTurnedLeft] = useState(false);
  const [turnedRight, setTurnedRight] = useState(false);
  const [livenessPassed, setLivenessPassed] = useState(false);

  // small metrics (kept for optional display)
  const [leftEAR, setLeftEAR] = useState(0);
  const [rightEAR, setRightEAR] = useState(0);
  const [yawDev, setYawDev] = useState(0);

  // internals
  const earLeftEMARef = useRef(null);
  const earRightEMARef = useRef(null);
  const eyesClosedSinceRef = useRef(null);
  const eyesWereClosedRef = useRef(false);
  const lastBlinkAtRef = useRef(0);

  const yawEMARef = useRef(null);
  const yawBeyondSinceRef = useRef(null);

  const blinkCountRef = useRef(0);

  const resetSession = useCallback(() => {
    setBlinkCount(0);
    blinkCountRef.current = 0;
    setTurnedLeft(false);
    setTurnedRight(false);
    setLivenessPassed(false);
    setPermissionError(null);

    setLeftEAR(0);
    setRightEAR(0);
    setYawDev(0);

    earLeftEMARef.current = null;
    earRightEMARef.current = null;
    eyesClosedSinceRef.current = null;
    eyesWereClosedRef.current = false;
    lastBlinkAtRef.current = 0;

    yawEMARef.current = null;
    yawBeyondSinceRef.current = null;
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    try {
      cameraRef.current?.stop();
    } catch { }
    cameraRef.current = null;

    try {
      faceMeshRef.current?.close();
    } catch { }
    faceMeshRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    blinkCountRef.current = blinkCount;
  }, [blinkCount]);

  // Notify parent (fresh values)
  useEffect(() => {
    if (typeof onChange === "function") {
      onChange({
        livenessPassed,
        blinkCount,
        turnedLeft,
        turnedRight,
        leftEAR,
        rightEAR,
        yawDev,
      });
    }
  }, [livenessPassed, blinkCount, turnedLeft, turnedRight, leftEAR, rightEAR, yawDev, onChange]);

  // Final guard
  useEffect(() => {
    if (!livenessPassed && turnedLeft && turnedRight && blinkCount >= 2) {
      setLivenessPassed(true);
    }
  }, [turnedLeft, turnedRight, blinkCount, livenessPassed]);

  // Step UX
  const currentStep = useMemo(() => {
    if (livenessPassed) return "pass";
    if (blinkCount < 2) return "blink";
    if (!turnedLeft) return "left";
    if (!turnedRight) return "right";
    return "pass";
  }, [blinkCount, turnedLeft, turnedRight, livenessPassed]);

  const stepKey = useMemo(() => {
    if (permissionError) return "error";
    if (livenessPassed) return "pass";
    return currentStep; // blink | left | right
  }, [permissionError, livenessPassed, currentStep]);


  const badgeTheme = useMemo(() => {
    if (permissionError) return { ring: "rgba(239,68,68,0.90)", bg: "rgba(239,68,68,0.18)" }; // red
    if (livenessPassed) return { ring: "rgba(16,185,129,0.95)", bg: "rgba(16,185,129,0.18)" }; // green

    // step colors
    if (currentStep === "blink") return { ring: "rgba(59,130,246,0.95)", bg: "rgba(59,130,246,0.16)" }; // blue
    if (currentStep === "left") return { ring: "rgba(245,158,11,0.95)", bg: "rgba(245,158,11,0.16)" }; // amber
    if (currentStep === "right") return { ring: "rgba(168,85,247,0.95)", bg: "rgba(168,85,247,0.16)" }; // purple

    return { ring: "rgba(255,255,255,0.85)", bg: "rgba(255,255,255,0.10)" };
  }, [permissionError, livenessPassed, currentStep]);


  const headline = useMemo(() => {
    if (permissionError) return "Camera access needed";
    if (!isRunning) return "Ready for a quick liveness check";
    if (livenessPassed) return "Verification passed";
    if (currentStep === "blink") return "Blink twice";
    if (currentStep === "left") return "Turn your head left";
    if (currentStep === "right") return "Turn your head right";
    return "Liveness check";
  }, [permissionError, isRunning, livenessPassed, currentStep]);

  const subline = useMemo(() => {
    if (permissionError) return "Allow camera permission and try again.";
    if (!isRunning) return "This takes a few seconds. No face data is stored.";
    if (livenessPassed) return "Redirecting you automatically…";
    if (currentStep === "blink") return "Look at the camera and blink normally.";
    if (currentStep === "left") return "Turn slowly until the step is marked done.";
    if (currentStep === "right") return "Turn slowly to the other side.";
    return "Follow the instructions on screen.";
  }, [permissionError, isRunning, livenessPassed, currentStep]);

  const onResults = useCallback(
    (results) => {
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = results.image.width;
        canvas.height = results.image.height;

        // draw camera frame
        // draw camera frame (cover fit into square canvas, centered — no stretching)
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const srcW = results.image.width;
        const srcH = results.image.height;
        const dstW = canvas.width;
        const dstH = canvas.height;

        // scale to cover destination
        const scale = Math.max(dstW / srcW, dstH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;

        // center crop
        const dx = (dstW - drawW) / 2;
        const dy = (dstH - drawH) / 2;

        ctx.drawImage(results.image, dx, dy, drawW, drawH);
        ctx.restore();


        const lm = results.multiFaceLandmarks?.[0];
        if (!lm) {
          eyesClosedSinceRef.current = null;
          yawBeyondSinceRef.current = null;
          setLeftEAR(0);
          setRightEAR(0);
          setYawDev(0);
          return;
        }

        // ---------- EAR (blink) with EMA + hysteresis + refractory ----------
        const left = earFromLandmarks(lm, 159, 145, 33, 133);
        const right = earFromLandmarks(lm, 386, 374, 263, 362);
        earLeftEMARef.current = ema(earLeftEMARef.current, left, 0.35);
        earRightEMARef.current = ema(earRightEMARef.current, right, 0.35);

        const lSm = earLeftEMARef.current ?? left;
        const rSm = earRightEMARef.current ?? right;
        const earAvg = (lSm + rSm) / 2;

        const closeTh = earThreshold;
        const openTh = earThreshold + 0.03;
        const now = performance.now();

        const eyesClosed = eyesWereClosedRef.current ? earAvg < openTh : earAvg < closeTh;

        let nextBlinkCount = blinkCount;

        if (eyesClosed) {
          if (!eyesWereClosedRef.current) {
            eyesWereClosedRef.current = true;
            eyesClosedSinceRef.current = now;
          }
        } else if (eyesWereClosedRef.current) {
          // closed -> open transition
          const closedMs = now - (eyesClosedSinceRef.current ?? now);
          eyesWereClosedRef.current = false;
          eyesClosedSinceRef.current = null;

          if (closedMs >= earCloseMinMs) {
            const refractoryMs = 250;
            if (now - lastBlinkAtRef.current >= refractoryMs) {
              const newCount = blinkCountRef.current + 1;
              setBlinkCount(newCount);
              blinkCountRef.current = newCount;
              nextBlinkCount = newCount;
              lastBlinkAtRef.current = now;
            }
          }
        }

        // ---------- Yaw (turn) with EMA + hold ----------
        const yawRaw = yawProxy(lm);
        yawEMARef.current = ema(yawEMARef.current, yawRaw, 0.25);
        const yawSm = yawEMARef.current ?? yawRaw;

        const beyond = Math.abs(yawSm) >= yawAbsThreshold;
        if (beyond) {
          if (!yawBeyondSinceRef.current) {
            yawBeyondSinceRef.current = now;
          } else {
            const held = now - yawBeyondSinceRef.current;
            if (held >= yawHoldMinMs) {
              const dir = yawSm > 0 ? "right" : "left";
              if (dir === "left") setTurnedLeft(true);
              if (dir === "right") setTurnedRight(true);

              const nextLeft = dir === "left" ? true : turnedLeft;
              const nextRight = dir === "right" ? true : turnedRight;

              if (!livenessPassed && nextLeft && nextRight && nextBlinkCount >= 2) {
                setLivenessPassed(true);
              }
            }
          }
        } else {
          yawBeyondSinceRef.current = null;
        }

        // Minimal overlay points (tiny, subtle)
        const pts = [1, 33, 133, 159, 145, 263, 362, 386, 374, 234, 454];
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.fillStyle = "rgba(16,185,129,0.95)";
        for (const i of pts) {
          const p = lm[i];
          if (!p) continue;
          ctx.beginPath();
          ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        setLeftEAR(Number(lSm.toFixed(3)));
        setRightEAR(Number(rSm.toFixed(3)));
        setYawDev(Number(yawSm.toFixed(3)));
      } catch {
        // swallow per-frame errors
      }
    },
    [blinkCount, turnedLeft, turnedRight, livenessPassed, earThreshold, earCloseMinMs, yawAbsThreshold, yawHoldMinMs]
  );

  const start = useCallback(async () => {
    resetSession();
    setIsRunning(true);

    try {
      if (!videoRef.current || !canvasRef.current) throw new Error("Video/Canvas refs not ready");

      await loadScriptOnce(FACE_MESH_UMD);
      await loadScriptOnce(CAMERA_UTILS_UMD);

      const FaceMeshGlobal = window.FaceMesh;
      const CameraGlobal = window.Camera;
      if (!FaceMeshGlobal) throw new Error("window.FaceMesh not found after loading UMD");
      if (!CameraGlobal) throw new Error("window.Camera not found after loading UMD");

      const fm = new FaceMeshGlobal({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      fm.onResults(onResults);
      faceMeshRef.current = fm;

      const cam = new CameraGlobal(videoRef.current, {
        onFrame: async () => {
          try {
            await fm.send({ image: videoRef.current });
          } catch { }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = cam;

      await cam.start();
    } catch (e) {
      const name = e?.name ?? "Error";
      const message = e?.message ?? "Unknown error";
      let hint = "";
      if (name === "NotAllowedError") hint = " (permission blocked)";
      else if (name === "NotFoundError") hint = " (no camera device)";
      else if (name === "NotReadableError") hint = " (camera busy by another app)";
      else if (name === "OverconstrainedError") hint = " (change default camera in browser settings)";
      setPermissionError(`${name}: ${message}${hint}`);
      setIsRunning(false);
    }
  }, [resetSession, onResults]);

  const handleRetry = useCallback(async () => {
    stop();
    await new Promise((r) => setTimeout(r, 80));
    start();
  }, [start, stop]);

  const badge = useMemo(() => {
    if (permissionError) return { text: "Camera error", cls: "bg-red-50 text-red-700 border-red-200" };
    if (livenessPassed) return { text: "PASS", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (!isRunning) return { text: "Ready", cls: "bg-slate-50 text-slate-700 border-slate-200" };
    return { text: "Checking", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }, [permissionError, livenessPassed, isRunning]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <PulseDot on={isRunning && !permissionError && !livenessPassed} />
              <h2 className="text-lg font-extrabold text-slate-900">{headline}</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">{subline}</p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <StepPill active={currentStep === "blink"} done={blinkCount >= 2}>
                Blink x2
              </StepPill>
              <StepPill active={currentStep === "left"} done={turnedLeft}>
                Turn Left
              </StepPill>
              <StepPill active={currentStep === "right"} done={turnedRight}>
                Turn Right
              </StepPill>
              <div className={`ml-1 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.cls}`}>{badge.text}</div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={start}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                Start
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Retry
                </button>
                <button
                  onClick={stop}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {permissionError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="font-bold">Camera permission problem</div>
            <div className="mt-1">{permissionError}</div>
            <div className="mt-2 text-xs text-red-700/90">
              Tip: Check browser site settings → allow camera, then click Retry.
            </div>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Camera */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto w-full max-w-md">
              {/* Circular frame */}
              <div className="relative aspect-square rounded-full overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <video ref={videoRef} muted playsInline style={{ display: "none" }} />

                {/* Canvas fills circle */}
                <canvas ref={canvasRef} className="h-full w-full object-cover" />

                {/* Soft gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                {/* Instruction overlay */}
                {/* Instruction overlay (FaceID-style badge) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    {/* Circular badge */}
                    <div
                      className="relative h-16 w-16 rounded-full backdrop-blur-sm border border-white/15 shadow-md"
                      style={{
                        background: `radial-gradient(circle at 50% 35%, ${badgeTheme.bg}, rgba(0,0,0,0.45) 62%)`,
                      }}
                    >
                      <style>{`
  @keyframes evote-scan {
    0% { transform: translateY(-140%); opacity: 0; }
    15% { opacity: 0.9; }
    50% { opacity: 0.65; }
    85% { opacity: 0.9; }
    100% { transform: translateY(140%); opacity: 0; }
  }
  @keyframes evote-glow {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.65; }
  }
    @keyframes evote-in {
  from { opacity: 0; transform: translateY(4px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0px) scale(1); }
}

`}</style>

                      {/* Progress ring (3 segments) */}
                      <svg className="absolute inset-0" viewBox="0 0 64 64" aria-hidden="true">
                        {/* base ring */}
                        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
                        {/* progress ring */}
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke={badgeTheme.ring}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26}`}
                          strokeDashoffset={`${(1 -
                            Math.min(
                              1,
                              ((Math.min(2, blinkCount) >= 2 ? 1 : Math.min(2, blinkCount) / 2) + (turnedLeft ? 1 : 0) + (turnedRight ? 1 : 0)) /
                              3
                            )) *
                            (2 * Math.PI * 26)
                            }`}
                          style={{ transition: "stroke-dashoffset 500ms ease" }}
                        />
                      </svg>
                      {/* Apple-like scan effect (only while running and not passed) */}
                      {isRunning && !livenessPassed && !permissionError ? (
                        <div className="absolute inset-1 rounded-full overflow-hidden">
                          {/* faint inner glow */}
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)",
                              animation: "evote-glow 1.6s ease-in-out infinite",
                            }}
                          />
                          {/* scanning line */}
                          <div
                            className="absolute left-0 right-0 h-6"
                            style={{
                              top: "50%",
                              transform: "translateY(-140%)",
                              background:
                                `linear-gradient(to bottom, rgba(255,255,255,0), ${badgeTheme.ring.replace("0.95", "0.20")}, rgba(255,255,255,0))`, filter: "blur(0.2px)",
                              animation: "evote-scan 1.35s ease-in-out infinite",
                            }}
                          />
                        </div>
                      ) : null}

                      {/* Success glow */}
                      {livenessPassed ? (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            boxShadow: "0 0 0 2px rgba(16,185,129,0.30), 0 0 22px rgba(16,185,129,0.35)",
                          }}
                        />
                      ) : null}


                      {/* Center icon / state */}
                      {/* Center icon / state (animated on step change) */}
                      <div className="absolute inset-0 grid place-items-center">
                        <div
                          key={`center-${stepKey}`}
                          className="will-change-transform transition-all duration-300 ease-out
               opacity-0 translate-y-1 scale-95 animate-[evote-in_300ms_ease-out_forwards]"
                        >
                          {livenessPassed ? (
                            <div className="text-white text-lg">✓</div>
                          ) : permissionError ? (
                            <div className="text-white/90 text-[10px] font-extrabold tracking-wider">NO CAM</div>
                          ) : (
                            <div className="text-white/90 text-[10px] font-extrabold tracking-wider">
                              {currentStep === "blink" ? "BLINK" : currentStep === "left" ? "LEFT" : "RIGHT"}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Small label text */}
                    <div className="rounded-full bg-black/35 backdrop-blur-sm border border-white/10 px-3 py-1 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "h-2 w-2 rounded-full",
                            livenessPassed ? "bg-emerald-400" : "bg-amber-400 animate-pulse",
                          ].join(" ")}
                        />
                        <div
                          key={`label-${stepKey}`}
                          className="text-[11px] font-bold text-white opacity-0 -translate-y-0.5
             animate-[evote-in_280ms_ease-out_forwards]"
                        >
                          {livenessPassed
                            ? "Done"
                            : permissionError
                              ? "Camera blocked"
                              : currentStep === "blink"
                                ? "Blink twice"
                                : currentStep === "left"
                                  ? "Turn left"
                                  : "Turn right"}
                        </div>

                        <div className="text-[10px] font-mono text-white/70">
                          {Math.min(2, blinkCount)}/2 · L:{String(turnedLeft)} · R:{String(turnedRight)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              {/* Privacy line */}
              <div className="mt-3 text-center text-xs text-slate-500">
                Privacy: processing is local in your browser. <span className="font-semibold">No face data is stored.</span>
              </div>
            </div>
          </div>

          {/* Side card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-900">Status</div>
                <div className="text-xs text-slate-500">Live</div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-bold text-slate-800">Blinks</div>
                  <div className="font-mono text-sm text-slate-700">{blinkCount} / 2</div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-bold text-slate-800">Turn Left</div>
                  <div className={["text-sm font-mono", turnedLeft ? "text-emerald-700" : "text-slate-500"].join(" ")}>
                    {String(turnedLeft)}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-sm font-bold text-slate-800">Turn Right</div>
                  <div className={["text-sm font-mono", turnedRight ? "text-emerald-700" : "text-slate-500"].join(" ")}>
                    {String(turnedRight)}
                  </div>
                </div>
              </div>

              {/* Optional tiny metrics */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>EAR (L/R)</span>
                  <span className="font-mono text-slate-600">
                    {leftEAR} / {rightEAR}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
                  <span>Yaw</span>
                  <span className="font-mono text-slate-600">{yawDev}</span>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Tip: keep your face centered and move slowly. If lighting is low, increase brightness.
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-extrabold text-slate-900">What we check</div>
              <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc pl-5">
                <li>Blink twice (live response)</li>
                <li>Turn head left and right (3D movement)</li>
                <li>No identity/face recognition, no storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
