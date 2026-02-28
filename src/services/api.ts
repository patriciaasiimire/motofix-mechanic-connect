import type { AuthResponse, LoginCredentials, Mechanic, Job, JobStatus } from '@/types/mechanic';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_KEY = 'motofix_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// HTTP client with auth
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setToken(response.access_token);
  return response;
};

export const logout = (): void => {
  clearToken();
};

// Mechanic API
export const getMechanicProfile = async (): Promise<Mechanic> => {
  return apiRequest<Mechanic>('/auth/me');
};

export const updateAvailability = async (isAvailable: boolean): Promise<{ is_available: boolean }> => {
  return apiRequest<{ is_available: boolean }>('/mechanics/me/availability', {
    method: 'PATCH',
    body: JSON.stringify({ is_available: isAvailable }),
  });
};

export const updateLocation = async (latitude: number, longitude: number): Promise<void> => {
  await apiRequest<void>('/mechanics/me/location', {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
};

// Job API
export const getCurrentJob = async (): Promise<Job | null> => {
  return apiRequest<Job | null>('/mechanics/me/current-job');
};

export const acceptJob = async (jobId: number): Promise<Job> => {
  const mechanic = await getMechanicProfile();
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/requests/${jobId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mechanic_id: mechanic.id, mechanic_name: mechanic.name, eta_minutes: 10 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'error');
    if (res.status === 409) throw new Error(text || 'Job already taken');
    throw new Error(text || `Accept failed: ${res.status}`);
  }

  return apiRequest<Job>(`/requests/${jobId}`);
};

export const rejectJob = async (jobId: number): Promise<void> => {
  await apiRequest<void>(`/requests/${jobId}/reject`, { method: 'PATCH' });
};

export const updateJobStatus = async (jobId: number, status: JobStatus): Promise<Job> => {
  return apiRequest<Job>(`/requests/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// Call Partner API
export const getCallPartner = async (requestId: number): Promise<{ phone: string }> => {
  return apiRequest<{ phone: string }>(`/requests/${requestId}/call-partner`);
};
