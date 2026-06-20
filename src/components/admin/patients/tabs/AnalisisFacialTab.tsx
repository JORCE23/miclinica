"use client"

/**
 * Análisis facial con IA — Proporción áurea (φ) + máscara de Marquardt.
 *
 * Detecta 468 landmarks faciales en el navegador con MediaPipe FaceMesh
 * (cargado por CDN, sin dependencias npm) a partir de una foto frontal, y
 * calcula métricas de armonía facial: tercios, ratios áureos, simetría.
 * Herramienta educativa de apoyo a la evaluación; el profesional decide.
 */

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Sparkles, Loader2, Grid3x3, Rows3, RotateCcw, Info } from "lucide-react"

/* ───────────────────────── MediaPipe FaceMesh (CDN) ───────────────────────── */
const FACEMESH_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js"

declare global {
  interface Window { FaceMesh?: any }
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((res) => {
    if (typeof document === "undefined") return res()
    if (Array.from(document.scripts).some((s) => s.src === src)) {
      if (window.FaceMesh) return res()
      const t = setInterval(() => { if (window.FaceMesh) { clearInterval(t); res() } }, 80)
      setTimeout(() => { clearInterval(t); res() }, 8000)
      return
    }
    const el = document.createElement("script")
    el.src = src; el.async = true; el.crossOrigin = "anonymous"
    el.onload = () => res(); el.onerror = () => res()
    document.head.appendChild(el)
  })
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image()
    i.crossOrigin = "anonymous"
    i.onload = () => res(i); i.onerror = rej; i.src = src
  })
}

type LM = { x: number; y: number; z?: number }

async function detectFaceMesh(dataUrl: string): Promise<{ lm: LM[]; W: number; H: number }> {
  await loadScriptOnce(FACEMESH_SRC)
  if (!window.FaceMesh) throw new Error("El modelo de IA no se pudo cargar. Revisa tu conexión e inténtalo de nuevo.")
  const img = await loadImg(dataUrl)
  return await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("La detección tardó demasiado. Intenta con otra foto.")), 20000)
    try {
      const fm = new window.FaceMesh({ locateFile: (f: string) => "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/" + f })
      fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.4 })
      fm.onResults((r: any) => {
        clearTimeout(to)
        const l = r.multiFaceLandmarks && r.multiFaceLandmarks[0]
        if (!l) reject(new Error("No se detectó un rostro. Usa una foto frontal, clara y bien iluminada."))
        else resolve({ lm: l, W: img.naturalWidth, H: img.naturalHeight })
      })
      fm.send({ image: img })
    } catch (e) { clearTimeout(to); reject(e as Error) }
  })
}

/* ───────────────────────── Proporción áurea (φ) ───────────────────────── */
const PHI = 1.618

type Metric = { key: string; label: string; value: string; score: number; ideal: string; note: string }
type Analysis = {
  metrics: Metric[]
  harmony: number
  recs: string[]
  lines: { t1y: number; t2y: number; topY: number; botY: number }
}

