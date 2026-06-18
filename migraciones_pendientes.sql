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
