-- ════════ FASE 4: Pendientes, Colaboraciones y datos de Administración ════════

-- Pendientes (tareas generales del equipo, no solo de pacientes)
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

-- Colaboraciones (formularios recibidos de gente que quiere colaborar con la clínica)
CREATE TABLE IF NOT EXISTS public.collaborations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT,                    -- área / rol propuesto
  message     TEXT,
  status      TEXT DEFAULT 'nuevo',    -- nuevo | revisado | contactado | descartado
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_collaborations_clinic ON public.collaborations (clinic_id, created_at DESC);
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
-- El admin gestiona las de su clínica
DROP POLICY IF EXISTS "admin_manage_collaborations" ON public.collaborations;
CREATE POLICY "admin_manage_collaborations" ON public.collaborations FOR ALL USING (
  get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
);
-- Cualquiera puede ENVIAR el formulario público (insert), nadie anónimo puede leer
DROP POLICY IF EXISTS "public_insert_collaborations" ON public.collaborations;
CREATE POLICY "public_insert_collaborations" ON public.collaborations FOR INSERT WITH CHECK (true);

-- Datos legales / facturación de la clínica (Administración)
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS billing_plan TEXT;
