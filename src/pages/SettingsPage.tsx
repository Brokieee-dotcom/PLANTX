import { useAuth } from '@/context/AuthContext';
import { User, Mail, LogOut, Sprout } from 'lucide-react';

export function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your PLANT-X account.</p>
      </div>

      {/* Profile */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <User className="h-5 w-5 text-emerald-400" />
          Profile
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-3">
            <Sprout className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">User ID</p>
              <p className="font-mono text-xs text-slate-400">{user?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">About PLANT-X</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          PLANT-X is an AI-powered early-warning system that learns from environmental sensor
          data and plant observations to predict stress before visible symptoms appear.
          This dashboard lets researchers monitor plants, log sensor readings, upload photos
          for visual assessment, and organize experiments by group.
        </p>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
