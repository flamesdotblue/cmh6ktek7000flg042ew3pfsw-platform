import { useMemo } from 'react';
import { Play, Square, QrCode, Download, ClipboardCopy } from 'lucide-react';

export default function SessionControls({ session, stats, onStart, onStop, onExportCSV, onCopyCSV }) {
  const qrData = useMemo(() => {
    if (!session?.id || !session?.pin) return '';
    return JSON.stringify({ sessionId: session.id, pin: session.pin });
  }, [session]);

  const qrUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`
    : '';

  return (
    <section className="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black/60 p-4 sm:p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Session Controls</h2>
        <div className="text-xs text-zinc-400">{session.active ? 'Live' : 'Idle'}</div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {!session.active ? (
          <button onClick={onStart} className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-black font-semibold py-2.5 hover:brightness-110 transition">
            <div className="flex items-center justify-center gap-2"><Play className="h-4 w-4"/>Start Session</div>
          </button>
        ) : (
          <button onClick={onStop} className="flex-1 rounded-lg bg-white/10 text-white font-semibold py-2.5 hover:bg-white/20 transition border border-white/10">
            <div className="flex items-center justify-center gap-2"><Square className="h-4 w-4"/>Stop Session</div>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="Present" value={stats.present} tone="from-green-500/20 to-green-500/5"/>
        <StatCard label="Absent" value={stats.absent} tone="from-zinc-500/20 to-zinc-500/5"/>
        <StatCard label="Late" value={stats.late} tone="from-amber-500/20 to-amber-500/5"/>
      </div>

      <div className="rounded-lg border border-white/10 p-3 bg-black/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-zinc-300"><QrCode className="h-4 w-4"/> QR Backup</div>
          <div className="text-xs text-zinc-400">PIN: <span className="font-semibold text-orange-400">{session.pin || '—'}</span></div>
        </div>
        {session.active ? (
          <div className="flex items-center gap-3">
            <img src={qrUrl} alt="Session QR" className="h-36 w-36 rounded-md border border-white/10"/>
            <div className="text-xs text-zinc-400 break-all select-all flex-1">{qrData}</div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Start a session to generate QR and PIN.</div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button onClick={onExportCSV} className="flex-1 rounded-lg bg-white/10 text-white py-2 hover:bg-white/20 border border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm"><Download className="h-4 w-4"/>Export CSV</div>
        </button>
        <button onClick={onCopyCSV} className="flex-1 rounded-lg bg-white/10 text-white py-2 hover:bg-white/20 border border-white/10">
          <div className="flex items-center justify-center gap-2 text-sm"><ClipboardCopy className="h-4 w-4"/>Copy for Sheets</div>
        </button>
      </div>
    </section>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-lg p-3 bg-gradient-to-b ${tone} border border-white/10 text-center`}>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
