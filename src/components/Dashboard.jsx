import { useMemo } from 'react';
import { Users, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Dashboard({ session, records, stats, attendancePct }) {
  const sorted = useMemo(() => {
    return [...records].sort((a, b) => (a.name > b.name ? 1 : -1));
  }, [records]);

  return (
    <section className="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black/60 p-4 sm:p-6 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Real-Time Dashboard</h2>
        <div className="text-xs text-zinc-400">Session: {session.id || '—'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card title="Attendance %" value={`${attendancePct}%`} gradient="from-orange-500/20 to-amber-500/10" icon={<Users className='h-4 w-4'/>} />
        <Card title="Present" value={stats.present} gradient="from-green-500/20 to-green-500/10" icon={<CheckCircle2 className='h-4 w-4'/>} />
        <Card title="Late" value={stats.late} gradient="from-amber-500/20 to-amber-500/10" icon={<Clock className='h-4 w-4'/>} />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-12 bg-black/40 text-xs uppercase tracking-wide text-zinc-400 px-3 py-2">
          <div className="col-span-5">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Method</div>
          <div className="col-span-3">Check-In Time</div>
        </div>
        <div className="divide-y divide-white/5">
          {sorted.map((r) => (
            <div key={r.id} className="grid grid-cols-12 px-3 py-2 items-center text-sm">
              <div className="col-span-5">
                <div className="font-medium text-zinc-100 flex items-center gap-2">
                  {r.duplicate && <AlertTriangle className="h-4 w-4 text-amber-400" title="Duplicate"/>}
                  {r.name}
                </div>
                <div className="text-[11px] text-zinc-400">{r.id}</div>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded text-xs border ${r.status==='present' ? 'bg-green-500/15 border-green-500/30 text-green-300' : r.status==='late' ? 'bg-amber-500/15 border-amber-500/30 text-amber-200' : 'bg-white/5 border-white/10 text-zinc-300'}`}>
                  {r.status}
                </span>
              </div>
              <div className="col-span-2 text-zinc-300">{r.method || '—'}</div>
              <div className="col-span-3 text-zinc-300">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm text-zinc-300 mb-2">Attendance Trend (This Session)</h3>
        <div className="h-2 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${attendancePct}%` }} />
        </div>
      </div>
    </section>
  );
}

function Card({ title, value, gradient, icon }) {
  return (
    <div className={`rounded-lg p-4 border border-white/10 bg-gradient-to-b ${gradient}`}>
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
        <div className="flex items-center gap-2">{icon} <span>{title}</span></div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
