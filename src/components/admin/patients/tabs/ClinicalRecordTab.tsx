"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { HeartPulse, ShieldAlert, Activity, FileText, Save, Printer } from "lucide-react"
import { printArea } from "@/lib/print"

type Field = { k: string; label: string; big?: boolean; chips?: string[] }

const SECTIONS: { title: string; icon: typeof HeartPulse; fields: Field[] }[] = [
  {
    title: "Antecedentes médicos",
    icon: HeartPulse,
    fields: [
      { k: "antecedentes_morbidos", label: "Antecedentes mórbidos", chips: ["Hipertensión", "Hipotiroidismo", "Diabetes", "Asma", "Rosácea"] },
      { k: "alergias", label: "Alergias" },
      { k: "antecedentes_quirurgicos", label: "Antecedentes quirúrgicos" },
      { k: "procedimientos_previos", label: "Procedimientos estéticos previos", chips: ["Botox", "Rinomodelación", "Sculptra", "Radiesse", "Mesoterapia", "Quemadores de grasa"] },
      { k: "hospitalizaciones", label: "Hospitalizaciones" },
      { k: "medicamentos_diarios", label: "Medicamentos de uso diario" },
    ],
  },
  {
    title: "Piel y factores de riesgo",
    icon: ShieldAlert,
    fields: [
      { k: "cicatriz_queloide", label: "Cicatriz hipertrófica / queloides" },
      { k: "patologia_dermica", label: "Patología dérmica" },
      { k: "problemas_coagulacion", label: "Problemas de coagulación" },
      { k: "enfermedades_autoinmunes", label: "Enfermedades autoinmunes" },
      { k: "herpes_labial", label: "Historial de herpes labial" },
      { k: "exposicion_solar", label: "Exposición solar / Uso de bloqueador" },
    ],
  },
  {
    title: "Hábitos",
    icon: Activity,
    fields: [
      { k: "tabaco", label: "Tabaco" },
      { k: "alcohol", label: "Alcohol" },
      { k: "drogas", label: "Drogas" },
      { k: "alimentacion", label: "Alimentación" },
      { k: "consumo_agua", label: "Consumo de agua diario" },
      { k: "actividad_fisica", label: "Actividad física" },
      { k: "embarazo_lactancia", label: "Embarazo / Lactancia" },
      { k: "skincare_casa", label: "Cuidados de la piel en casa (skincare)", chips: ["Bloqueador", "Sérum", "Crema", "Contorno de ojos", "Vitamina C"] },
    ],
  },
  {
    title: "Evaluación y plan",
    icon: FileText,
    fields: [
      { k: "evaluacion_facial", label: "Evaluación facial", big: true },
      { k: "tratamientos_recomendados", label: "Tratamientos recomendados", big: true },
    ],
  },
]

const ALL_KEYS = SECTIONS.flatMap((s) => s.fields.map((f) => f.k))
const emptyForm = () => Object.fromEntries(ALL_KEYS.map((k) => [k, ""])) as Record<string, string>

export function ClinicalRecordTab({ patientId, patientName }: { patientId: string; patientName?: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>(emptyForm())
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["clinical-record", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/patients/${patientId}/clinical-record`)
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  useEffect(() => {
    if (data) {
      setForm((prev) => {
        const next = { ...prev }
        for (const k of ALL_KEYS) next[k] = (data[k] as string) || ""
        return next
      })
    }
  }, [data])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  // Chips de selección rápida: agregan/quitan el texto en el campo (lista separada por comas).
  const hasChip = (k: string, chip: string) => (form[k] || "").toLowerCase().includes(chip.toLowerCase())
  const toggleChip = (k: string, chip: string) => {
    const cur = (form[k] || "").split(",").map((s) => s.trim()).filter(Boolean)
    const exists = cur.some((t) => t.toLowerCase() === chip.toLowerCase())
    const next = exists ? cur.filter((t) => t.toLowerCase() !== chip.toLowerCase()) : [...cur, chip]
    set(k, next.join(", "))
  }

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/api/patients/${patientId}/clinical-record`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!r.ok) throw new Error()
      toast.success("Ficha clínica guardada")
      qc.invalidateQueries({ queryKey: ["clinical-record", patientId] })
    } catch {
      toast.error("No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground py-8 text-center">Cargando ficha clínica...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Ficha Clínica</h3>
        <div className="flex items-center gap-2">
          <Button onClick={printArea} variant="outline" className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button onClick={save} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar ficha"}
          </Button>
        </div>
      </div>

      <div className="print-area space-y-5">
      {/* Encabezado solo visible al imprimir */}
      <div className="hidden print:block mb-4 border-b border-black pb-3">
        <h1 className="text-xl font-bold">Ficha Clínica</h1>
        {patientName && <p className="text-sm">Paciente: {patientName}</p>}
        <p className="text-sm">Fecha de impresión: {new Date().toLocaleDateString("es-CL")}</p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-2xl border border-border/70 bg-card shadow-soft overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/70 bg-muted/30">
            <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center">
              <section.icon className="h-4 w-4 text-brand-dark" />
            </div>
            <h4 className="font-semibold text-sm text-foreground dark:text-slate-100">{section.title}</h4>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((f) => (
              <div key={f.k} className={`space-y-1.5 ${f.big ? "md:col-span-2" : ""}`}>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</label>
                <textarea
                  value={form[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  rows={f.big ? 4 : 2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all resize-y focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
                  placeholder="—"
                />
                {f.chips && (
                  <div className="flex flex-wrap gap-1.5 pt-1 print:hidden">
                    {f.chips.map((chip) => {
                      const active = hasChip(f.k, chip)
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleChip(f.k, chip)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${active ? "bg-brand text-white border-brand" : "text-muted-foreground border-border hover:border-brand/40 hover:text-foreground"}`}
                        >
                          {chip}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      </div>

      <div className="flex justify-end print:hidden">
        <Button onClick={save} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar ficha"}
        </Button>
      </div>
    </div>
  )
}
