import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Plant, SensorReading, ImageAssessment } from '@/types';
import { EXPERIMENT_GROUPS } from '@/types';
import {
  FlaskConical,
  Sprout,
  Droplets,
  Thermometer,
  ScanLine,
  ChevronRight,
} from 'lucide-react';
import type { PageKey } from '@/components/AppLayout';

interface GroupStats {
  plantCount: number;
  stressedCount: number;
  readingCount: number;
  assessmentCount: number;
  avgSoilMoisture: number | null;
  avgTemperature: number | null;
}

export function ResearchPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [assessments, setAssessments] = useState<ImageAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [plantsRes, readingsRes, assessmentsRes] = await Promise.all([
        supabase.from('plants').select('*').eq('user_id', user.id),
        supabase.from('sensor_readings').select('*').eq('user_id', user.id),
        supabase.from('image_assessments').select('*').eq('user_id', user.id),
      ]);
      setPlants(plantsRes.data ?? []);
      setReadings(readingsRes.data ?? []);
      setAssessments(assessmentsRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  function getGroupStats(groupValue: string): GroupStats {
    const groupPlants = plants.filter((p) => p.experiment_group === groupValue);
    const plantIds = new Set(groupPlants.map((p) => p.id));
    const groupReadings = readings.filter((r) => plantIds.has(r.plant_id));
    const groupAssessments = assessments.filter((a) => plantIds.has(a.plant_id));
    const stressed = groupPlants.filter((p) => p.status === 'stressed' || p.status === 'critical');

    const soilVals = groupReadings.map((r) => r.soil_moisture).filter((v): v is number => v !== null);
    const tempVals = groupReadings.map((r) => r.temperature).filter((v): v is number => v !== null);

    return {
      plantCount: groupPlants.length,
      stressedCount: stressed.length,
      readingCount: groupReadings.length,
      assessmentCount: groupAssessments.length,
      avgSoilMoisture: soilVals.length > 0 ? Math.round((soilVals.reduce((a, b) => a + b, 0) / soilVals.length) * 10) / 10 : null,
      avgTemperature: tempVals.length > 0 ? Math.round((tempVals.reduce((a, b) => a + b, 0) / tempVals.length) * 10) / 10 : null,
    };
  }

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
        <h1 className="text-3xl font-bold tracking-tight text-white">Research</h1>
        <p className="mt-1 text-sm text-slate-400">
          Compare experiment groups and track your research progress.
        </p>
      </div>

      {/* Experimental design overview */}
      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <FlaskConical className="h-5 w-5 text-emerald-400" />
          Experimental Design
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-400">
          Plants are organized into experimental groups to study how different environmental
          conditions affect plant health. The AI learns patterns from each group to predict
          stress before visible symptoms appear.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIMENT_GROUPS.map((group) => {
            const stats = getGroupStats(group.value);
            return (
              <div
                key={group.value}
                className="rounded-xl border border-white/10 bg-slate-900/40 p-5"
              >
                <div className="mb-3">
                  <h3 className="font-semibold text-white">{group.label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{group.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Sprout className="h-3.5 w-3.5" /> Plants
                    </span>
                    <span className="font-medium text-white">{stats.plantCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Thermometer className="h-3.5 w-3.5" /> Readings
                    </span>
                    <span className="font-medium text-white">{stats.readingCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ScanLine className="h-3.5 w-3.5" /> Assessments
                    </span>
                    <span className="font-medium text-white">{stats.assessmentCount}</span>
                  </div>
                  {stats.stressedCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400">Stressed</span>
                      <span className="font-medium text-amber-400">{stats.stressedCount}</span>
                    </div>
                  )}
                  {stats.avgSoilMoisture !== null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Droplets className="h-3.5 w-3.5" /> Avg Moisture
                      </span>
                      <span className="font-medium text-white">{stats.avgSoilMoisture}%</span>
                    </div>
                  )}
                  {stats.avgTemperature !== null && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Thermometer className="h-3.5 w-3.5" /> Avg Temp
                      </span>
                      <span className="font-medium text-white">{stats.avgTemperature}°C</span>
                    </div>
                  )}
                </div>

                {stats.plantCount > 0 && (
                  <button
                    onClick={() => onNavigate('plants')}
                    className="mt-3 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    View plants <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Research question & hypothesis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Research Question</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Can machine learning predict plant stress before visible symptoms become obvious,
            using environmental sensor data?
          </p>
          <div className="mt-4 space-y-1.5 text-sm text-slate-400">
            <p>- Which environmental factor is most important?</p>
            <p>- How early can stress be predicted?</p>
            <p>- Does combining multiple sensors improve prediction?</p>
            <p>- Does adding camera imagery improve prediction?</p>
            <p>- How accurate is the AI, and how many false warnings does it produce?</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">Hypothesis</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            If machine learning is trained using environmental sensor data and observed plant
            conditions, then it will be able to identify patterns associated with future plant
            stress and predict stress before obvious visual symptoms appear.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-medium text-emerald-300">Target Success Criteria</p>
            <p className="mt-1 text-xs text-slate-400">
              Prediction accuracy ≥ 85%, early warning several hours before visible symptoms,
              low false-positive rate.
            </p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-2xl font-bold text-white">{plants.length}</p>
          <p className="text-xs text-slate-400">Total Plants</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-2xl font-bold text-white">{readings.length}</p>
          <p className="text-xs text-slate-400">Sensor Readings</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-2xl font-bold text-white">{assessments.length}</p>
          <p className="text-xs text-slate-400">Image Assessments</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-2xl font-bold text-white">
            {EXPERIMENT_GROUPS.filter((g) => getGroupStats(g.value).plantCount > 0).length}
          </p>
          <p className="text-xs text-slate-400">Active Groups</p>
        </div>
      </div>
    </div>
  );
}
