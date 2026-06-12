-- Ejecutar en el SQL Editor de Supabase para actualizar la tabla `services`
-- Este script añade todas las columnas necesarias para el Libro Maestro de Procedimientos

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS service_code TEXT,
  ADD COLUMN IF NOT EXISTS zones JSONB,
  ADD COLUMN IF NOT EXISTS reference_products JSONB,
  ADD COLUMN IF NOT EXISTS dose_units TEXT,
  ADD COLUMN IF NOT EXISTS application_route TEXT,
  ADD COLUMN IF NOT EXISTS clinical_duration_min INTEGER,
  ADD COLUMN IF NOT EXISTS effect_onset TEXT,
  ADD COLUMN IF NOT EXISTS effect_duration TEXT,
  ADD COLUMN IF NOT EXISTS recommended_sessions TEXT,
  ADD COLUMN IF NOT EXISTS sessions_interval TEXT,
  ADD COLUMN IF NOT EXISTS recovery_time TEXT,
  ADD COLUMN IF NOT EXISTS indications JSONB,
  ADD COLUMN IF NOT EXISTS use_general_contraindications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_toxin_contraindications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_care_type TEXT,
  ADD COLUMN IF NOT EXISTS requires_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_clinical_photo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_field TEXT;
