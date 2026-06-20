-- Recordatorio de la mañana del día de la cita (08:30): bandera independiente
-- del recordatorio de 24h (reminder_sent_at) para no pisarse entre sí.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_morning_sent_at TIMESTAMPTZ;
