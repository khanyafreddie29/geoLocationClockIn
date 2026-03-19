import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { getVenues, clockIn, getMyClockIns } from '../api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { Venue, ClockIn } from '../types';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function LearnerPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ClockIn[]>([]);
  const { coords, error: geoError, loading: geoLoading, getPosition } = useGeolocation();

  const initPage = useCallback(() => {
    getVenues().then(setVenues);
    getMyClockIns().then(setHistory);
    getPosition();
  }, [getPosition]);

  useEffect(() => {
    initPage();
  }, [initPage]);

  const handleClockIn = async () => {
    if (!selectedVenue) {
      setStatus({ type: 'error', message: 'Please select a venue' });
      return;
    }
    if (!coords) {
      setStatus({ type: 'error', message: 'Location not available. Please allow location access.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await clockIn(selectedVenue, coords.latitude, coords.longitude);
      setStatus({ type: 'success', message: '✅ Clocked in successfully!' });
      // Refresh history after successful clock-in
      getMyClockIns().then(setHistory);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const message = apiErr.response?.data?.error || 'Failed to clock in';
      setStatus({ type: 'error', message: `❌ ${message}` });
    }

    setLoading(false);
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Clock In</h1>
          <button style={styles.signOut} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>

        <label style={styles.label}>Select Venue</label>
        <select style={styles.select} value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}>
          <option value="">-- Choose a venue --</option>
          {venues.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>

        <div style={styles.locationBox}>
          {geoLoading && <p style={styles.muted}>Getting your location...</p>}
          {geoError && <p style={styles.error}>⚠️ {geoError}</p>}
          {coords && (
            <p style={styles.muted}>
              📍 Location detected: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
            </p>
          )}
        </div>

        {status && (
          <div style={{ ...styles.statusBox, backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2' }}>
            <p style={{ ...styles.statusText, color: status.type === 'success' ? '#166534' : '#991b1b' }}>
              {status.message}
            </p>
          </div>
        )}

        <button style={styles.button} onClick={handleClockIn} disabled={loading || geoLoading}>
          {loading ? 'Clocking in...' : 'Clock In'}
        </button>

        {/* Clock-in history */}
        <div style={styles.historySection}>
          <h2 style={styles.historyTitle}>Learner Attendance History</h2>
          {history.length === 0 && (
            <p style={styles.muted}>No clock-ins recorded yet.</p>
          )}
          {history.map(c => (
            <div key={c.id} style={styles.historyItem}>
              <span style={styles.historyVenue}>{c.venues?.name}</span>
              <span style={styles.historyTime}>{formatDateTime(c.clocked_in_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', padding: '2rem 0' },
  card: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { margin: 0, fontSize: '1.8rem', fontWeight: 700 },
  signOut: { background: 'none', border: '2px solid #ddd', borderRadius: '5px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#666' },
  label: { display: 'block', marginBottom: '0.5rem', fontWeight: 600 },
  select: { width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' },
  locationBox: { marginBottom: '1rem', minHeight: '1.5rem' },
  muted: { margin: 0, color: '#666', fontSize: '0.9rem' },
  error: { margin: 0, color: '#dc2626', fontSize: '0.7rem' },
  statusBox: { padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1rem' },
  statusText: { margin: 0, fontWeight: 500 },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer' },
  historySection: { marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' },
  historyTitle: { margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600, color: '#374151' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f3f4f6' },
  historyVenue: { fontWeight: 500, color: '#374151' },
  historyTime: { fontSize: '0.85rem', color: '#6b7280' },
};