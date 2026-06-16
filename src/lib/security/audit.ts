import type { SupabaseClient } from "@supabase/supabase-js"

export type AuditAction =
  | "READ_PATIENT"
  | "DEACTIVATE_PATIENT"
  | "READ_MEDICAL_HISTORY"
  | "CREATE_MEDICAL_HISTORY"
  | "READ_ALLERGIES"
  | "CREATE_ALLERGY"
  | "READ_PROCEDURES"
  | "CREATE_PROCEDURE"
  | "COMPLETE_APPOINTMENT"
  | "ADJUST_LOYALTY_POINTS"

export async function logAudit(
  supabase: SupabaseClient,
  params: {
    clinicId: string
    actorId: string
    action: AuditAction
    patientId?: string
    recordId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      clinic_id:  params.clinicId,
      actor_id:   params.actorId,
      action:     params.action,
      patient_id: params.patientId ?? null,
      record_id:  params.recordId  ?? null,
      metadata:   params.metadata  ?? null,
    })
  } catch {
    // Audit failure must never break the originating request
    console.error("[audit] Failed to write log:", params.action, params.patientId)
  }
}
