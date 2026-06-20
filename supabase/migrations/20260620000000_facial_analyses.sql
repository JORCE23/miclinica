-- Análisis facial con IA: foto + métricas de proporción áurea por paciente.

CREATE TABLE IF NOT EXISTS public.facial_analyses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url   TEXT,
  harmony     INTEGER,
  metrics     JSONB,
  recs        JSONB,
  notes       TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facial_analyses_patient
  ON public.facial_analyses (patient_id, created_at DESC);

ALTER TABLE public.facial_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_facial_analyses" ON public.facial_analyses;
CREATE POLICY "admin_manage_facial_analyses" ON public.facial_analyses
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
