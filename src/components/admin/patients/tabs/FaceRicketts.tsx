"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Sparkles, Ruler } from "lucide-react"

type Pt = { x: number; y: number } // normalizado 0..1 respecto a la imagen

// Índices del face mesh de MediaPipe
const IDX = { noseTip: 4, chin: 152, upperLip: 13, lowerLip: 14, trichion: 10, glabella: 9, subnasale: 2 }

export function FaceRicketts() {
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"ricketts" | "aurea">("ricketts")

  // Puntos clave (normalizados). nose/chin son editables (arrastrables).
  const [nose, setNose] = useState<Pt | null>(null)
  const [chin, setChin] = useState<Pt | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marks, setMarks] = useState<Record<string, Pt> | null>(null) // upperLip, lowerLip, trichion, etc.

  const onPick = async (file?: File | null) => {
    if (!file) return
    setError("")
    const reader = new FileReader()
    reader.onload = () => { setImageUrl(reader.result as string); setNose(null); setChin(null); setMarks(null) }
    reader.readAsDataURL(file)
  }

  // Detección facial automática cuando se carga la imagen
  const detect = async () => {
    const img = imgRef.current
    if (!img) return
    setLoading(true); setError("")
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vision: any = await import("@mediapipe/tasks-vision")
      const fileset = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm")
      let landmarker
      try {
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
          runningMode: "IMAGE", numFaces: 1,
        })
      } catch {
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "CPU" },
          runningMode: "IMAGE", numFaces: 1,
        })
      }
      const res = landmarker.detect(img)
      const lm = res?.faceLandmarks?.[0]
      if (!lm) { setError("No se detectó un rostro. Puedes ajustar la línea a mano."); setNose({ x: 0.6, y: 0.35 }); setChin({ x: 0.55, y: 0.85 }); setMarks(null); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (i: number): Pt => ({ x: lm[i].x, y: lm[i].y })
      setNose(g(IDX.noseTip)); setChin(g(IDX.chin))
      setMarks({ upperLip: g(IDX.upperLip), lowerLip: g(IDX.lowerLip), trichion: g(IDX.trichion), glabella: g(IDX.glabella), subnasale: g(IDX.subnasale) })
    } catch (e) {
      console.error(e)
      setError("No se pudo cargar el detector. Ajusta la línea a mano.")
      setNose({ x: 0.6, y: 0.35 }); setChin({ x: 0.55, y: 0.85 })
    } finally {
      setLoading(false)
    }
  }

  // Dibuja sobre el canvas
  useEffect(() => {
    const img = imgRef.current, canvas = canvasRef.current
    if (!img || !canvas || !imageUrl) return
    const W = img.clientWidth, H = img.clientHeight
    if (!W || !H) return
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, W, H)
    const P = (p: Pt) => ({ x: p.x * W, y: p.y * H })

    if (tab === "ricketts" && nose && chin) {
      const n = P(nose), c = P(chin)
      // Línea E de Ricketts
      ctx.strokeStyle = "#0ea5a5"; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(c.x, c.y); ctx.stroke()
      // Handles (nariz / mentón)
      for (const p of [n, c]) {
        ctx.fillStyle = "#0ea5a5"; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill()
      }
      // Labios
      if (marks) {
        for (const key of ["upperLip", "lowerLip"]) {
          const lp = P(marks[key])
          ctx.fillStyle = key === "upperLip" ? "#e11d48" : "#7c3aed"
          ctx.beginPath(); ctx.arc(lp.x, lp.y, 5, 0, Math.PI * 2); ctx.fill()
        }
      }
    }

    if (tab === "aurea" && marks && nose && chin) {
      const pts = [marks.trichion, marks.glabella, marks.subnasale, chin].map(P)
      ctx.strokeStyle = "#caa24a"; ctx.lineWidth = 1.5
      for (const p of pts) { ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(W, p.y); ctx.stroke() }
      // Línea media vertical
      const cx = (P(marks.trichion).x + P(chin).x) / 2
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
    }
  }, [imageUrl, tab, nose, chin, marks])

  // Arrastre de los handles (nariz/mentón)
  const dragRef = useRef<"nose" | "chin" | null>(null)
  const onDown = (e: React.PointerEvent) => {
    if (tab !== "ricketts" || !nose || !chin) return
    const canvas = canvasRef.current!; const r = canvas.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    const d = (p: Pt) => Math.hypot(p.x - x, p.y - y)
    dragRef.current = d(nose) < d(chin) ? (d(nose) < 0.06 ? "nose" : null) : (d(chin) < 0.06 ? "chin" : null)
    if (dragRef.current) canvas.setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const r = canvasRef.current!.getBoundingClientRect()
    const p = { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }
    if (dragRef.current === "nose") setNose(p); else setChin(p)
  }
  const onUp = () => { dragRef.current = null }

  // Evaluación de labios respecto a la línea E
  const lipReadout = (() => {
    if (!nose || !chin || !marks) return null
    const A = nose, B = chin
    const sign = (p: Pt) => {
      const d = ((B.x - A.x) * (p.y - A.y) - (B.y - A.y) * (p.x - A.x))
      return d // >0 = a un lado, <0 al otro
    }
    const fmt = (p: Pt) => (sign(p) < 0 ? "por delante" : "por detrás")
    return { sup: fmt(marks.upperLip), inf: fmt(marks.lowerLip) }
  })()

  return (
    <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-card">
          <button onClick={() => setTab("ricketts")} className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 ${tab === "ricketts" ? "bg-brand text-white" : "text-muted-foreground"}`}><Ruler className="h-3.5 w-3.5" /> Plano de Ricketts</button>
          <button onClick={() => setTab("aurea")} className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 ${tab === "aurea" ? "bg-brand text-white" : "text-muted-foreground"}`}><Sparkles className="h-3.5 w-3.5" /> Proporción áurea</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="rounded-xl ml-auto"><Upload className="h-4 w-4 mr-1.5" /> Subir foto de perfil</Button>
      </div>

      {!imageUrl ? (
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-12 text-center text-muted-foreground hover:border-brand/40 cursor-pointer">
          <Ruler className="h-8 w-8 mx-auto mb-2 opacity-40" />
          Sube una foto de perfil del paciente. El sistema detecta el rostro y dibuja la línea de Ricketts automáticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
          <div className="relative inline-block mx-auto max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={imageUrl} alt="Rostro" onLoad={detect} className="block max-h-[460px] w-auto rounded-xl" />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none cursor-pointer"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white rounded-xl gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Detectando rostro…
              </div>
            )}
          </div>

          <div className="space-y-3">
            {error && <p className="text-xs text-amber-600">{error}</p>}
            {tab === "ricketts" ? (
              <div className="rounded-xl border border-border bg-card p-3 text-sm space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5"><Ruler className="h-4 w-4 text-brand" /> Línea E de Ricketts</p>
                <p className="text-xs text-muted-foreground">De la punta de la nariz al mentón. Arrastra los puntos para ajustar.</p>
                {lipReadout && (
                  <div className="text-xs space-y-1 pt-1 border-t border-border/60">
                    <p>Labio superior: <span className="font-medium">{lipReadout.sup}</span> de la línea</p>
                    <p>Labio inferior: <span className="font-medium">{lipReadout.inf}</span> de la línea</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-3 text-sm space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-brand" /> Proporción áurea</p>
                <p className="text-xs text-muted-foreground">Tercios faciales: frente, tercio medio y tercio inferior, con la línea media vertical.</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={detect} className="w-full">Volver a detectar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