function aureoCompute(lm: LM[], W: number, H: number): Analysis {
  const P = (i: number) => ({ x: lm[i].x * W, y: lm[i].y * H })
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
  const trichion = P(10), glabella = P(9), subnasale = P(2), menton = P(152)
  const stomion = P(13), nasion = P(168)
  const alarL = P(49), alarR = P(279), mouthL = P(61), mouthR = P(291)
  const eyeOutL = P(33), eyeInL = P(133), eyeTopL = P(159), eyeBotL = P(145)
  const eyeInR = P(362), eyeOutR = P(263)

  const total = Math.abs(menton.y - trichion.y) || 1
  const t1 = (Math.abs(glabella.y - trichion.y) / total) * 100
  const t2 = (Math.abs(subnasale.y - glabella.y) / total) * 100
  const t3 = (Math.abs(menton.y - subnasale.y) / total) * 100

  const noseW = dist(alarL, alarR)
  const noseH = dist(nasion, subnasale)
  const mouthW = dist(mouthL, mouthR)
  const eyeW = dist(eyeOutL, eyeInL)
  const eyeH = dist(eyeTopL, eyeBotL)
  const interEye = dist(eyeInL, eyeInR)
  const lowerNase = dist(subnasale, menton)
  const noseToMouth = dist(subnasale, stomion)

  const sc = (val: number, ideal: number, tol: number) => Math.max(0, Math.min(1, 1 - Math.abs(val - ideal) / tol))
  const cx = (P(168).x + P(2).x) / 2
  const symPair = (l: { x: number }, r: { x: number }) => {
    const dl = Math.abs(l.x - cx), dr = Math.abs(r.x - cx)
    return 1 - Math.min(1, Math.abs(dl - dr) / ((dl + dr) / 2 || 1))
  }
  const symmetry = (symPair(eyeOutL, eyeOutR) + symPair(mouthL, mouthR) + symPair(alarL, alarR)) / 3

  const metrics: Metric[] = [
    { key: "tercios", label: "Tercios faciales (33/33/33)", value: `${Math.round(t1)} / ${Math.round(t2)} / ${Math.round(t3)}%`, score: (sc(t1, 33.3, 12) + sc(t2, 33.3, 12) + sc(t3, 33.3, 12)) / 3, ideal: "33 / 33 / 33 %", note: t3 > 37 ? "Tercio inferior dominante" : t3 < 29 ? "Tercio inferior corto" : "Equilibrio en tercios" },
    { key: "nariz", label: "Nariz · alto:ancho", value: `${(noseH / noseW).toFixed(2)} : 1`, score: sc(noseH / noseW, PHI, 0.5), ideal: "1.618 : 1", note: noseH / noseW < 1.45 ? "Base nasal ancha respecto a su altura" : "Dentro de rango" },
    { key: "nasolabial", label: "Surco nasolabial → mentón", value: `${(lowerNase / noseToMouth).toFixed(2)} : 1`, score: sc(lowerNase / noseToMouth, PHI, 0.6), ideal: "1.618 : 1", note: "Proporción áurea del tercio inferior" },
    { key: "boca", label: "Ancho boca : ancho nariz", value: `${(mouthW / noseW).toFixed(2)} : 1`, score: sc(mouthW / noseW, PHI, 0.45), ideal: "1.618 : 1", note: mouthW / noseW < 1.45 ? "Boca estrecha respecto a la nariz" : "Dentro de rango" },
    { key: "ojos", label: "Ojo · ancho:alto", value: `${(eyeW / eyeH).toFixed(2)} : 1`, score: sc(eyeW / eyeH, 3, 1.1), ideal: "≈ 3 : 1", note: eyeW / eyeH > 3.6 ? "Ojo alargado" : eyeW / eyeH < 2.4 ? "Ojo redondeado" : "Almendrado" },
    { key: "intercantal", label: "Distancia intercantal", value: `${(interEye / eyeW).toFixed(2)} : 1`, score: sc(interEye / eyeW, 1, 0.35), ideal: "≈ 1 ojo", note: interEye / eyeW > 1.25 ? "Ojos separados" : interEye / eyeW < 0.8 ? "Ojos juntos" : "Separación ideal" },
    { key: "simetria", label: "Simetría facial", value: `${Math.round(symmetry * 100)}%`, score: symmetry, ideal: "100 %", note: symmetry < 0.9 ? "Asimetría detectada" : "Buena simetría" },
  ]
  const harmony = Math.round((metrics.reduce((s, m) => s + m.score, 0) / metrics.length) * 100)

  const recs: string[] = []
  if (t3 > 37) recs.push("Tercio inferior dominante: evaluar proyección de mentón y equilibrio con bioestimulación / relleno.")
  if (t3 < 29) recs.push("Tercio inferior corto: valorar proyección de mentón.")
  if (noseH / noseW < 1.45) recs.push("Relación nasal fuera del ideal áureo: la rinomodelación puede armonizar dorso y punta.")
  if (mouthW / noseW < 1.45) recs.push("Boca estrecha respecto a la nariz: valorar volumen labial.")
  if (symmetry < 0.9) recs.push("Asimetría de expresión: la toxina botulínica puede equilibrar la musculatura.")
  if (!recs.length) recs.push("Proporciones dentro de rangos armónicos. Mantención y prevención.")

  return { metrics, harmony, recs, lines: { t1y: glabella.y / H, t2y: subnasale.y / H, topY: trichion.y / H, botY: menton.y / H } }
}

