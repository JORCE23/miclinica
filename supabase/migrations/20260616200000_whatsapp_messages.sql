-- Mensajes de WhatsApp (Agente IA). Guarda el historial de conversaciones
-- entrantes/salientes por contacto para dar contexto al bot y poblar la bandeja.

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name  TEXT,
  direction     TEXT CHECK (direction IN ('in', 'out')) NOT NULL,
  body          TEXT,
  ai_model      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_clinic_phone
  ON public.whatsapp_messages (clinic_id, contact_phone, created_at DESC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Solo el admin de la clínica puede ver/gestionar sus conversaciones.
-- (El bot escribe con la service role key, que omite RLS.)
DROP POLICY IF EXISTS "admin_manage_wa_messages" ON public.whatsapp_messages;
CREATE POLICY "admin_manage_wa_messages" ON public.whatsapp_messages
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
