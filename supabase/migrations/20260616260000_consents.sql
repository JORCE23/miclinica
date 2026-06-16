-- Consentimientos informados digitales con firma del paciente.

CREATE TABLE IF NOT EXISTS public.consents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  signature   TEXT,            -- imagen de la firma en dataURL (base64)
  signed_at   TIMESTAMPTZ,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consents_patient
  ON public.consents (patient_id, created_at DESC);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_consents" ON public.consents;
CREATE POLICY "admin_manage_consents" ON public.consents
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
