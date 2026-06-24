-- Bloqueos de horario: rangos de tiempo que el profesional DESACTIVA dentro de un día.
-- Sirve para "no atiendo de 12:00 a 14:00" (recurrente cada semana) o para
-- "ese martes me tomé las 15:00-16:00" (puntual por fecha). Estos rangos:
--   1) se ven bloqueados en el calendario del admin, y
--   2) NO aparecen como disponibles cuando un paciente reserva online.
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  -- Recurrente semanal: day_of_week 0=Domingo … 6=Sábado (block_date NULL)
  day_of_week SMALLINT,
  -- Puntual: fecha específica (day_of_week NULL)
  block_date  DATE,
  start_time  TEXT NOT NULL,            -- 'HH:MM'
  end_time    TEXT NOT NULL,            -- 'HH:MM'
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  -- Debe ser recurrente (day_of_week) O puntual (block_date), no ambos ni ninguno.
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

-- Lectura pública (el agendar online necesita saber qué horas están bloqueadas).
DROP POLICY IF EXISTS "public_read_blocks" ON public.schedule_blocks;
CREATE POLICY "public_read_blocks" ON public.schedule_blocks FOR SELECT USING (true);
