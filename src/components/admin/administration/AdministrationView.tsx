"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"
import { PageHeader } from "@/components/admin/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Users, ScrollText, FileText, Download, UserCheck } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type Tab = "equipo" | "actividad" | "datos" | "exportar"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Audit = { id: string; action: string; actor_name: string; patient_name: string | null; created_at: string }

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "equipo", label: "Equipo y permisos", icon: Users },
  { id: "actividad", label: "Registro de actividad", icon: ScrollText },
  { id: "datos", label: "Datos / facturación", icon: FileText },
  { id: "exportar", label: "Respaldo / exportar", icon: Download },
]

export function AdministrationView() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>("equipo")

  return (
    <div className="space-y-5">
      <PageHeader title="Administración" description="Equipo y permisos, registro de actividad, datos de la clínica y respaldo de información." icon={Shield} />

      <div className="flex gap-1.5 overflow-x-auto sidebar-scroll">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors ${tab === t.id ? "bg-brand text-white border-brand" : "text-muted-foreground border-border hover:text-foreground hover:border-brand/40"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "equipo" && <EquipoTab />}
      {tab === "actividad" && <ActividadTab />}
      {tab === "datos" && <DatosTab qc={qc} />}
      {tab === "exportar" && <ExportarTab />}
    </div>
  )
}

function EquipoTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pros = [] } = useQuery<any[]>({
    queryKey: ["professionals"],
    queryFn: async () => { const r = await fetch("/api/professionals"); return r.ok ? r.json() : [] },
  })
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-5">
        <h3 className="font-semibold text-foreground mb-1">Profesionales del equipo</h3>
        <p className="text-sm text-muted-foreground mb-4">Gestiona los profesionales desde la sección <Link href="/admin/professionals" className="text-brand hover:underline">Equipo</Link>.</p>
        <div className="space-y-2">
          {pros.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay profesionales registrados.</p>}
          {pros.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <div className="h-9 w-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><UserCheck className="h-4 w-4" /></div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.specialty || "Profesional"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Roles y permisos por usuario (staff) se gestionarán aquí. Por ahora, el administrador tiene acceso total.
      </div>
    </div>
  )
}

function ActividadTab() {
  const { data: logs = [], isLoading } = useQuery<Audit[]>({
    queryKey: ["audit-logs"],
    queryFn: async () => { const r = await fetch("/api/audit-logs"); return r.ok ? r.json() : [] },
  })
  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30"><h3 className="text-sm font-semibold text-foreground">Últimas acciones (150)</h3></div>
      {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Cargando…</div>
        : logs.length === 0 ? <div className="p-8 text-center text-muted-foreground text-sm">Sin actividad registrada aún.</div>
        : <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-foreground"><span className="font-medium">{l.actor_name}</span> · {l.action}{l.patient_name ? ` · ${l.patient_name}` : ""}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{format(new Date(l.created_at), "d MMM HH:mm", { locale: es })}</span>
              </div>
            ))}
          </div>}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DatosTab({ qc }: { qc: any }) {
  const [form, setForm] = useState({ name: "", legal_name: "", tax_id: "", billing_plan: "" })
  const { data: clinic } = useQuery<any>({ // eslint-disable-line @typescript-eslint/no-explicit-any
    queryKey: ["clinic_settings"],
    queryFn: async () => { const r = await fetch("/api/settings"); return r.ok ? r.json() : {} },
  })
  useEffect(() => {
    if (clinic) setForm({ name: clinic.name || "", legal_name: clinic.legal_name || "", tax_id: clinic.tax_id || "", billing_plan: clinic.billing_plan || "" })
  }, [clinic])

  const save = async () => {
    const r = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...clinic, ...form }) })
    if (!r.ok) { toast.error("No se pudo guardar"); return }
    toast.success("Datos guardados")
    qc.invalidateQueries({ queryKey: ["clinic_settings"] })
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-5 max-w-2xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5"><label className="text-sm font-medium">Razón social</label><Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} placeholder="Ej. JC Medical SpA" /></div>
        <div className="space-y-1.5"><label className="text-sm font-medium">RUT / Tax ID</label><Input value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="76.123.456-7" /></div>
        <div className="space-y-1.5 sm:col-span-2"><label className="text-sm font-medium">Plan / suscripción</label><Input value={form.billing_plan} onChange={(e) => setForm({ ...form, billing_plan: e.target.value })} placeholder="Ej. Profesional" /></div>
      </div>
      <div className="flex justify-end"><Button onClick={save} className="bg-brand text-white hover:bg-brand-dark rounded-xl">Guardar</Button></div>
    </div>
  )
}

function ExportarTab() {
  const items = [
    { type: "patients", label: "Pacientes", desc: "Nombre, RUT, contacto y estado." },
    { type: "appointments", label: "Citas", desc: "Fecha, paciente, servicio, estado y precio." },
    { type: "cash", label: "Caja", desc: "Movimientos de ingreso y egreso." },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((i) => (
        <div key={i.type} className="rounded-2xl border border-border/70 bg-card shadow-soft p-5">
          <h3 className="font-semibold text-foreground">{i.label}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{i.desc}</p>
          <a href={`/api/export/${i.type}`} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark">
            <Download className="h-4 w-4" /> Descargar CSV
          </a>
        </div>
      ))}
    </div>
  )
}
