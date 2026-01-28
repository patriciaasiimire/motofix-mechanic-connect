// Mechanic data model - matches backend schema
export interface Mechanic {
  id: number;
  name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  specialty: string;
  rating: number;
  total_ratings: number;
  is_available: boolean;
  vehicle_type: string;
}

// Job data model
export type JobStatus = 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'completed' | 'rejected';

export interface Job {
  id: number;
  vehicle_type: string;
  problem_description: string;
  customer_location: string;
  customer_latitude: number | null;
  customer_longitude: number | null;
  status: JobStatus;
  created_at: string;
}

// Auth types
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  mechanic: Mechanic;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
