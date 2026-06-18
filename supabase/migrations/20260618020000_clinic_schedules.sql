-- Horarios de atención por día de la semana (para habilitar las horas disponibles del agendar).
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

-- Lectura pública (para el agendar online); el endpoint usa service role igual.
DROP POLICY IF EXISTS "public_read_schedules" ON public.clinic_schedules;
CREATE POLICY "public_read_schedules" ON public.clinic_schedules FOR SELECT USING (true);
