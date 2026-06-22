import type { SupabaseClient } from "@supabase/supabase-js"
import type { MetaConfig } from "./meta"

export type ClinicWhatsappConfig = {
  clinic_id: string
  provider: string
  phone_number_id: string | null
  waba_id: string | null
  access_token: string | null
  verify_token: string | null
  display_phone: string | null
  connected: boolean
}

/** Carga la config de WhatsApp de una clínica (usar con cliente admin/service role). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getClinicWhatsappConfig(admin: SupabaseClient<any>, clinicId: string): Promise<ClinicWhatsappConfig | null> {
  const { data } = await admin.from("whatsapp_config").select("*").eq("clinic_id", clinicId).maybeSingle()
  return (data as ClinicWhatsappConfig) || null
}

/** Encuentra la clínica dueña de un Phone Number ID (para enrutar webhooks). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getConfigByPhoneNumberId(admin: SupabaseClient<any>, phoneNumberId: string): Promise<ClinicWhatsappConfig | null> {
  const { data } = await admin.from("whatsapp_config").select("*").eq("phone_number_id", phoneNumberId).maybeSingle()
  return (data as ClinicWhatsappConfig) || null
}

/** Devuelve credenciales Meta listas si la clínica está conectada por Meta. */
export function metaCredsFrom(cfg: ClinicWhatsappConfig | null): MetaConfig | null {
  if (cfg && cfg.connected && cfg.provider === "meta" && cfg.phone_number_id && cfg.access_token) {
    return { phone_number_id: cfg.phone_number_id, access_token: cfg.access_token }
  }
  return null
}
