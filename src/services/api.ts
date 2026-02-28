// src/services/api.ts
//
// Two base URLs:
//   VITE_API_URL          → motofix-mechanics-service  (auth, profile, availability, location)
//   VITE_REQUESTS_URL     → motofix-service-requests   (jobs, accept, status, call-partner)

const MECHANICS_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const REQUESTS_BASE =
  import.meta.env.VITE_REQUESTS_URL || "http://localhost:8001";

// ─── Auth token helpers ───────────────────────────────────────────────────────

let _token: string | null = localStorage.getItem("motofix_token");
let _mechanicId: number | null = Number(localStorage.getItem("motofix_id")) || null;

export function setToken(token: string, mechanicId: number) {
  _token = token;
  _mechanicId = mechanicId;
  localStorage.setItem("motofix_token", token);
  localStorage.setItem("motofix_id", String(mechanicId));
}

export function clearToken() {
  _token = null;
  _mechanicId = null;
  localStorage.removeItem("motofix_token");
  localStorage.removeItem("motofix_id");
}

export function logout() {
  clearToken();
}

export function getToken() {
  return _token;
}

export function getStoredMechanicId() {
  return _mechanicId;
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...((_token ? { Authorization: `Bearer ${_token}` } : {}) as HeadersInit),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }
  return res.json();
}

// ─── Auth endpoints  (→ motofix-mechanics-service) ───────────────────────────

export interface LoginResponse {
  token: string;
  mechanic_id: number;
  name: string;
  phone: string;
}

export async function login(
  phone: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${MECHANICS_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await handleResponse<LoginResponse>(res);
  setToken(data.token, data.mechanic_id);
  return data;
}

export async function register(params: {
  name: string;
  phone: string;
  password: string;
  location?: string;
  specialty?: string;
  vehicle_type?: string;
}): Promise<LoginResponse> {
  const res = await fetch(`${MECHANICS_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await handleResponse<LoginResponse>(res);
  setToken(data.token, data.mechanic_id);
  return data;
}

export async function getMechanicProfile() {
  const res = await fetch(`${MECHANICS_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse<Record<string, unknown>>(res);
}

// ─── Mechanic self-management  (→ motofix-mechanics-service) ─────────────────

export async function updateAvailability(isAvailable: boolean) {
  const res = await fetch(`${MECHANICS_BASE}/mechanics/me/availability`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ is_available: isAvailable }),
  });
  return handleResponse<{ id: number; is_available: boolean }>(res);
}

export async function updateLocation(
  latitude: number,
  longitude: number,
  location?: string
) {
  const res = await fetch(`${MECHANICS_BASE}/mechanics/me/location`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ latitude, longitude, ...(location ? { location } : {}) }),
  });
  return handleResponse<Record<string, unknown>>(res);
}

export async function getCurrentJob() {
  const res = await fetch(`${MECHANICS_BASE}/mechanics/me/current-job`, {
    headers: authHeaders(),
  });
  return handleResponse<{ job: Record<string, unknown> | null }>(res);
}

// ─── Job endpoints  (→ motofix-service-requests) ─────────────────────────────

export async function acceptJob(
  requestId: string | number,
  mechanicId: number,
  mechanicName: string,
  etaMinutes = 15
) {
  const res = await fetch(`${REQUESTS_BASE}/requests/${requestId}/accept`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
      mechanic_id: mechanicId,
      mechanic_name: mechanicName,
      eta_minutes: etaMinutes,
    }),
  });
  return handleResponse<Record<string, unknown>>(res);
}

export async function rejectJob(_requestId: string | number) {
  // The service-requests backend has no explicit reject endpoint.
  // Rejecting simply means the mechanic does nothing — the job stays pending
  // for another mechanic. We resolve immediately so the UI can clear the alert.
  return Promise.resolve({ status: "rejected" });
}

export async function updateJobStatus(
  requestId: string | number,
  status: "en_route" | "completed" | "cancelled"
) {
  const res = await fetch(
    `${REQUESTS_BASE}/requests/${requestId}/status?status=${status}`,
    {
      method: "PATCH",
      headers: authHeaders(),
    }
  );
  return handleResponse<{ detail: string; new_status: string }>(res);
}

export async function getCallPartnerPhone(requestId: string | number) {
  const res = await fetch(
    `${REQUESTS_BASE}/requests/${requestId}/call-partner`,
    { headers: authHeaders() }
  );
  return handleResponse<{ phone: string }>(res);
}
