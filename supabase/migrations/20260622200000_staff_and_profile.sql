-- Vincular un profesional con su perfil de acceso (login) y guardar permisos de staff.
-- (El código de "Equipo → crear cuenta de acceso" usa estas estructuras.)

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  profile_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_view_dashboard      BOOLEAN NOT NULL DEFAULT false,
  can_manage_patients     BOOLEAN NOT NULL DEFAULT true,
  can_manage_appointments BOOLEAN NOT NULL DEFAULT true,
  can_manage_services     BOOLEAN NOT NULL DEFAULT false,
  can_view_reports        BOOLEAN NOT NULL DEFAULT false,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
