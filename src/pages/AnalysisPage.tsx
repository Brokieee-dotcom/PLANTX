import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Plant, ImageAssessment } from '@/types';
import {
  ScanLine,
  Upload,
  X,
  ImageIcon,
  Sprout,
  Loader2,
  Trash2,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';

interface AIResult {
  health_score: number;
  growth_stage: string;
  leaf_condition: string;
  stress_risk: number;
  ai_analysis: string;
}

export function AnalysisPage() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [assessments, setAssessments] = useState<ImageAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ImageAssessment | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const [plantsRes, assessmentsRes] = await Promise.all([
      supabase.from('plants').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('image_assessments').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
    ]);
    setPlants(plantsRes.data ?? []);
    setAssessments(assessmentsRes.data ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (selectedAssessment) {
    const plant = plants.find((p) => p.id === selectedAssessment.plant_id);
    return (
      <AssessmentDetail
        assessment={selectedAssessment}
        plantName={plant?.name ?? 'Unknown'}
        onBack={() => setSelectedAssessment(null)}
        onDelete={async () => {
          if (!confirm('Delete this assessment?')) return;
          await supabase.from('image_assessments').delete().eq('id', selectedAssessment.id);
          setSelectedAssessment(null);
          loadData();
        }}
      />
    );
  }

  const plantMap = new Map(plants.map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AI Analysis</h1>
          <p className="mt-1 text-sm text-slate-400">
            Upload plant photos for AI-powered health assessment and growth tracking.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          disabled={plants.length === 0}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />
          New Analysis
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-20">
          <ScanLine className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-lg font-medium text-slate-300">No plants to analyze</p>
          <p className="text-sm text-slate-500">Add a plant first from the Plants page.</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-20">
          <ImageIcon className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-lg font-medium text-slate-300">No assessments yet</p>
          <p className="mb-6 text-sm text-slate-500">Upload a plant photo and the AI will analyze it automatically.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Upload className="h-4 w-4" />
            Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => {
            const plant = plantMap.get(assessment.plant_id);
            return (
              <button
                key={assessment.id}
                onClick={() => setSelectedAssessment(assessment)}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={assessment.image_url}
                    alt="Plant"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {assessment.health_score !== null && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {assessment.health_score >= 70 ? '🟢' : assessment.health_score >= 40 ? '🟡' : '🔴'} {assessment.health_score}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{plant?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(assessment.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                  </div>
                  {assessment.ai_analysis && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">{assessment.ai_analysis}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal
          plants={plants}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); loadData(); }}
        />
      )}
    </div>
  );
}

function UploadModal({
  plants,
  onClose,
  onSaved,
}: {
  plants: Plant[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<'select' | 'analyzing' | 'review' | 'error'>('select');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields from AI result
  const [healthScore, setHealthScore] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [leafCondition, setLeafCondition] = useState('');
  const [stressRisk, setStressRisk] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleAnalyze() {
    if (!user || !file || !selectedPlantId) return;
    setStage('analyzing');
    setAiError(null);

    // Upload image to storage first
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file);

    if (uploadError) {
      setStage('error');
      setAiError('Failed to upload image. Please try again.');
      return;
    }

    const { data: urlData } = supabase.storage.from('plant-images').getPublicUrl(fileName);
    const uploadedUrl = urlData.publicUrl;
    setImageUrl(uploadedUrl);

    // Call the AI edge function
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-plant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ image_url: uploadedUrl }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${response.status})`);
      }

      const result: AIResult = await response.json();

      // Validate the response shape
      if (typeof result.health_score !== 'number' || typeof result.ai_analysis !== 'string') {
        throw new Error('AI returned an unexpected format.');
      }

      setAiResult(result);
      setHealthScore(String(result.health_score));
      setGrowthStage(result.growth_stage);
      setLeafCondition(result.leaf_condition);
      setStressRisk(String(result.stress_risk));
      setAnalysis(result.ai_analysis);
      setStage('review');
    } catch (err) {
      setStage('error');
      setAiError(err instanceof Error ? err.message : 'AI analysis failed. You can still save the assessment manually.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !imageUrl || !selectedPlantId) return;
    setSaving(true);

    await supabase.from('image_assessments').insert({
      plant_id: selectedPlantId,
      image_url: imageUrl,
      health_score: healthScore ? parseInt(healthScore) : null,
      growth_stage: growthStage || null,
      leaf_condition: leafCondition || null,
      stress_risk: stressRisk ? parseInt(stressRisk) : null,
      ai_analysis: analysis || null,
      notes: notes || null,
    });

    setSaving(false);
    onSaved();
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setStage('select');
    setAiError(null);
    setAiResult(null);
    setImageUrl(null);
    setHealthScore('');
    setGrowthStage('');
    setLeafCondition('');
    setStressRisk('');
    setAnalysis('');
    setNotes('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="my-8 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            {stage === 'review' && aiResult ? (
              <><Sparkles className="h-5 w-5 text-emerald-400" /> AI Analysis Complete</>
            ) : stage === 'analyzing' ? (
              <><Loader2 className="h-5 w-5 animate-spin text-emerald-400" /> Analyzing...</>
            ) : (
              <>New Plant Assessment</>
            )}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stage: select photo + plant */}
        {(stage === 'select' || stage === 'error') && (
          <div className="space-y-4">
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Plant Photo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-white/15 p-6 text-center transition-colors hover:border-emerald-400/40"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                    <p className="text-sm text-slate-400">Click to upload a plant photo</p>
                    <p className="text-xs text-slate-600">JPG, PNG up to 10MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {stage === 'error' && aiError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {stage === 'error' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStage('select')}
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Try Again
                </button>
                {imageUrl && (
                  <button
                    onClick={() => setStage('review')}
                    className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    Save Without AI
                  </button>
                )}
              </div>
            )}

            {stage === 'select' && (
              <button
                onClick={handleAnalyze}
                disabled={!file || !selectedPlantId}
                className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </span>
              </button>
            )}
          </div>
        )}

        {/* Stage: analyzing */}
        {stage === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-12">
            {preview && (
              <img src={preview} alt="Analyzing" className="mb-6 max-h-40 rounded-lg object-contain opacity-60" />
            )}
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">AI is analyzing your plant photo...</p>
            <p className="mt-1 text-xs text-slate-600">This usually takes 5-15 seconds</p>
          </div>
        )}

        {/* Stage: review AI results */}
        {stage === 'review' && (
          <form onSubmit={handleSave} className="space-y-4">
            {preview && (
              <img src={preview} alt="Plant" className="mx-auto max-h-40 rounded-lg object-contain" />
            )}

            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              AI analysis complete. Review and edit the fields below before saving.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Health Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={healthScore}
                  onChange={(e) => setHealthScore(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Stress Risk (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={stressRisk}
                  onChange={(e) => setStressRisk(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Growth Stage</label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                >
                  <option value="">Not specified</option>
                  <option value="seedling">Seedling</option>
                  <option value="vegetative">Vegetative</option>
                  <option value="flowering">Flowering</option>
                  <option value="fruiting">Fruiting</option>
                  <option value="mature">Mature</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Leaf Condition</label>
                <select
                  value={leafCondition}
                  onChange={(e) => setLeafCondition(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
                >
                  <option value="">Not specified</option>
                  <option value="healthy">Healthy</option>
                  <option value="slight-curling">Slight Curling</option>
                  <option value="wilting">Wilting</option>
                  <option value="yellowing">Yellowing</option>
                  <option value="dropping">Leaf Drop</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">AI Analysis</label>
              <textarea
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-emerald-400/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Additional Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra observations..."
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                New Photo
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Save Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AssessmentDetail({
  assessment,
  plantName,
  onBack,
  onDelete,
}: {
  assessment: ImageAssessment;
  plantName: string;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Assessments
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img src={assessment.image_url} alt="Plant" className="w-full" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
              <Sprout className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{plantName}</h1>
              <p className="text-sm text-slate-500">
                {new Date(assessment.recorded_at).toLocaleString()}
              </p>
            </div>
          </div>

          {(assessment.health_score !== null || assessment.stress_risk !== null) && (
            <div className="grid grid-cols-2 gap-3">
              {assessment.health_score !== null && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Health Score</p>
                  <p className={`text-2xl font-bold ${
                    assessment.health_score >= 70 ? 'text-emerald-400' : assessment.health_score >= 40 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {assessment.health_score}%
                  </p>
                </div>
              )}
              {assessment.stress_risk !== null && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-500">Stress Risk</p>
                  <p className={`text-2xl font-bold ${
                    assessment.stress_risk >= 60 ? 'text-red-400' : assessment.stress_risk >= 30 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {assessment.stress_risk}%
                  </p>
                </div>
              )}
            </div>
          )}

          {assessment.growth_stage && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-1 text-xs text-slate-500">Growth Stage</p>
              <p className="text-sm font-medium capitalize text-white">{assessment.growth_stage.replace('-', ' ')}</p>
            </div>
          )}

          {assessment.leaf_condition && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-1 text-xs text-slate-500">Leaf Condition</p>
              <p className="text-sm font-medium capitalize text-white">{assessment.leaf_condition.replace('-', ' ')}</p>
            </div>
          )}

          {assessment.ai_analysis && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> AI Analysis
              </p>
              <p className="text-sm leading-relaxed text-slate-200">{assessment.ai_analysis}</p>
            </div>
          )}

          {assessment.notes && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="mb-2 text-xs text-slate-500">Notes</p>
              <p className="text-sm text-slate-300">{assessment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
