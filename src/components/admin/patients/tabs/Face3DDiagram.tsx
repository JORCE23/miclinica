"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Rotate3d, Loader2 } from "lucide-react"

export interface DiagramPoint3D {
  id: string
  position: string // "x y z"
  normal: string   // "x y z"
  treatment: string
  notes: string
}

// Modelo 3D genérico (placeholder). Reemplázalo dejando otro archivo en
// public/models/face.glb (sin compresión meshopt/draco) — sin tocar código.
const MODEL_URL = "/models/face.glb"
const MV_SCRIPT = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"

function useModelViewerScript() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.customElements?.get("model-viewer")) { setReady(true); return }
    let s = document.querySelector<HTMLScriptElement>("script[data-model-viewer]")
    if (!s) {
      s = document.createElement("script")
      s.type = "module"
      s.src = MV_SCRIPT
      s.setAttribute("data-model-viewer", "1")
      document.head.appendChild(s)
    }
    const check = () => { if (window.customElements?.get("model-viewer")) setReady(true) }
    s.addEventListener("load", check)
    const t = setInterval(check, 300)
    const stop = setTimeout(() => clearInterval(t), 8000)
    return () => { clearInterval(t); clearTimeout(stop); s?.removeEventListener("load", check) }
  }, [])
  return ready
}

interface Props {
  points: DiagramPoint3D[]
  onChange: (points: DiagramPoint3D[]) => void
  disabled?: boolean
}

export function Face3DDiagram({ points, onChange, disabled }: Props) {
  const ready = useModelViewerScript()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mvRef = useRef<any>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Refs para tener siempre el estado más reciente dentro de los listeners nativos
  const pointsRef = useRef(points); pointsRef.current = points
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange
  const disabledRef = useRef(disabled); disabledRef.current = disabled

  // Colocar puntos: distingue "tap" (marcar) de "arrastrar" (girar la cámara)
  useEffect(() => {
    const mv = mvRef.current
    if (!mv || !ready) return
    let downX = 0, downY = 0
    const onDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY }
    const onUp = (e: PointerEvent) => {
      if (disabledRef.current) return
      // Si arrastró (giró la cámara), no marcamos punto
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return
      // Si tocó un punto existente, no creamos otro
      const target = e.target as HTMLElement
      if (target?.closest?.('[slot^="hotspot-"]')) return
      if (!mv.positionAndNormalFromPoint) return
      const rect = mv.getBoundingClientRect()
      const hit = mv.positionAndNormalFromPoint(e.clientX - rect.left, e.clientY - rect.top)
      if (!hit) return // tocó fuera del rostro
      const np: DiagramPoint3D = {
        id: Math.random().toString(36).slice(2, 8),
        position: hit.position.toString(),
        normal: hit.normal.toString(),
        treatment: "Botox",
        notes: "",
      }
      onChangeRef.current([...pointsRef.current, np])
      setSelected(np.id)
    }
    mv.addEventListener("pointerdown", onDown)
    mv.addEventListener("pointerup", onUp)
    return () => { mv.removeEventListener("pointerdown", onDown); mv.removeEventListener("pointerup", onUp) }
  }, [ready])

  const update = (id: string, patch: Partial<DiagramPoint3D>) =>
    onChange(points.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => {
    onChange(points.filter((p) => p.id !== id))
    if (selected === id) setSelected(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-muted/30 p-4 rounded-xl border">
      {/* Visor 3D */}
      <div className="flex-1 max-w-[420px] mx-auto w-full">
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border">
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2 z-10">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Cargando visor 3D…</span>
            </div>
          )}
          {ready && error && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2 z-10 px-4 text-center">
              <span className="text-xs">No se pudo cargar el modelo 3D.</span>
            </div>
          )}
          {ready && (
            <model-viewer
              ref={mvRef}
              src={MODEL_URL}
              camera-controls={true}
              touch-action="none"
              environment-image="neutral"
              exposure="1.15"
              shadow-intensity="0.6"
              camera-orbit="0deg 90deg 100%"
              loading="eager"
              reveal="auto"
              interaction-prompt="none"
              style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
              onError={() => setError(true)}
              onLoad={() => setError(false)}
            >
              {points.map((p, i) => (
                <button
                  key={p.id}
                  slot={`hotspot-${p.id}`}
                  data-position={p.position}
                  data-normal={p.normal}
                  data-visibility-attribute="visible"
                  onClick={(e) => { e.stopPropagation(); setSelected(p.id) }}
                  className={`h-5 w-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md border-2 border-white transition-transform ${
                    selected === p.id ? "bg-slate-600 text-white scale-125" : "bg-[#1A1A14] text-white hover:scale-110"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </model-viewer>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
          <Rotate3d className="h-3.5 w-3.5" />
          {disabled ? "Arrastra para girar el rostro." : "Arrastra para girar · toca el rostro para marcar un punto."}
        </p>
      </div>

      {/* Panel de puntos */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
          Puntos de Tratamiento ({points.length})
        </h4>
        {points.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm">
            {disabled ? "Sin puntos marcados." : "Gira la cara y toca para marcar puntos."}
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[500px]">
            {points.map((point, i) => (
              <div
                key={point.id}
                className={`p-3 rounded-lg border transition-colors ${selected === point.id ? "border-slate-500 bg-slate-50/50 dark:bg-slate-900/10" : "bg-card hover:border-slate-300"}`}
                onClick={() => setSelected(point.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">{i + 1}</span>
                    <span className="font-medium text-sm">Punto {i + 1}</span>
                  </div>
                  {!disabled && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); remove(point.id) }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Input placeholder="Tratamiento (Ej. Botox, Ácido)" value={point.treatment} onChange={(e) => update(point.id, { treatment: e.target.value })} className="h-8 text-sm" disabled={disabled} />
                  <Input placeholder="Dosis / Notas (Ej. 2 unidades)" value={point.notes} onChange={(e) => update(point.id, { notes: e.target.value })} className="h-8 text-sm" disabled={disabled} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
