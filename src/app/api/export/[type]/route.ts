import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = headers.join(",")
  const body = rows.map((r) => headers.map((h) => esc(r[h])).join(",")).join("\n")
  return `﻿${head}\n${body}` // BOM para Excel
}

export async function GET(_request: Request, { params }: { params: { type: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const clinicId = context!.clinicId
  let rows: Record<string, unknown>[] = []
  let headers: string[] = []
  let filename = "export.csv"

  if (params.type === "patients") {
    const { data } = await supabase.from("profiles").select("full_name, rut, phone, email, birth_date, is_active, created_at").eq("clinic_id", clinicId).eq("role", "client").order("full_name")
    rows = data || []
    headers = ["full_name", "rut", "phone", "email", "birth_date", "is_active", "created_at"]
    filename = "pacientes.csv"
  } else if (params.type === "appointments") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase.from("appointments").select("scheduled_at, status, duration_minutes, price, payment_method, patient:profiles!appointments_patient_id_fkey(full_name), service:services(name)").eq("clinic_id", clinicId).order("scheduled_at", { ascending: false }) as any
    rows = (data || []).map((a: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      fecha: a.scheduled_at, paciente: a.patient?.full_name || "", servicio: a.service?.name || "",
      estado: a.status, duracion_min: a.duration_minutes, precio: a.price, metodo_pago: a.payment_method,
    }))
    headers = ["fecha", "paciente", "servicio", "estado", "duracion_min", "precio", "metodo_pago"]
    filename = "citas.csv"
  } else if (params.type === "cash") {
    const { data } = await supabase.from("cash_movements").select("created_at, type, amount, method, concept").eq("clinic_id", clinicId).order("created_at", { ascending: false })
    rows = data || []
    headers = ["created_at", "type", "amount", "method", "concept"]
    filename = "caja.csv"
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }

  const csv = toCsv(rows, headers)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
