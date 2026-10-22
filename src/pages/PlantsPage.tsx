import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Plant, SensorReading, ResearchNote } from '@/types';
import { EXPERIMENT_GROUPS, PLANT_STATUS_OPTIONS } from '@/types';
import {
  Sprout,
  Plus,
  X,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  Trash2,
  StickyNote,
  ChevronRight,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  healthy: 'bg-emerald-500/20 text-emerald-300',
  monitoring: 'bg-sky-500/20 text-sky-300',
  stressed: 'bg-amber-500/20 text-amber-300',
  critical: 'bg-red-500/20 text-red-300',
};

export function PlantsPage() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Add form
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [group, setGroup] = useState('control');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPlants();
  }, [user]);

  async function loadPlants() {
    if (!user) return;
    const { data } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPlants(data ?? []);
    setLoading(false);
  }

  async function addPlant(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('plants').insert({
      name,
      species: species || 'Unknown',
      experiment_group: group,
      notes,
    });
    if (!error) {
      setShowAdd(false);
      setName('');
      setSpecies('');
      setGroup('control');
      setNotes('');
      loadPlants();
    }
  }

  async function deletePlant(id: string) {
    if (!confirm('Delete this plant and all its data? This cannot be undone.')) return;
    await supabase.from('plants').delete().eq('id', id);
    setSelectedPlant(null);
    loadPlants();
  }

  async function updateStatus(plant: Plant, status: string) {
    await supabase.from('plants').update({ status, updated_at: new Date().toISOString() }).eq('id', plant.id);
    loadPlants();
    setSelectedPlant({ ...plant, status });
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (selectedPlant) {
    return (
      <PlantDetail
        plant={selectedPlant}
        onBack={() => setSelectedPlant(null)}
        onDelete={() => deletePlant(selectedPlant.id)}
        onStatusChange={(status) => updateStatus(selectedPlant, status)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Plants</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your monitored plants and their profiles.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
        >
          <Plus className="h-4 w-4" />
          Add Plant
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-20">
          <Sprout className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-lg font-medium text-slate-300">No plants yet</p>
          <p className="mb-6 text-sm text-slate-500">Add your first plant to start monitoring.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add Your First Plant
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => setSelectedPlant(plant)}
              className="group rounded-xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
                  <Sprout className="h-5 w-5 text-emerald-400" />
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[plant.status] ?? statusColors.healthy}`}>
                  {plant.status}
                </span>
              </div>
              <h3 className="font-semibold text-white">{plant.name}</h3>
              <p className="text-sm text-slate-400">{plant.species}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-white/5 px-2 py-0.5">{plant.experiment_group}</span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add New Plant</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={addPlant} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PX-01"
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Species</label>
                <input
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder="e.g. Tomato, Basil"
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Experiment Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                >
                  {EXPERIMENT_GROUPS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any initial observations..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white"
              >
                Create Plant
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlantDetail({
  plant,
  onBack,
  onDelete,
  onStatusChange,
}: {
  plant: Plant;
  onBack: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const { user } = useAuth();
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [readingsRes, notesRes] = await Promise.all([
        supabase
          .from('sensor_readings')
          .select('*')
          .eq('plant_id', plant.id)
          .order('recorded_at', { ascending: false })
          .limit(20),
        supabase
          .from('research_notes')
          .select('*')
          .eq('plant_id', plant.id)
          .order('recorded_at', { ascending: false }),
      ]);
      setReadings(readingsRes.data ?? []);
      setNotes(notesRes.data ?? []);
      setLoadingData(false);
    }
    load();
  }, [plant.id, user]);

  async function addNote() {
    if (!newNote.trim() || !user) return;
    const { data } = await supabase
      .from('research_notes')
      .insert({ plant_id: plant.id, content: newNote })
      .select()
      .single();
    if (data) {
      setNotes([data, ...notes]);
      setNewNote('');
    }
  }

  async function deleteNote(id: string) {
    await supabase.from('research_notes').delete().eq('id', id);
    setNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Plants
      </button>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/15">
              <Sprout className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{plant.name}</h1>
              <p className="text-sm text-slate-400">{plant.species}</p>
            </div>
          </div>
          <button onClick={onDelete} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select
              value={plant.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
            >
              {PLANT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Group</label>
            <span className="inline-block rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white">
              {plant.experiment_group}
            </span>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Created</label>
            <span className="inline-block rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-white">
              {new Date(plant.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {plant.notes && (
          <div className="mt-4 rounded-lg border border-white/5 bg-slate-900/40 p-3 text-sm text-slate-300">
            {plant.notes}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sensor readings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Sensor History</h2>
          {loadingData ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading...</div>
          ) : readings.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No sensor readings yet. Log readings from the Sensor Data page.
            </p>
          ) : (
            <div className="space-y-2">
              {readings.map((r) => (
                <div key={r.id} className="grid grid-cols-5 gap-2 rounded-lg border border-white/5 bg-slate-900/40 p-3 text-center text-xs">
                  <div>
                    <Droplets className="mx-auto mb-0.5 h-3.5 w-3.5 text-sky-400" />
                    <p className="text-slate-300">{r.soil_moisture ?? '-'}%</p>
                  </div>
                  <div>
                    <Thermometer className="mx-auto mb-0.5 h-3.5 w-3.5 text-orange-400" />
                    <p className="text-slate-300">{r.temperature ?? '-'}°</p>
                  </div>
                  <div>
                    <Activity className="mx-auto mb-0.5 h-3.5 w-3.5 text-teal-400" />
                    <p className="text-slate-300">{r.humidity ?? '-'}%</p>
                  </div>
                  <div>
                    <Sun className="mx-auto mb-0.5 h-3.5 w-3.5 text-yellow-400" />
                    <p className="text-slate-300">{r.light_level ?? '-'}</p>
                  </div>
                  <div>
                    <p className="mt-0.5 text-slate-500">
                      {new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Research notes */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <StickyNote className="h-4.5 w-4.5" />
            Research Notes
          </h2>
          <div className="mb-4 flex gap-2">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Add an observation..."
              className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
            />
            <button
              onClick={addNote}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Add
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="group flex items-start justify-between rounded-lg border border-white/5 bg-slate-900/40 p-3">
                  <div>
                    <p className="text-sm text-slate-200">{note.content}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(note.recorded_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
