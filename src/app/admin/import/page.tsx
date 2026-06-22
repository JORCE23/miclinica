"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, Users, Package, Sparkles, Calendar, HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type SheetData = { name: string; headers: string[]; rows: Record<string, unknown>[] }
type EntityKey = "pacientes" | "inventario" | "servicios" | "reservas" | "desconocido"

type SheetState = SheetData & {
  entity: EntityKey
  mapping: Record<string, string | null>
  status: "idle" | "importing" | "done"
  progress: number
  result?: { inserted: number; skipped: number; errors: string[]; message?: string }
}

const ENTITIES: Record<Exclude<EntityKey, "desconocido">, { label: string; icon: typeof Users; chunk: number; fields: Record<string, string> }> = {
  pacientes: { label: "Pacientes", icon: Users, chunk: 12, fields: { full_name: "Nombre completo", rut: "RUT", email: "Correo", phone: "Teléfono", birth_date: "Nacimiento", notes: "Notas" } },
  inventario: { label: "Inventario", icon: Package, chunk: 200, fields: { name: "Producto", category: "Categoría", sku: "SKU / Código", unit: "Unidad", stock: "Stock", min_stock: "Stock mínimo", supplier: "Proveedor", notes: "Notas" } },
  servicios: { label: "Servicios", icon: Sparkles, chunk: 200, fields: { name: "Servicio", description: "Descripción", category: "Categoría", duration_minutes: "Duración (min)", price: "Precio" } },
  reservas: { label: "Reservas", icon: Calendar, chunk: 50, fields: { patient_name: "Paciente", service_name: "Servicio", professional_name: "Profesional", scheduled_at: "Fecha y hora", price: "Precio", notes: "Notas" } },
}

