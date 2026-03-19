export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_m: number;
}

export interface ClockIn {
  id: string;
  learner_id: string;
  clocked_in_at: string;
  latitude: number;
  longitude: number;
  profiles: { full_name: string };
  venues: { name: string };
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'learner' | 'facilitator';
}