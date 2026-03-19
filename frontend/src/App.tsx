import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import LoginPage from './pages/LoginPage';
import LearnerPage from './pages/LearnerPage';
import FacilitatorPage from './pages/FacilitatorPage';
import type { UserProfile } from './types';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Loading...</p>
    </div>
  );

  if (!session) return <LoginPage />;
  if (!profile) return null;
  if (profile?.role === 'facilitator') return <FacilitatorPage />;
  return <LearnerPage />;
}