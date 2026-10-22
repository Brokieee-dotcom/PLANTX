/*
# PLANT-X Schema — Plants, Sensor Readings, Image Assessments

1. New Tables
- `plants`: Each plant being monitored (name, species, group, notes)
- `sensor_readings`: Environmental measurements (soil moisture, temperature, humidity, light)
- `image_assessments`: Visual assessment records from uploaded plant photos
- `research_notes`: Researcher notes attached to plants

2. Security
- RLS enabled on all tables, scoped to authenticated users (owner-based)
- `user_id` on all tables defaults to `auth.uid()` so inserts from the frontend work without passing user_id
- GRANT CRUD to authenticated only — app requires sign-in
- All 4 policies per table (select/insert/update/delete) with ownership checks

3. Notes
- This is a multi-user app with sign-in. Each researcher sees only their own plants and data.
- No fake/seed data — all data is entered by the researcher through the dashboard.
*/

-- Plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  species text DEFAULT 'Unknown',
  experiment_group text DEFAULT 'control',
  status text DEFAULT 'healthy',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON plants TO authenticated;

DROP POLICY IF EXISTS "select_own_plants" ON plants;
CREATE POLICY "select_own_plants" ON plants FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plants" ON plants;
CREATE POLICY "insert_own_plants" ON plants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plants" ON plants;
CREATE POLICY "update_own_plants" ON plants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plants" ON plants;
CREATE POLICY "delete_own_plants" ON plants FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Sensor readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  soil_moisture numeric,
  temperature numeric,
  humidity numeric,
  light_level numeric,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON sensor_readings TO authenticated;

DROP POLICY IF EXISTS "select_own_readings" ON sensor_readings;
CREATE POLICY "select_own_readings" ON sensor_readings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_readings" ON sensor_readings;
CREATE POLICY "insert_own_readings" ON sensor_readings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_readings" ON sensor_readings;
CREATE POLICY "update_own_readings" ON sensor_readings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_readings" ON sensor_readings;
CREATE POLICY "delete_own_readings" ON sensor_readings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Image assessments table
CREATE TABLE IF NOT EXISTS image_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  health_score integer,
  growth_stage text,
  leaf_condition text,
  stress_risk integer,
  ai_analysis text,
  notes text,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE image_assessments ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON image_assessments TO authenticated;

DROP POLICY IF EXISTS "select_own_assessments" ON image_assessments;
CREATE POLICY "select_own_assessments" ON image_assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessments" ON image_assessments;
CREATE POLICY "insert_own_assessments" ON image_assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessments" ON image_assessments;
CREATE POLICY "update_own_assessments" ON image_assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessments" ON image_assessments;
CREATE POLICY "delete_own_assessments" ON image_assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Research notes table
CREATE TABLE IF NOT EXISTS research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON research_notes TO authenticated;

DROP POLICY IF EXISTS "select_own_notes" ON research_notes;
CREATE POLICY "select_own_notes" ON research_notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON research_notes;
CREATE POLICY "insert_own_notes" ON research_notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON research_notes;
CREATE POLICY "update_own_notes" ON research_notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON research_notes;
CREATE POLICY "delete_own_notes" ON research_notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_plant_id ON sensor_readings(plant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_assessments_plant_id ON image_assessments(plant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_notes_plant_id ON research_notes(plant_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);

-- Storage bucket for plant images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-images', 'plant-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can manage their own files
DROP POLICY IF EXISTS "Users can upload own plant images" ON storage.objects;
CREATE POLICY "Users can upload own plant images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'plant-images');

DROP POLICY IF EXISTS "Users can read plant images" ON storage.objects;
CREATE POLICY "Users can read plant images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'plant-images');

DROP POLICY IF EXISTS "Users can delete own plant images" ON storage.objects;
CREATE POLICY "Users can delete own plant images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'plant-images' AND owner = auth.uid());
