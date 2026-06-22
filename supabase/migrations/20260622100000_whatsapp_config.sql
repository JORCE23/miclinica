-- Conexión de WhatsApp por clínica (Meta / WhatsApp Cloud API).
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  clinic_id        UUID PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL DEFAULT 'meta',   -- 'meta'
  phone_number_id  TEXT,                            -- Phone Number ID de Meta
  waba_id          TEXT,                            -- WhatsApp Business Account ID (opcional)
  access_token     TEXT,                            -- token permanente de Meta
  verify_token     TEXT,                            -- token para verificar el webhook
  display_phone    TEXT,                            -- número visible (+56 9 ...)
  connected        BOOLEAN NOT NULL DEFAULT false,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Para enrutar los webhooks entrantes por Phone Number ID -> clínica.
CREATE INDEX IF NOT EXISTS whatsapp_config_phone_number_id_idx ON public.whatsapp_config (phone_number_id);
CREATE INDEX IF NOT EXISTS whatsapp_config_verify_token_idx ON public.whatsapp_config (verify_token);

-- RLS: solo el service role (servidor) accede; nunca el cliente directamente.
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
