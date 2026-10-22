import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Plant, SensorReading, ImageAssessment } from '@/types';
import {
  Sprout,
  Thermometer,
  Droplets,
  Sun,
  ScanLine,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import type { PageKey } from '@/components/AppLayout';

export function OverviewPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<ImageAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [plantsRes, readingsRes, assessmentsRes] = await Promise.all([
        supabase.from('plants').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('sensor_readings').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
        supabase.from('image_assessments').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(5),
      ]);
      setPlants(plantsRes.data ?? []);
      setRecentReadings(readingsRes.data ?? []);
      setRecentAssessments(assessmentsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const stressedPlants = plants.filter((p) => p.status === 'stressed' || p.status === 'critical');
  const monitoringPlants = plants.filter((p) => p.status === 'monitoring');

  const stats = [
    { label: 'Total Plants', value: plants.length, icon: Sprout, color: 'from-emerald-500 to-teal-500' },
    { label: 'Need Attention', value: stressedPlants.length, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
    { label: 'Monitoring', value: monitoringPlants.length, icon: Activity, color: 'from-sky-500 to-blue-500' },
    { label: 'Assessments', value: recentAssessments.length, icon: ScanLine, color: 'from-violet-500 to-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor your plants and environmental conditions at a glance.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plants needing attention */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Plants Needing Attention</h2>
            <button
              onClick={() => onNavigate('plants')}
              className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {stressedPlants.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              All plants are healthy. No action needed.
            </p>
          ) : (
            <div className="space-y-3">
              {stressedPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{plant.name}</p>
                    <p className="text-xs text-slate-500">{plant.species}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      plant.status === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {plant.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sensor readings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Sensor Readings</h2>
            <button
              onClick={() => onNavigate('sensors')}
              className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {recentReadings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No sensor readings logged yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentReadings.slice(0, 5).map((reading) => {
                const plant = plants.find((p) => p.id === reading.plant_id);
                return (
                  <div
                    key={reading.id}
                    className="grid grid-cols-5 gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-3 text-center"
                  >
                    <div className="col-span-5 mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{plant?.name ?? 'Unknown'}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(reading.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                    {reading.soil_moisture !== null && (
                      <div>
                        <Droplets className="mx-auto mb-0.5 h-3.5 w-3.5 text-sky-400" />
                        <p className="text-xs text-slate-400">{reading.soil_moisture}%</p>
                      </div>
                    )}
                    {reading.temperature !== null && (
                      <div>
                        <Thermometer className="mx-auto mb-0.5 h-3.5 w-3.5 text-orange-400" />
                        <p className="text-xs text-slate-400">{reading.temperature}°C</p>
                      </div>
                    )}
                    {reading.humidity !== null && (
                      <div>
                        <Activity className="mx-auto mb-0.5 h-3.5 w-3.5 text-teal-400" />
                        <p className="text-xs text-slate-400">{reading.humidity}%</p>
                      </div>
                    )}
                    {reading.light_level !== null && (
                      <div>
                        <Sun className="mx-auto mb-0.5 h-3.5 w-3.5 text-yellow-400" />
                        <p className="text-xs text-slate-400">{reading.light_level}</p>
                      </div>
                    )}
                    <div>
                      <TrendingUp className="mx-auto mb-0.5 h-3.5 w-3.5 text-slate-500" />
                      <p className="text-xs text-slate-500">
                        {new Date(reading.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent assessments */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Image Assessments</h2>
          <button
            onClick={() => onNavigate('analysis')}
            className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
          >
            New analysis <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {recentAssessments.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No image assessments yet. Upload a plant photo to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentAssessments.map((assessment) => {
              const plant = plants.find((p) => p.id === assessment.plant_id);
              return (
                <div
                  key={assessment.id}
                  className="overflow-hidden rounded-lg border border-white/5 bg-slate-900/40"
                >
                  <img
                    src={assessment.image_url}
                    alt="Plant assessment"
                    className="h-32 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-white">{plant?.name ?? 'Unknown'}</p>
                    {assessment.health_score !== null && (
                      <p className="mt-1 text-xs text-slate-400">
                        Health: {assessment.health_score}%
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(assessment.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
