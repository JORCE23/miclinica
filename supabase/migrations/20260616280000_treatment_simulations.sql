-- Simulaciones de tratamiento: fotos antes/después y plan por paciente.

CREATE TABLE IF NOT EXISTS public.treatment_simulations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  before_url  TEXT,
  after_url   TEXT,
  plan        TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatment_sim_patient
  ON public.treatment_simulations (patient_id, created_at DESC);

ALTER TABLE public.treatment_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_treatment_sim" ON public.treatment_simulations;
CREATE POLICY "admin_manage_treatment_sim" ON public.treatment_simulations
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
