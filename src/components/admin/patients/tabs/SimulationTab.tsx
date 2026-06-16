"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Wand2, Plus, Trash2, X, ImagePlus, Save } from "lucide-react"

type Simulation = { id: string; title: string; before_url: string | null; after_url: string | null; plan: string | null; created_at: string }

export function SimulationTab({ patientId }: { patientId: string }) {
  const qc = useQueryClient()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [plan, setPlan] = useState("")
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: sims = [], isLoading } = useQuery<Simulation[]>({
    queryKey: ["simulations", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/patients/${patientId}/simulations`)
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const uploadImage = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop()
    const fileName = `${patientId}/sim_${Date.now()}_${prefix}.${ext}`
    const { error } = await supabase.storage.from("clinical_photos").upload(fileName, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from("clinical_photos").getPublicUrl(fileName)
    return publicUrl
  }

  const reset = () => {
    setTitle(""); setPlan(""); setBeforeFile(null); setAfterFile(null); setShowForm(false)
  }

  const save = async () => {
    if (!title.trim()) { toast.error("Indica el título o zona"); return }
    setSaving(true)
    try {
      let before_url: string | null = null
      let after_url: string | null = null
      if (beforeFile) before_url = await uploadImage(beforeFile, "before")
      if (afterFile) after_url = await uploadImage(afterFile, "after")

      const r = await fetch(`/api/patients/${patientId}/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, plan, before_url, after_url }),
      })
      if (!r.ok) throw new Error()
      toast.success("Simulación guardada")
      reset()
      qc.invalidateQueries({ queryKey: ["simulations", patientId] })
    } catch {
      toast.error("No se pudo guardar (¿imagen muy grande o sin bucket?)")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta simulación?")) return
    const r = await fetch(`/api/patients/${patientId}/simulations?simId=${id}`, { method: "DELETE" })
    if (!r.ok) { toast.error("No se pudo eliminar"); return }
    qc.invalidateQueries({ queryKey: ["simulations", patientId] })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Wand2 className="h-5 w-5 text-brand" /> Simulación de tratamiento</h3>
          <p className="text-sm text-muted-foreground">Compara fotos antes/después y registra el plan por zona.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
            <Plus className="h-4 w-4 mr-2" /> Nueva simulación
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800">Nueva simulación</h4>
            <button onClick={reset} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Título / Zona *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Labios — Ácido hialurónico" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImagePicker label="Antes" file={beforeFile} onChange={setBeforeFile} />
            <ImagePicker label="Después" file={afterFile} onChange={setAfterFile} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan / Notas</label>
            <textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} className={`${inputCls} h-auto py-2.5`} placeholder="Sesiones, productos, zonas a tratar, resultados esperados..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset} className="rounded-xl">Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
      ) : sims.length === 0 && !showForm ? (
        <div className="p-10 text-center border border-dashed border-border rounded-2xl bg-muted/30">
          <Wand2 className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aún no hay simulaciones para este paciente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sims.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/70 bg-card shadow-soft p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(s.created_at), "dd 'de' MMM yyyy", { locale: es })}</p>
                </div>
                <button onClick={() => remove(s.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Photo url={s.before_url} label="Antes" />
                <Photo url={s.after_url} label="Después" />
              </div>
              {s.plan && <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">{s.plan}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"

function ImagePicker({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  const preview = file ? URL.createObjectURL(file) : null
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border bg-background cursor-pointer hover:border-brand/40 overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center text-muted-foreground text-xs"><ImagePlus className="h-6 w-6 mb-1" /> Subir foto</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

function Photo({ url, label }: { url: string | null; label: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">{label}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="w-full h-44 object-cover rounded-xl border border-border" />
      ) : (
        <div className="w-full h-44 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">Sin foto</div>
      )}
    </div>
  )
}
