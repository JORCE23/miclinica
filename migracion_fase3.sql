-- ════════ FASE 3: Resumen clínico IA + Firma remota de consentimientos ════════
-- Pega TODO en Supabase → SQL Editor → New query → Run. Idempotente (seguro de repetir).

ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS ai_summary    TEXT;
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS ai_summary_at TIMESTAMPTZ;

ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS sign_token        UUID;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS professional_id   UUID REFERENCES professionals(id);
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS patient_email     TEXT;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS patient_phone     TEXT;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS signed_by_patient BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_consents_sign_token ON public.consents (sign_token);