/* ───────────────────────── Máscara de Marquardt (φ) ───────────────────────── */
function MarquardtMask({ scale, dy, opacity }: { scale: number; dy: number; opacity: number }) {
  const deca = Array.from({ length: 10 }, (_, k) => {
    const a = ((k * 36 - 90) * Math.PI) / 180
    return [(34 * Math.cos(a)).toFixed(1), (47 * Math.sin(a) - 4).toFixed(1)].join(",")
  }).join(" ")
  const pent = (r: number, cy: number) =>
    Array.from({ length: 5 }, (_, k) => {
      const a = ((k * 72 - 90) * Math.PI) / 180
      return [(r * Math.cos(a)).toFixed(1), (r * Math.sin(a) + cy).toFixed(1)].join(",")
    }).join(" ")
  return (
    <svg viewBox="-50 -64 100 134" preserveAspectRatio="xMidYMid meet" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity }}>
      <g transform={`translate(0 ${dy}) scale(${scale})`} fill="none" stroke="#54707F" strokeWidth="0.7" strokeLinejoin="round">
        <polygon points={deca} strokeWidth="0.9" />
        <polygon points={pent(26, -8)} />
        <polygon points={pent(16, 4)} />
        <polygon points={pent(9, 14)} />
        <line x1="0" y1="-50" x2="0" y2="58" strokeDasharray="2 2" opacity="0.7" />
        <line x1="-30" y1="-18" x2="30" y2="-18" strokeDasharray="2 2" opacity="0.5" />
        <line x1="-26" y1="10" x2="26" y2="10" strokeDasharray="2 2" opacity="0.5" />
        <rect x="-26" y="-22" width="20" height="8" rx="2" />
        <rect x="6" y="-22" width="20" height="8" rx="2" />
        <ellipse cx="0" cy="30" rx="13" ry="6" />
      </g>
    </svg>
  )
}

function scoreColor(s: number) {
  if (s >= 0.8) return "var(--ms-accent, #54707F)"
  if (s >= 0.55) return "#CAA86A"
  return "#C0563F"
}

function fileToDataURL(file: File, maxDim: number, cb: (url: string) => void) {
  const rd = new FileReader()
  rd.onload = () => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale)
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h
      cv.getContext("2d")!.drawImage(img, 0, 0, w, h)
      cb(cv.toDataURL("image/jpeg", 0.9))
    }
    img.src = rd.result as string
  }
  rd.readAsDataURL(file)
}

