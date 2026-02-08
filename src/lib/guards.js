"use client";

export function requireVoter(auth, router) {
  if (!auth?.isReady) return false;
  if (!auth?.isLoggedIn) {
    router.replace("/login");
    return false;
  }

  // Optional: if your backend uses status like "active"
  // If status exists and isn't active, block voting pages
  const status = (auth?.voter?.status || "").toLowerCase();
  if (status && status !== "active") {
    router.replace("/profile");
    return false;
  }

  return true;
}

export function requireAdmin(admin, router) {
  if (!admin?.isReady) return false;
  if (!admin?.isLoggedIn) {
    router.replace("/admin/login");
    return false;
  }
  return true;
}