const ENTITY_OPTIONS: EntityKey[] = ["pacientes", "inventario", "servicios", "reservas", "desconocido"]

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [sheets, setSheets] = useState<SheetState[]>([])
  const [fileName, setFileName] = useState("")

  async function handleFile(file?: File | null) {
    if (!file) return
    setLoading(true)
    setSheets([])
    setFileName(file.name)
    try {
      const XLSX = await import("xlsx")
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const parsed: SheetData[] = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
        const headers = rows.length ? Object.keys(rows[0]) : []
        return { name, headers, rows }
      }).filter((s) => s.rows.length > 0)

      if (parsed.length === 0) { toast.error("El archivo no tiene datos legibles."); setLoading(false); return }

      // Pedir a la IA que detecte tipo + mapeo
      const res = await fetch("/api/import/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheets: parsed.map((s) => ({ name: s.name, headers: s.headers, sample: s.rows.slice(0, 5) })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No se pudo analizar")

      const results: { sheet: string; entity: EntityKey; mapping: Record<string, string | null> }[] = data.results || []
      setSheets(parsed.map((s) => {
        const det = results.find((r) => r.sheet === s.name)
        const entity = (det?.entity as EntityKey) || "desconocido"
        return { ...s, entity, mapping: det?.mapping || {}, status: "idle", progress: 0 }
      }))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al leer el archivo")
    } finally {
      setLoading(false)
    }
  }

  function setEntity(i: number, entity: EntityKey) {
    setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, entity } : s))
  }
  function setMap(i: number, field: string, col: string) {
    setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, mapping: { ...s.mapping, [field]: col || null } } : s))
  }

  async function importSheet(i: number) {
    const sheet = sheets[i]
    if (sheet.entity === "desconocido") { toast.error("Elige primero qué tipo de datos es."); return }
    const meta = ENTITIES[sheet.entity]
    setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, status: "importing", progress: 0 } : s))

    const agg = { inserted: 0, skipped: 0, errors: [] as string[], message: undefined as string | undefined }
    const chunk = meta.chunk
    try {
      for (let start = 0; start < sheet.rows.length; start += chunk) {
        const batch = sheet.rows.slice(start, start + chunk)
        const res = await fetch("/api/import/commit", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity: sheet.entity, mapping: sheet.mapping, rows: batch }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Error al importar")
        agg.inserted += data.inserted || 0
        agg.skipped += data.skipped || 0
        if (data.errors?.length) agg.errors.push(...data.errors)
        if (data.message) agg.message = data.message
        const prog = Math.min(100, Math.round(((start + batch.length) / sheet.rows.length) * 100))
        setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, progress: prog } : s))
      }
      setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, status: "done", result: agg } : s))
      if (agg.inserted > 0) toast.success(`${agg.inserted} ${meta.label.toLowerCase()} importados`)
      else if (agg.message) toast.info(agg.message)
      else toast.info("No se importó ningún registro (revisa el mapeo).")
    } catch (e) {
      setSheets((prev) => prev.map((s, idx) => idx === i ? { ...s, status: "idle" } : s))
      toast.error(e instanceof Error ? e.message : "Error al importar")
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Importar datos</h1>
        <p className="text-muted-foreground mt-1">Sube tu Excel o CSV y la IA detecta y ordena tus pacientes, inventario, servicios y reservas.</p>
      </div>

      {/* Zona de carga */}
      <div
        onClick={() => fileRef.current?.click()}
        className="rounded-2xl border-2 border-dashed border-border hover:border-brand/50 bg-card p-10 text-center cursor-pointer transition-colors"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p>Leyendo y analizando con IA…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-1"><Upload className="h-7 w-7" /></div>
            <p className="font-medium text-foreground">{fileName || "Haz clic para subir tu archivo"}</p>
            <p className="text-sm text-muted-foreground">Excel (.xlsx) o CSV · La IA detecta qué es cada hoja</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {/* Hojas detectadas */}
      {sheets.map((sheet, i) => {
        const isKnown = sheet.entity !== "desconocido"
        const meta = isKnown ? ENTITIES[sheet.entity as Exclude<EntityKey, "desconocido">] : null
        return (
          <div key={i} className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-brand" />
                <div>
                  <p className="font-semibold text-foreground">{sheet.name}</p>
                  <p className="text-xs text-muted-foreground">{sheet.rows.length} filas detectadas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <select
                  value={sheet.entity}
                  onChange={(e) => setEntity(i, e.target.value as EntityKey)}
                  disabled={sheet.status !== "idle"}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground"
                >
                  {ENTITY_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k === "desconocido" ? "Desconocido" : ENTITIES[k as Exclude<EntityKey, "desconocido">].label}</option>
                  ))}
                </select>
              </div>
            </div>

            {!isKnown ? (
              <div className="p-5 flex items-center gap-3 text-muted-foreground">
                <HelpCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">La IA no reconoció esta hoja. Elige manualmente qué tipo de datos es para poder importarla.</p>
              </div>
            ) : sheet.status === "done" ? (
              <div className="p-5">
                <div className="flex items-center gap-2 text-emerald-600 font-medium mb-2">
                  <CheckCircle2 className="h-5 w-5" /> Importación completada
                </div>
                <p className="text-sm text-foreground"><b>{sheet.result?.inserted}</b> importados · <b>{sheet.result?.skipped}</b> omitidos (vacíos o duplicados){sheet.result?.errors.length ? <> · <b className="text-red-600">{sheet.result.errors.length}</b> con error</> : null}</p>
                {sheet.result?.message && <p className="text-sm text-amber-600 mt-2">{sheet.result.message}</p>}
                {sheet.result?.errors?.length ? (
                  <details className="mt-2 text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Ver errores</summary>
                    <ul className="mt-1 list-disc pl-5 space-y-0.5">{sheet.result.errors.slice(0, 20).map((er, k) => <li key={k}>{er}</li>)}</ul>
                  </details>
                ) : null}
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Mapeo de columnas */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Asignación de columnas (la IA ya las propuso, ajústalas si hace falta):</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {meta && Object.entries(meta.fields).map(([field, label]) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
                        <select
                          value={sheet.mapping[field] || ""}
                          onChange={(e) => setMap(i, field, e.target.value)}
                          disabled={sheet.status !== "idle"}
                          className="flex-1 h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                        >
                          <option value="">— sin asignar —</option>
                          {sheet.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {sheet.status === "importing" ? (
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-brand transition-all" style={{ width: `${sheet.progress}%` }} />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Importando… {sheet.progress}%</p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button onClick={() => importSheet(i)} className="bg-brand text-white hover:bg-brand-dark rounded-xl shadow-glow">
                      Importar {sheet.rows.length} {meta?.label.toLowerCase()} <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
