import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Sprout,
  Thermometer,
  ScanLine,
  FlaskConical,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export type PageKey = 'overview' | 'plants' | 'sensors' | 'analysis' | 'research' | 'settings';

interface LayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

const navItems: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'plants', label: 'Plants', icon: Sprout },
  { key: 'sensors', label: 'Sensor Data', icon: Thermometer },
  { key: 'analysis', label: 'AI Analysis', icon: ScanLine },
  { key: 'research', label: 'Research', icon: FlaskConical },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ current, onNavigate, children }: LayoutProps) {
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: PageKey) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-900/80 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
                <Sprout className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <p className="font-bold leading-tight text-white">PLANT-X</p>
                <p className="text-xs text-slate-500">AI Monitoring</p>
              </div>
            </div>
            <button
              className="text-slate-400 lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = current === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4.5 w-4.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <div className="sticky top-0 z-30 flex items-center border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-slate-400">
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 font-semibold">PLANT-X</span>
        </div>

        <main className="min-h-screen p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
