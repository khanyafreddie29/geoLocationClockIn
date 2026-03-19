import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { getTodaysClockIns } from '../api';
import type { ClockIn } from '../types';

export default function FacilitatorPage() {
  const [clockIns, setClockIns] = useState<ClockIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClockIns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTodaysClockIns();
      setClockIns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getTodaysClockIns()
      .then(data => { if (!cancelled) setClockIns(data); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Facilitator Dashboard</h1>
            <p style={styles.subtitle}>Today's clock-ins — {new Date().toLocaleDateString('en-ZA')}</p>
          </div>
          <button style={styles.signOut} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>

        {loading && <p style={styles.muted}>Loading...</p>}

        {!loading && clockIns.length === 0 && (
          <p style={styles.muted}>No clock-ins yet today.</p>
        )}

        {!loading && clockIns.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Venue</th>
                <th style={styles.th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {clockIns.map(c => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>{c.profiles?.full_name}</td>
                  <td style={styles.td}>{c.venues?.name}</td>
                  <td style={styles.td}>{formatTime(c.clocked_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button style={styles.refresh} onClick={fetchClockIns}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '2rem' },
  card: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '700px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  title: { margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 700 },
  subtitle: { margin: 0, color: '#666' },
  signOut: { background: 'none', border: '1px solid #ddd', borderRadius: '5px', padding: '0.4rem 0.8rem', cursor: 'pointer', color: '#666' },
  muted: { color: '#666', textAlign: 'center', padding: '2rem 0' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' },
  th: { textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #e5e7eb', fontWeight: 600, color: '#374151' },
  td: { padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#374151' },
  tr: { transition: 'background 0.15s' },
  refresh: { background: 'none', border: '2px solid #ddd', borderRadius: '5px', padding: '0.5rem 1rem', cursor: 'pointer', color: '#2563eb' },
};