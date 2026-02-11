"use client";

const BASE_KEY = "evote_liveness_pass";

function keyForScope(scope) {
  return scope ? `${BASE_KEY}:${scope}` : BASE_KEY;
}

export function hasValidLiveness(scope) {
  try {
    const raw = sessionStorage.getItem(keyForScope(scope));
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data?.exp) return false;
    return Date.now() < data.exp;
  } catch {
    return false;
  }
}

export function buildLivenessUrl(nextPath, scope) {
  const safeNext = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/login";
  const s = scope ? `&scope=${encodeURIComponent(scope)}` : "";
  return `/liveness?next=${encodeURIComponent(safeNext)}${s}`;
}

export function enforceLiveness(router, nextPath, scope) {
  if (hasValidLiveness(scope)) return true;
  try {
    router.replace(buildLivenessUrl(nextPath, scope));
  } catch {}
  return false;
}

export function clearLiveness(scope) {
  try {
    sessionStorage.removeItem(keyForScope(scope));
  } catch {}
}
