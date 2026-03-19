import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Automatically attach the user's JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const getVenues = () =>
  api.get('/api/venues').then(r => r.data);
// this is used to get the venues from supabase for when the user logs in and sees the venues in selection box

export const clockIn = (venue_id: string, latitude: number, longitude: number) =>
  api.post('/api/clock-ins', { venue_id, latitude, longitude }).then(r => r.data);
// api used for when learner clocks in for that venue for that day.

export const getTodaysClockIns = () =>
  api.get('/api/clock-ins').then(r => r.data);
// facilitator gets the log in of current day

export const getMyClockIns = () =>
  api.get('/api/clock-ins/me').then(r => r.data);
// api used in frontend to display the learner's clock in history