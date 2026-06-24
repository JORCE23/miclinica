-- ════════════════════════════════════════════════════════════════════
--  MIGRACIONES PENDIENTES — Medique (Fases 2, 4 y 5a)
--  Pega TODO en Supabase → SQL Editor → New query → Run.
--  Seguro de correr varias veces (idempotente).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1) Servicios: sección facial / corporal (Fase 2) ───────────────
ALTER TABLE services ADD COLUMN IF NOT EXISTS section TEXT;

-- ─── 2) Pendientes, Colaboraciones y datos de facturación (Fase 4) ──

-- Pendientes (tareas del equipo)
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  notes       TEXT,
  done        BOOLEAN DEFAULT false,
  priority    TEXT DEFAULT 'normal',   -- baja | normal | alta
  due_date    DATE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_clinic ON public.tasks (clinic_id, done, due_date);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_tasks" ON public.tasks;
CREATE POLICY "admin_manage_tasks" ON public.tasks FOR ALL USING (
  get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
);

-- Colaboraciones (formulario público)
CREATE TABLE IF NOT EXISTS public.collaborations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT,
  message     TEXT,
  status      TEXT DEFAULT 'nuevo',    -- nuevo | revisado | contactado | descartado
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collaborations_clinic ON public.collaborations (clinic_id, created_at DESC);
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_collaborations" ON public.collaborations;
CREATE POLICY "admin_manage_collaborations" ON public.collaborations FOR ALL USING (
  get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
);
DROP POLICY IF EXISTS "public_insert_collaborations" ON public.collaborations;
CREATE POLICY "public_insert_collaborations" ON public.collaborations FOR INSERT WITH CHECK (true);

-- Datos legales / facturación de la clínica
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS legal_name   TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS tax_id       TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS billing_plan TEXT;

-- ─── 3) Horarios de atención por día (Fase 5a) ──────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  day_of_week SMALLINT NOT NULL,         -- 0=Domingo … 6=Sábado
  is_open     BOOLEAN DEFAULT true,
  open_time   TEXT DEFAULT '09:00',
  close_time  TEXT DEFAULT '18:00',
  UNIQUE (clinic_id, day_of_week)
);
ALTER TABLE public.clinic_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_schedules" ON public.clinic_schedules;
CREATE POLICY "admin_manage_schedules" ON public.clinic_schedules FOR ALL USING (
  get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
);
DROP POLICY IF EXISTS "public_read_schedules" ON public.clinic_schedules;
CREATE POLICY "public_read_schedules" ON public.clinic_schedules FOR SELECT USING (true);

-- ─── 4) Resumen clínico IA + firma remota de consentimientos (Fase 3) ──
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS ai_summary    TEXT;
ALTER TABLE public.clinical_records ADD COLUMN IF NOT EXISTS ai_summary_at TIMESTAMPTZ;

ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS sign_token        UUID;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS professional_id   UUID REFERENCES professionals(id);
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS patient_email     TEXT;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS patient_phone     TEXT;
ALTER TABLE public.consents ADD COLUMN IF NOT EXISTS signed_by_patient BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_consents_sign_token ON public.consents (sign_token);

-- ─── 5) Bloqueos de horario (desactivar rangos dentro de un día) ──────────
-- Para "no atiendo de 12:00 a 14:00" (recurrente) o "ese día me tomé las 15-16"
-- (puntual). No aparecen al reservar online ni en la agenda del admin.
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  day_of_week SMALLINT,
  block_date  DATE,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT schedule_blocks_kind CHECK (
    (day_of_week IS NOT NULL AND block_date IS NULL) OR
    (day_of_week IS NULL AND block_date IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_clinic ON public.schedule_blocks (clinic_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_dow ON public.schedule_blocks (clinic_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_date ON public.schedule_blocks (clinic_id, block_date);
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_blocks" ON public.schedule_blocks;
CREATE POLICY "admin_manage_blocks" ON public.schedule_blocks FOR ALL USING (
  get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
);
DROP POLICY IF EXISTS "public_read_blocks" ON public.schedule_blocks;
CREATE POLICY "public_read_blocks" ON public.schedule_blocks FOR SELECT USING (true);
