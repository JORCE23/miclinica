-- Ficha clínica completa del paciente (antecedentes, hábitos y evaluación).
-- Un registro por paciente (se edita/actualiza).

CREATE TABLE IF NOT EXISTS public.clinical_records (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                 UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id                UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Antecedentes médicos
  antecedentes_morbidos     TEXT,
  alergias                  TEXT,
  antecedentes_quirurgicos  TEXT,
  procedimientos_previos    TEXT,
  hospitalizaciones         TEXT,
  medicamentos_diarios      TEXT,
  -- Piel y factores de riesgo
  cicatriz_queloide         TEXT,
  patologia_dermica         TEXT,
  problemas_coagulacion     TEXT,
  enfermedades_autoinmunes  TEXT,
  herpes_labial             TEXT,
  exposicion_solar          TEXT,
  -- Hábitos
  tabaco                    TEXT,
  alcohol                   TEXT,
  drogas                    TEXT,
  alimentacion              TEXT,
  consumo_agua              TEXT,
  actividad_fisica          TEXT,
  embarazo_lactancia        TEXT,
  skincare_casa             TEXT,
  -- Evaluación y plan
  evaluacion_facial         TEXT,
  tratamientos_recomendados TEXT,
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id)
);

ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_clinical_records" ON public.clinical_records;
CREATE POLICY "admin_manage_clinical_records" ON public.clinical_records
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
