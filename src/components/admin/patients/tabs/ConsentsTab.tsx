"use client"

import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { SignaturePad, type SignaturePadHandle } from "@/components/admin/patients/SignaturePad"
import { FileSignature, Plus, Trash2, X, CheckCircle2, Eraser, Printer } from "lucide-react"
import { printArea } from "@/lib/print"

type Consent = { id: string; title: string; body: string | null; signature: string | null; signed_at: string | null; created_at: string }

const TEMPLATE = (name: string) =>
  `Yo, ${name || "____________"}, declaro haber sido informado/a de forma clara sobre el procedimiento, sus beneficios, riesgos y cuidados posteriores. He podido resolver mis dudas y autorizo voluntariamente su realización.`

export function ConsentsTab({ patientId, patientName }: { patientId: string; patientName?: string }) {
  const qc = useQueryClient()
  const sigRef = useRef<SignaturePadHandle>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<Consent | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: consents = [], isLoading } = useQuery<Consent[]>({
    queryKey: ["consents", patientId],
    queryFn: async () => {
      const r = await fetch(`/api/patients/${patientId}/consents`)
      if (!r.ok) throw new Error()
      return r.json()
    },
  })

  const openForm = () => {
    setTitle("")
    setBody(TEMPLATE(patientName || ""))
    setShowForm(true)
  }

  const save = async () => {
    if (!title.trim()) { toast.error("Indica el título del consentimiento"); return }
    const signature = sigRef.current?.toDataURL() || ""
    if (!signature) { toast.error("Falta la firma del paciente"); return }
    setSaving(true)
    try {
      const r = await fetch(`/api/patients/${patientId}/consents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, signature }),
      })
      if (!r.ok) throw new Error()
      toast.success("Consentimiento guardado")
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ["consents", patientId] })
    } catch { toast.error("No se pudo guardar") }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este consentimiento?")) return
    const r = await fetch(`/api/patients/${patientId}/consents?consentId=${id}`, { method: "DELETE" })
    if (!r.ok) { toast.error("No se pudo eliminar"); return }
    qc.invalidateQueries({ queryKey: ["consents", patientId] })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground dark:text-slate-100">Consentimientos firmados</h3>
        <Button onClick={openForm} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Nuevo consentimiento
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
      ) : consents.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-border rounded-2xl bg-muted/30">
          <FileSignature className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Este paciente aún no tiene consentimientos firmados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {consents.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border/70 bg-background p-4 hover:shadow-soft transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground dark:text-slate-100 truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd 'de' MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
                <button onClick={() => remove(c.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {c.signature && (
                <button onClick={() => setViewing(c)} className="mt-3 w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.signature} alt="Firma" className="h-16 w-full object-contain bg-white rounded-lg border border-border" />
                </button>
              )}
              {c.signed_at && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Firmado
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: nuevo consentimiento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-elevated border border-border/70 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-semibold text-foreground dark:text-slate-100 flex items-center gap-2"><FileSignature className="h-5 w-5 text-brand" /> Nuevo consentimiento</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Título</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ej. Consentimiento Ácido Hialurónico" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Texto del consentimiento</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className={`${inputCls} h-auto py-2.5 leading-relaxed`} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Firma del paciente</label>
                  <button onClick={() => sigRef.current?.clear()} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <Eraser className="h-3.5 w-3.5" /> Limpiar
                  </button>
                </div>
                <SignaturePad ref={sigRef} />
                <p className="text-[11px] text-muted-foreground mt-1">El paciente firma con el dedo o el mouse dentro del recuadro.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={save} disabled={saving} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                {saving ? "Guardando..." : "Guardar y firmar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ver consentimiento */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="print-area w-full max-w-lg bg-card rounded-2xl shadow-elevated border border-border/70 p-6 max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-0 print:shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 print:hidden">
              <h3 className="font-display text-xl font-semibold text-foreground dark:text-slate-100">{viewing.title}</h3>
              <div className="flex items-center gap-1">
                <button onClick={printArea} title="Imprimir" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Printer className="h-4 w-4" />
                </button>
                <button onClick={() => setViewing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
            </div>
            {/* Encabezado solo visible al imprimir */}
            <div className="hidden print:block mb-4 border-b border-black pb-3">
              <h1 className="text-xl font-bold">{viewing.title}</h1>
              {patientName && <p className="text-sm">Paciente: {patientName}</p>}
              <p className="text-sm">Fecha de impresión: {new Date().toLocaleDateString("es-CL")}</p>
            </div>
            {viewing.body && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">{viewing.body}</p>}
            {viewing.signature && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Firma</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={viewing.signature} alt="Firma" className="w-full h-32 object-contain bg-white rounded-xl border border-border" />
              </div>
            )}
            {viewing.signed_at && (
              <p className="mt-3 text-xs text-muted-foreground">Firmado el {format(new Date(viewing.signed_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full h-10 rounded-xl border border-input bg-background px-3.5 text-sm outline-none transition-all focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
