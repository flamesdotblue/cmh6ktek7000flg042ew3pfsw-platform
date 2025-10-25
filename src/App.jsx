import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import SessionControls from './components/SessionControls';
import StudentCheckIn from './components/StudentCheckIn';
import Dashboard from './components/Dashboard';

const initialRoster = [
  { id: 'S001', name: 'Ava Johnson' },
  { id: 'S002', name: 'Liam Smith' },
  { id: 'S003', name: 'Noah Williams' },
  { id: 'S004', name: 'Emma Brown' },
  { id: 'S005', name: 'Olivia Jones' },
];

export default function App() {
  const [roster, setRoster] = useState(initialRoster);
  const [records, setRecords] = useState(() =>
    initialRoster.map((s) => ({
      id: s.id,
      name: s.name,
      status: 'absent',
      method: null,
      checkInTime: null,
      duplicate: false,
    }))
  );
  const [session, setSession] = useState({
    id: null,
    active: false,
    startTime: null,
    pin: null,
  });

  // Derived counts
  const stats = useMemo(() => {
    const present = records.filter((r) => r.status !== 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const absent = records.length - present;
    return { present, late, absent };
  }, [records]);

  // Attendance analytics by percentage
  const attendancePct = useMemo(() => {
    const total = records.length || 1;
    return Math.round((stats.present / total) * 100);
  }, [records, stats.present]);

  const startSession = () => {
    const id = `SES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setSession({ id, active: true, startTime: Date.now(), pin });
    // reset records for new session
    setRecords(
      roster.map((s) => ({
        id: s.id,
        name: s.name,
        status: 'absent',
        method: null,
        checkInTime: null,
        duplicate: false,
      }))
    );
  };

  const stopSession = () => {
    setSession((prev) => ({ ...prev, active: false }));
  };

  const handleCheckIn = ({ studentId, method }) => {
    if (!session.active) return { ok: false, message: 'No active session' };
    const idx = records.findIndex((r) => r.id === studentId);
    if (idx === -1) return { ok: false, message: 'Student not found' };
    const now = Date.now();
    const lateThresholdMs = 10 * 60 * 1000; // 10 minutes
    const isLate = now - session.startTime > lateThresholdMs;

    let duplicate = false;
    if (records[idx].status !== 'absent') {
      duplicate = true;
    }
    const updated = [...records];
    updated[idx] = {
      ...updated[idx],
      status: isLate ? 'late' : 'present',
      method,
      checkInTime: now,
      duplicate,
    };
    setRecords(updated);
    return { ok: true, message: duplicate ? 'Duplicate check-in' : 'Checked in' };
  };

  const exportCSV = () => {
    const headers = ['Student ID', 'Name', 'Status', 'Method', 'Check-In Time'];
    const rows = records.map((r) => [
      r.id,
      r.name,
      r.status,
      r.method || '',
      r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.id || 'attendance'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCSVToClipboard = async () => {
    const headers = ['Student ID', 'Name', 'Status', 'Method', 'Check-In Time'];
    const rows = records.map((r) => [
      r.id,
      r.name,
      r.status,
      r.method || '',
      r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.join('\t'))
      .join('\n');
    await navigator.clipboard.writeText(csv);
    alert('CSV copied to clipboard. Paste into Google Sheets.');
  };

  // Maintain faces per student in localStorage
  const saveFaceTemplate = (studentId, dataUrl) => {
    const key = 'faces.v1';
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[studentId] = dataUrl;
    localStorage.setItem(key, JSON.stringify(all));
  };

  const loadFaceTemplate = (studentId) => {
    const key = 'faces.v1';
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return all[studentId] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <SessionControls
            session={session}
            stats={stats}
            onStart={startSession}
            onStop={stopSession}
            onExportCSV={exportCSV}
            onCopyCSV={copyCSVToClipboard}
          />

          <StudentCheckIn
            session={session}
            roster={roster}
            onCheckIn={handleCheckIn}
            saveFaceTemplate={saveFaceTemplate}
            loadFaceTemplate={loadFaceTemplate}
          />
        </div>

        <div className="lg:col-span-2">
          <Dashboard session={session} records={records} stats={stats} attendancePct={attendancePct} />
        </div>
      </main>
      <footer className="text-center text-zinc-400 text-xs py-6">
        Designed for sleek, mobile-friendly attendance with privacy-first options.
      </footer>
    </div>
  );
}