/* ───────────────────────── Componente ───────────────────────── */
export function AnalisisFacialTab() {
  const [photo, setPhoto] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mask, setMask] = useState(false)
  const [thirds, setThirds] = useState(true)
  const [mScale, setMScale] = useState(1)
  const [mY, setMY] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null); setAnalysis(null)
    fileToDataURL(f, 1100, (url) => { setPhoto(url); runAnalysis(url) })
    e.target.value = ""
  }

  async function runAnalysis(url: string) {
    setLoading(true); setError(null)
    try {
      const { lm, W, H } = await detectFaceMesh(url)
      setAnalysis(aureoCompute(lm, W, H))
    } catch (e: any) {
      setError(e?.message || "No se pudo analizar la foto.")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setPhoto(null); setAnalysis(null); setError(null); setMask(false); setThirds(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" /> Análisis facial con <em className="font-cormorant italic text-brand not-italic md:italic">IA</em>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl font-light">
            Sube una foto frontal en reposo. La IA detecta los puntos del rostro y calcula la
            armonía según la proporción áurea (φ). Apoyo a la evaluación; el criterio clínico es del profesional.
          </p>
        </div>
        {photo && (
          <Button variant="outline" onClick={reset} className="rounded-xl shrink-0">
            <RotateCcw className="h-4 w-4 mr-2" /> Nueva foto
          </Button>
        )}
      </div>

      {!photo ? (
        <Card className="border-dashed bg-surface-2/40">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-16 px-6 text-center transition-colors hover:bg-accent/40 rounded-xl active:scale-[.99]"
          >
            <span className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
              <Upload className="h-6 w-6 text-brand" />
            </span>
            <span className="font-serif text-xl text-foreground">Subir foto frontal</span>
            <span className="text-xs text-muted-foreground max-w-xs">
              Rostro de frente, en reposo, bien iluminado y sin lentes. La imagen se procesa en el navegador.
            </span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
          {/* Visor */}
          <Card className="p-3">
            <div className="relative mx-auto w-full max-w-[420px] aspect-[3/4] overflow-hidden rounded-xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="Rostro en reposo" className="absolute inset-0 h-full w-full object-contain" />
              {thirds && analysis && (
                <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  {[analysis.lines.topY, analysis.lines.t1y, analysis.lines.t2y, analysis.lines.botY].map((y, i) => (
                    <line key={i} x1="6" x2="94" y1={y * 100} y2={y * 100} stroke="#54707F" strokeWidth="0.4" strokeDasharray="1.5 1.5" opacity="0.8" />
                  ))}
                  <line x1="50" x2="50" y1={analysis.lines.topY * 100} y2={analysis.lines.botY * 100} stroke="#8A929B" strokeWidth="0.3" strokeDasharray="1.5 1.5" opacity="0.7" />
                </svg>
              )}
              {mask && <MarquardtMask scale={mScale} dy={mY} opacity={0.9} />}

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 backdrop-blur-sm">
                  <Loader2 className="h-7 w-7 animate-spin text-brand" />
                  <span className="text-xs text-muted-foreground">Analizando rostro…</span>
                </div>
              )}
            </div>

            {/* Controles del visor */}
            <div className="mt-3 flex flex-wrap items-center gap-2 justify-center">
              <button
                onClick={() => setThirds((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${thirds ? "border-brand bg-accent text-brand" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Rows3 className="h-3.5 w-3.5" /> Tercios
              </button>
              <button
                onClick={() => setMask((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${mask ? "border-brand bg-accent text-brand" : "border-border text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3x3 className="h-3.5 w-3.5" /> Máscara de Marquardt
              </button>
            </div>
            {mask && (
              <div className="mt-3 grid grid-cols-2 gap-3 px-2">
                <label className="text-xs text-muted-foreground">
                  Escala
                  <input type="range" min={0.6} max={1.6} step={0.02} value={mScale} onChange={(e) => setMScale(+e.target.value)} className="w-full accent-brand" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Posición vertical
                  <input type="range" min={-30} max={30} step={1} value={mY} onChange={(e) => setMY(+e.target.value)} className="w-full accent-brand" />
                </label>
              </div>
            )}
          </Card>

          {/* Resultados */}
          <div className="space-y-4">
            {error && (
              <Card className="p-4 border-danger/40 bg-danger/5">
                <p className="text-sm text-danger flex items-start gap-2"><Info className="h-4 w-4 mt-0.5 shrink-0" /> {error}</p>
                <Button variant="outline" size="sm" onClick={() => photo && runAnalysis(photo)} className="mt-3 rounded-lg">Reintentar</Button>
              </Card>
            )}

            {analysis && (
              <>
                <Card className="p-5 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Armonía facial</p>
                  <p className="font-serif text-5xl leading-none mt-1" style={{ color: scoreColor(analysis.harmony / 100) }}>{analysis.harmony}</p>
                  <p className="text-xs text-muted-foreground mt-1">índice global de proporción áurea</p>
                </Card>

                <Card className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Métricas</p>
                  <div className="space-y-3">
                    {analysis.metrics.map((m) => (
                      <div key={m.key}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] text-foreground">{m.label}</span>
                          <span className="text-[13px] font-medium tabular-nums" style={{ color: scoreColor(m.score) }}>{m.value}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(m.score * 100)}%`, background: scoreColor(m.score) }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{m.note} · ideal {m.ideal}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Sugerencias (educativas)</p>
                  <ul className="space-y-2">
                    {analysis.recs.map((r, i) => (
                      <li key={i} className="text-[13px] text-foreground/90 flex gap-2 leading-snug">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-brand shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
    </div>
  )
}
