"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function AiSummaryTab({ patientId }: { patientId: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch(`/api/patients/${patientId}/ai-summary`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setSummary(d.summary); setGeneratedAt(d.generated_at) } })
      .finally(() => setLoading(false))
  }, [patientId])

  const generate = async () => {
    setGenerating(true)
    try {
      const r = await fetch(`/api/patients/${patientId}/ai-summary`, { method: "POST" })
      const d = await r.json()
      if (!r.ok) { toast.error(d?.error || "No se pudo generar"); return }
      setSummary(d.summary); setGeneratedAt(d.generated_at)
      toast.success("Resumen generado")
    } catch {
      toast.error("Error al generar el resumen")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" /> Resumen clínico IA
          </h2>
          <p className="text-sm text-muted-foreground">Síntesis automática de la ficha, antecedentes, procedimientos e historial.</p>
        </div>
        <Button onClick={generate} disabled={generating} className="bg-brand text-white hover:bg-brand-dark rounded-xl shrink-0">
          {generating ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Generando…</> : <><Sparkles className="h-4 w-4 mr-1.5" /> {summary ? "Regenerar" : "Generar resumen"}</>}
        </Button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-muted-foreground">Cargando…</div>
      ) : summary ? (
        <div className="rounded-2xl border border-border/70 bg-card shadow-soft p-5">
          {generatedAt && (
            <p className="text-[11px] text-muted-foreground mb-3">Generado el {format(new Date(generatedAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}</p>
          )}
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-foreground leading-relaxed">{summary}</div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">Borrador generado por IA. Revísalo y valídalo con criterio clínico antes de usarlo.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aún no hay resumen. Pulsa “Generar resumen” para crearlo con IA a partir de la ficha del paciente.</p>
        </div>
      )}
    </div>
  )
}
