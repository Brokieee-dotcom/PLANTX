export interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string;
  experiment_group: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  plant_id: string;
  user_id: string;
  soil_moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  light_level: number | null;
  recorded_at: string;
}

export interface ImageAssessment {
  id: string;
  plant_id: string;
  user_id: string;
  image_url: string;
  health_score: number | null;
  growth_stage: string | null;
  leaf_condition: string | null;
  stress_risk: number | null;
  ai_analysis: string | null;
  notes: string | null;
  recorded_at: string;
}

export interface ResearchNote {
  id: string;
  plant_id: string;
  user_id: string;
  content: string;
  recorded_at: string;
}

export type ExperimentGroup = 'control' | 'water-stress' | 'heat-stress' | 'combined-stress';

export const EXPERIMENT_GROUPS: { value: ExperimentGroup; label: string; description: string }[] = [
  { value: 'control', label: 'Control', description: 'Normal watering and normal conditions' },
  { value: 'water-stress', label: 'Water Stress', description: 'Reduced watering to induce drought stress' },
  { value: 'heat-stress', label: 'Heat Stress', description: 'Elevated temperature conditions' },
  { value: 'combined-stress', label: 'Combined Stress', description: 'Reduced water + increased temperature' },
];

export const PLANT_STATUS_OPTIONS = ['healthy', 'monitoring', 'stressed', 'critical'] as const;
