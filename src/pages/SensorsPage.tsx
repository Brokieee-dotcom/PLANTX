import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Plant, SensorReading } from '@/types';
import {
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Plus,
  X,
  Calendar,
} from 'lucide-react';

export function SensorsPage() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [filterPlant, setFilterPlant] = useState<string>('all');

  // Form
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [lightLevel, setLightLevel] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const [plantsRes, readingsRes] = await Promise.all([
      supabase.from('plants').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('sensor_readings').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
    ]);
    setPlants(plantsRes.data ?? []);
    setReadings(readingsRes.data ?? []);
    setLoading(false);
  }

  async function logReading(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedPlantId) return;
    const { error } = await supabase.from('sensor_readings').insert({
      plant_id: selectedPlantId,
      soil_moisture: soilMoisture ? parseFloat(soilMoisture) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      humidity: humidity ? parseFloat(humidity) : null,
      light_level: lightLevel ? parseFloat(lightLevel) : null,
    });
    if (!error) {
      setShowLog(false);
      setSelectedPlantId('');
      setSoilMoisture('');
      setTemperature('');
      setHumidity('');
      setLightLevel('');
      loadData();
    }
  }

  const filtered = filterPlant === 'all' ? readings : readings.filter((r) => r.plant_id === filterPlant);
  const plantMap = new Map(plants.map((p) => [p.id, p]));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sensor Data</h1>
          <p className="mt-1 text-sm text-slate-400">Log and review environmental measurements for your plants.</p>
        </div>
        <button
          onClick={() => setShowLog(true)}
          disabled={plants.length === 0}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Log Reading
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-20">
          <Thermometer className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-lg font-medium text-slate-300">No plants to log readings for</p>
          <p className="text-sm text-slate-500">Add a plant first from the Plants page.</p>
        </div>
      ) : (
        <>
          {/* Filter */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterPlant('all')}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filterPlant === 'all' ? 'bg-emerald-500 text-white' : 'border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              All Plants
            </button>
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPlant(p.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterPlant === p.id ? 'bg-emerald-500 text-white' : 'border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-20">
              <Droplets className="mb-4 h-12 w-12 text-slate-600" />
              <p className="text-lg font-medium text-slate-300">No readings logged yet</p>
              <p className="text-sm text-slate-500">Click "Log Reading" to record environmental data.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 font-medium">Plant</th>
                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> Soil Moist.</span></th>
                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Thermometer className="h-3.5 w-3.5" /> Temp</span></th>
                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Humidity</span></th>
                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> Light</span></th>
                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const plant = plantMap.get(r.plant_id);
                    return (
                      <tr key={r.id} className="border-b border-white/5 text-sm last:border-0">
                        <td className="px-4 py-3 font-medium text-white">{plant?.name ?? 'Unknown'}</td>
                        <td className="px-4 py-3 text-slate-300">{r.soil_moisture !== null ? `${r.soil_moisture}%` : '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{r.temperature !== null ? `${r.temperature}°C` : '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{r.humidity !== null ? `${r.humidity}%` : '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{r.light_level ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(r.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Log reading modal */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowLog(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Log Sensor Reading</h2>
              <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={logReading} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Plant</label>
                <select
                  required
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                >
                  <option value="">Select a plant</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                    <Droplets className="h-3.5 w-3.5 text-sky-400" /> Soil Moisture (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(e.target.value)}
                    placeholder="42"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                    <Thermometer className="h-3.5 w-3.5 text-orange-400" /> Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="28"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                    <Activity className="h-3.5 w-3.5 text-teal-400" /> Humidity (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={humidity}
                    onChange={(e) => setHumidity(e.target.value)}
                    placeholder="53"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-300">
                    <Sun className="h-3.5 w-3.5 text-yellow-400" /> Light Level
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={lightLevel}
                    onChange={(e) => setLightLevel(e.target.value)}
                    placeholder="680"
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">Leave any field blank if you don't have that measurement.</p>
              <button type="submit" className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white">
                Save Reading
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
