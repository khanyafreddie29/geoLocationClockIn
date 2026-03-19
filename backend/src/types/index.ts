// this defines the database schema
// connected to supabase database
export interface Venue {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius_m: number;
}

export interface Profile {
    id: string;
    full_name: string;
    role: 'learner' | 'facilitator';
}

export interface ClockIn {
    id: string;
    learner_id: string;
    venue_id: string;
    clocked_in_at: string;
    latitude: number;
    longitude: number;
}

export interface ClockInRequest{
    venue_id: string;
    latitude: number;
    longitude: number;
}