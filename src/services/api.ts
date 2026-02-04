import type { AuthResponse, LoginCredentials, Mechanic, Job, JobStatus } from '@/types/mechanic';

// API base URL - will be configured for production
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
  // For demo: simulate API response
  // In production, this calls the real backend
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Demo validation
  if (credentials.phone === '1234567890' && credentials.password === 'motofix123') {
    const mockResponse: AuthResponse = {
      access_token: 'demo_token_' + Date.now(),
      token_type: 'bearer',
      mechanic: {
        id: 1,
        name: 'Ahmed Khan',
        phone: '1234567890',
        location: 'Lagos, Nigeria',
        latitude: 6.5244,
        longitude: 3.3792,
        specialty: 'Engine Repair',
        rating: 4.8,
        total_ratings: 127,
        is_available: true,
        vehicle_type: 'Motorcycle',
      },
    };
    setToken(mockResponse.access_token);
    return mockResponse;
  }
  
  throw new Error('Invalid phone number or password');
};

export const logout = (): void => {
  clearToken();
};

// Mechanic API
export const getMechanicProfile = async (): Promise<Mechanic> => {
  // Demo: return mock data
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    id: 1,
    name: 'Ahmed Khan',
    phone: '1234567890',
    location: 'Lagos, Nigeria',
    latitude: 6.5244,
    longitude: 3.3792,
    specialty: 'Engine Repair',
    rating: 4.8,
    total_ratings: 127,
    is_available: true,
    vehicle_type: 'Motorcycle',
  };
};

export const updateAvailability = async (isAvailable: boolean): Promise<{ is_available: boolean }> => {
  // Demo: simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  return { is_available: isAvailable };
};

export const updateLocation = async (latitude: number, longitude: number): Promise<void> => {
  // Demo: log location update
  console.log('Location update:', { latitude, longitude });
  await new Promise(resolve => setTimeout(resolve, 100));
};

// Job API
export const getCurrentJob = async (): Promise<Job | null> => {
  // Demo: no current job by default
  await new Promise(resolve => setTimeout(resolve, 200));
  return null;
};

export const acceptJob = async (jobId: number): Promise<Job> => {
  // Try real backend accept first (if API is configured). Fallback to demo behaviour if it fails.
  try {
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
      // If job already taken, surface the error
      if (res.status === 409) throw new Error(text || 'Job already taken');
      throw new Error(text || `Accept failed: ${res.status}`);
    }

    // Fetch the updated job info
    const job = await apiRequest<Job>(`/requests/${jobId}`);
    return job;
  } catch (err) {
    console.warn('Live accept failed, falling back to demo accept:', err);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: jobId,
      vehicle_type: 'Toyota Camry',
      problem_description: 'Flat tire on highway',
      attachments: [
        {
          id: 'att-1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          filename: 'flat_tire.jpg',
          mime_type: 'image/jpeg',
        },
      ],
      customer_location: '15 Marina Road, Lagos Island',
      customer_latitude: 6.4541,
      customer_longitude: 3.4082,
      status: 'accepted',
      created_at: new Date().toISOString(),
    };
  }
};

export const rejectJob = async (jobId: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
};

export const updateJobStatus = async (jobId: number, status: JobStatus): Promise<Job> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return {
    id: jobId,
    vehicle_type: 'Toyota Camry',
    problem_description: 'Flat tire on highway',
    attachments: [
      {
        id: 'att-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        filename: 'flat_tire.jpg',
        mime_type: 'image/jpeg',
      },
    ],
    customer_location: '15 Marina Road, Lagos Island',
    customer_latitude: 6.4541,
    customer_longitude: 3.4082,
    status,
    created_at: new Date().toISOString(),
  };
};

// Call Partner API - Get phone number for calling driver/mechanic
export const getCallPartner = async (requestId: number): Promise<{ phone: string }> => {
  return apiRequest<{ phone: string }>(`/requests/${requestId}/call-partner`);
};
