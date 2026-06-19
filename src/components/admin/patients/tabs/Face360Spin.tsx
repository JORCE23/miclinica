"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Rotate3d } from "lucide-react"

export interface SpinPoint {
  id: string
  x: number // % horizontal dentro del visor
  y: number // % vertical
  t: number // segundo/ángulo del video donde se marcó
  treatment: string
  notes: string
}

const VIDEO_URL = "/models/face360.mp4"
// Qué tan cerca del ángulo marcado se muestra un punto (fracción de la vuelta completa).
const ANGLE_WINDOW = 0.15

interface Props {
  points: SpinPoint[]
  onChange: (points: SpinPoint[]) => void
  disabled?: boolean
}

export function Face360Spin({ points, onChange, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)
  const [curT, setCurT] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const pointsRef = useRef(points); pointsRef.current = points
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange
  const disabledRef = useRef(disabled); disabledRef.current = disabled

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onMeta = () => { setDuration(v.duration || 0); v.pause() }
    if (v.readyState >= 1) onMeta()
    v.addEventListener("loadedmetadata", onMeta)
    return () => v.removeEventListener("loadedmetadata", onMeta)
  }, [])

  // Arrastrar = girar · tocar (sin arrastrar) = marcar punto
  useEffect(() => {
    const wrap = wrapRef.current
    const v = videoRef.current
    if (!wrap || !v || !duration) return
    let dragging = false, startX = 0, startTime = 0, moved = 0
    const onDown = (e: PointerEvent) => {
      dragging = true; startX = e.clientX; startTime = v.currentTime || 0; moved = 0
      try { wrap.setPointerCapture(e.pointerId) } catch { /* noop */ }
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - startX
      moved = Math.max(moved, Math.abs(dx))
      const frac = dx / wrap.clientWidth // ancho completo ≈ una vuelta
      let t = (startTime + frac * duration) % duration
      if (t < 0) t += duration
      v.currentTime = t
      setCurT(t)
    }
    const onUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (moved <= 6 && !disabledRef.current) {
        const rect = wrap.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        if (x < 0 || x > 100 || y < 0 || y > 100) return
        const np: SpinPoint = { id: Math.random().toString(36).slice(2, 8), x, y, t: v.currentTime || 0, treatment: "Botox", notes: "" }
        onChangeRef.current([...pointsRef.current, np])
        setSelected(np.id)
      }
    }
    wrap.addEventListener("pointerdown", onDown)
    wrap.addEventListener("pointermove", onMove)
    wrap.addEventListener("pointerup", onUp)
    return () => {
      wrap.removeEventListener("pointerdown", onDown)
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerup", onUp)
    }
  }, [duration])

  const update = (id: string, patch: Partial<SpinPoint>) =>
    onChange(points.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => {
    onChange(points.filter((p) => p.id !== id))
    if (selected === id) setSelected(null)
  }
  const goToAngle = (t: number) => {
    const v = videoRef.current
    if (v) { v.currentTime = t; setCurT(t) }
  }

  const near = (t: number) => {
    if (!duration) return true
    let d = Math.abs(curT - t)
    d = Math.min(d, duration - d) // circular
    return d <= duration * ANGLE_WINDOW
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-muted/30 p-4 rounded-xl border">
      {/* Visor 360° */}
      <div className="flex-1 max-w-[420px] mx-auto w-full">
        <div
          ref={wrapRef}
          className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border select-none cursor-ew-resize"
          style={{ touchAction: "none" }}
        >
          <video ref={videoRef} src={VIDEO_URL} muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
          {/* Puntos visibles según el ángulo actual */}
          {points.map((p, i) => near(p.t) && (
            <button
              key={p.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelected(p.id) }}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={`absolute h-5 w-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md border-2 border-white transition-transform z-10 ${
                selected === p.id ? "bg-blue-600 text-white scale-125" : "bg-[#162439] text-white hover:scale-110"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
          <Rotate3d className="h-3.5 w-3.5" />
          {disabled ? "Arrastra para girar (360°)." : "Arrastra para girar 360° · toca para marcar un punto en ese ángulo."}
        </p>
      </div>

      {/* Panel de puntos */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Puntos de Tratamiento ({points.length})</h4>
        {points.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground text-sm">
            {disabled ? "Sin puntos marcados." : "Gira la cara y toca para marcar puntos."}
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[500px]">
            {points.map((point, i) => (
              <div
                key={point.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${selected === point.id ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "bg-card hover:border-slate-300"}`}
                onClick={() => { setSelected(point.id); goToAngle(point.t) }}
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
