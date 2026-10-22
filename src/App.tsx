import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { AppLayout, type PageKey } from '@/components/AppLayout';
import { OverviewPage } from '@/pages/OverviewPage';
import { PlantsPage } from '@/pages/PlantsPage';
import { SensorsPage } from '@/pages/SensorsPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { ResearchPage } from '@/pages/ResearchPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Sprout, Loader2 } from 'lucide-react';

function Dashboard() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('overview');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500">
            <Sprout className="h-8 w-8 text-slate-950" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <AppLayout current={page} onNavigate={setPage}>
      {page === 'overview' && <OverviewPage onNavigate={setPage} />}
      {page === 'plants' && <PlantsPage />}
      {page === 'sensors' && <SensorsPage />}
      {page === 'analysis' && <AnalysisPage />}
      {page === 'research' && <ResearchPage onNavigate={setPage} />}
      {page === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

export default App;
