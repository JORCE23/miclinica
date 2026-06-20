"use client"

/**
 * Modal "Dar cita" estilo JC Medical (2 pasos), cableado a Supabase:
 *  1) Filtros (procedimiento, profesional, duración) + grilla de horas por día → elige hora.
 *  2) Datos del paciente (existente o nuevo) → crea paciente si hace falta y agenda la cita.
 */

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePatients } from "@/hooks/usePatients"
import { useServices } from "@/hooks/useServices"
import { X, Loader2 } from "lucide-react"

const ORIGENES: { v: string; l: string }[] = [
  { v: "organico", l: "Orgánico · Instagram" },
  { v: "meta_ads", l: "Meta Ads (pagada)" },
  { v: "google", l: "Google" },
  { v: "referido", l: "Referido" },
  { v: "whatsapp", l: "WhatsApp" },
  { v: "directo", l: "Directo" },
  { v: "otro", l: "Otro" },
]
const DURACIONES = [15, 30, 45, 60, 90, 120]
const DAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function buildSlots(duration: number) {
  // 09:00 → 18:00 en pasos de `duration`
  const out: string[] = []
  for (let m = 9 * 60; m + duration <= 18 * 60; m += duration) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
  }
  return out
}

export function DarCitaModal({ open, onClose, defaultScheduledAt }: { open: boolean; onClose: () => void; defaultScheduledAt?: string }) {
  const qc = useQueryClient()
  const { data: patients } = usePatients()
  const { data: services } = useServices(true)
  const { data: professionals } = useQuery<any[]>({
    queryKey: ["professionals"],
    queryFn: async () => { const r = await fetch("/api/professionals"); return r.ok ? r.json() : [] },
    enabled: open,
  })

  const [step, setStep] = useState<"slot" | "patient">("slot")
  const [serviceId, setServiceId] = useState("")
  const [professionalId, setProfessionalId] = useState("")
  const [duration, setDuration] = useState(30)
  const [picked, setPicked] = useState<{ date: Date; time: string } | null>(null)
  // paciente
  const [mode, setMode] = useState<"existente" | "nuevo">("existente")
  const [existingId, setExistingId] = useState("")
  const [name, setName] = useState("")
  const [rut, setRut] = useState("")
  const [phone, setPhone] = useState("+56 9")
  const [email, setEmail] = useState("")
  const [origen, setOrigen] = useState("organico")
  const [saving, setSaving] = useState(false)

  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d }), [])
  const slots = useMemo(() => buildSlots(duration), [duration])
  const service = services?.find((s: any) => s.id === serviceId)

  if (!open) return null

  function reset() {
    setStep("slot"); setServiceId(""); setProfessionalId(""); setDuration(30); setPicked(null)
    setMode("existente"); setExistingId(""); setName(""); setRut(""); setPhone("+56 9"); setEmail(""); setOrigen("organico")
  }
  function close() { reset(); onClose() }

  async function confirm() {
    if (!picked) return
    setSaving(true)
    try {
      let patientId = existingId
      if (mode === "nuevo") {
        if (!name.trim()) { toast.error("Indica el nombre del paciente"); setSaving(false); return }
        const r = await fetch("/api/patients", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: name.trim(), rut: rut.trim() || null, phone: phone.trim() || null, email: email.trim() || null, source: origen }),
        })
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "No se pudo crear el paciente") }
        patientId = (await r.json()).id
      }
      if (!patientId) { toast.error("Selecciona un paciente"); setSaving(false); return }

      const [hh, mm] = picked.time.split(":").map(Number)
      const dt = new Date(picked.date); dt.setHours(hh, mm, 0, 0)
      const res = await fetch("/api/appointments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId, service_id: serviceId || null, professional_id: professionalId || null,
          scheduled_at: dt.toISOString(), duration_minutes: duration, status: "pendiente",
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "No se pudo agendar (¿horario ocupado?)") }
      toast.success("Cita agendada")
      qc.invalidateQueries({ queryKey: ["appointments"] })
      close()
    } catch (e: any) {
      toast.error(e?.message || "Error al agendar")
    } finally {
      setSaving(false)
    }
  }

  const selCls = "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  const inpCls = selCls

  return (
    <div onClick={close} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-bg shadow-elevated flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-2xl text-foreground">{step === "slot" ? "Dar cita (agendar)" : "Dar cita · datos del paciente"}</h2>
          <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {step === "slot" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-5 p-6 overflow-y-auto">
              {/* filtros */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Procedimiento</label>
                  <select className={selCls} value={serviceId} onChange={(e) => { setServiceId(e.target.value); const s = services?.find((x: any) => x.id === e.target.value); if (s?.duration_minutes) setDuration(s.duration_minutes) }}>
                    <option value="">Evaluación general</option>
                    {services?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Profesional</label>
                  <select className={selCls} value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
                    <option value="">Cualquiera</option>
                    {professionals?.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Duración</label>
                  <select className={selCls} value={duration} onChange={(e) => setDuration(+e.target.value)}>
                    {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
                  </select>
                </div>
              </div>

              {/* grilla de horas */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
                {days.map((d) => (
                  <div key={d.toISOString()} className="text-center">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{DAYS[d.getDay()]}</div>
                    <div className="font-serif text-sm text-foreground mb-2">{d.getDate()} {MONTHS[d.getMonth()]}</div>
                    <div className="space-y-1.5">
                      {slots.map((t) => {
                        const sel = picked && picked.date.getTime() === d.getTime() && picked.time === t
                        return (
                          <button key={t} onClick={() => setPicked({ date: d, time: t })}
                            className={`w-full rounded-md py-1.5 text-xs transition-colors ${sel ? "bg-brand text-white" : "bg-surface border border-border text-accent hover:bg-accent/40"}`}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{picked ? `${DAYS[picked.date.getDay()]} ${picked.date.getDate()} ${MONTHS[picked.date.getMonth()]} · ${picked.time}` : "0 horas seleccionadas"}</span>
              <div className="flex gap-2">
                <button onClick={close} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Cerrar</button>
                <button onClick={() => picked && setStep("patient")} disabled={!picked} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">Continuar</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="rounded-xl bg-success/10 border border-success/30 px-4 py-3 text-sm text-foreground">
                Cita seleccionada · <b>{DAYS[picked!.date.getDay()]} {picked!.date.getDate()} {MONTHS[picked!.date.getMonth()]}</b> a las <b>{picked!.time}</b>{service ? ` · ${service.name}` : ""}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["existente", "nuevo"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${mode === m ? "border-brand bg-accent text-brand" : "border-border text-muted-foreground"}`}>
                    {m === "existente" ? "Paciente existente" : "Paciente nuevo"}
                  </button>
                ))}
              </div>

              {mode === "existente" ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Paciente</label>
                  <select className={selCls} value={existingId} onChange={(e) => setExistingId(e.target.value)}>
                    <option value="">Selecciona…</option>
                    {patients?.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}{p.rut ? ` · ${p.rut}` : ""}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Nombre completo</label>
                    <input className={inpCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Paciente nuevo" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">RUT</label>
                      <input className={inpCls} value={rut} onChange={(e) => setRut(e.target.value)} placeholder="12.345.678-9" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Teléfono (WhatsApp)</label>
                      <input className={inpCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Correo</label>
                    <input className={inpCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Campaña / origen</label>
                    <select className={selCls} value={origen} onChange={(e) => setOrigen(e.target.value)}>
                      {ORIGENES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button onClick={() => setStep("slot")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Atrás</button>
              <button onClick={confirm} disabled={saving} className="inline-flex items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Continuar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
