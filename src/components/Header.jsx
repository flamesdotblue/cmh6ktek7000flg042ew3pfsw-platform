import { Rocket, User, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Rocket className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="text-white font-semibold leading-tight">AutoAttend</h1>
            <p className="text-xs text-zinc-400 -mt-0.5">AI Attendance & Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-zinc-300">
          <button className="rounded-md px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10">Docs</button>
          <button className="rounded-md p-2 bg-white/5 hover:bg-white/10 border border-white/10">
            <Settings className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center border border-white/10">
            <User className="h-4 w-4 text-zinc-200" />
          </div>
        </div>
      </div>
    </header>
  );
}
