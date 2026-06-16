-- Extras del Agente IA: recordatorios automáticos y traspaso a humano.

-- 1) Marca de recordatorio enviado por cita (evita duplicar recordatorios)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- 2) Ajustes por contacto de WhatsApp (ej. bot pausado = atención humana)
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  phone       TEXT NOT NULL,
  bot_paused  BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clinic_id, phone)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_wa_contacts" ON public.whatsapp_contacts;
CREATE POLICY "admin_manage_wa_contacts" ON public.whatsapp_contacts
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
