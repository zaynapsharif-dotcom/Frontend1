const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export class ApiError extends Error {
  constructor({ code, message, details, status }) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.code = code || "UNKNOWN_ERROR";
    this.details = details || {};
    this.status = status || 0;
  }
}

function joinUrl(base, path) {
  if (!path) return base;
  if (path.startsWith("http")) return path;
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
  return base + path;
}

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function apiRequest(path, opts = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
    signal,
    baseUrl = API_BASE,
  } = opts;

  const url = joinUrl(baseUrl, path);

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchOpts = {
    method,
    headers: finalHeaders,
    signal,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    fetchOpts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, fetchOpts);
  } catch (e) {
    // Network / CORS / server down
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "Network error. Check backend URL / CORS / connection.",
      details: { original: String(e?.message || e) },
      status: 0,
    });
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    // Backend standard error format: { code, message, details }
    if (data && typeof data === "object" && (data.code || data.message)) {
      throw new ApiError({
        code: data.code || "REQUEST_FAILED",
        message: data.message || "Request failed",
        details: data.details || {},
        status: res.status,
      });
    }

    throw new ApiError({
      code: "HTTP_ERROR",
      message: `Request failed with status ${res.status}`,
      details: { statusText: res.statusText, data },
      status: res.status,
    });
  }

  return data;
}

export async function apiGet(path, opts = {}) {
  return apiRequest(path, { ...opts, method: "GET" });
}

export async function apiPost(path, body, opts = {}) {
  return apiRequest(path, { ...opts, method: "POST", body });
}

// UI helper: always returns { code, message } you can show in banners/toasts
export function handleError(e) {
  if (e instanceof ApiError) {
    return { code: e.code, message: e.message, details: e.details, status: e.status };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: e?.message || "Something went wrong",
    details: {},
    status: 0,
  };
}

export function getApiBase() {
  return API_BASE;
}
