"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from "react"

export type SignaturePadHandle = {
  toDataURL: () => string
  clear: () => void
  isEmpty: () => boolean
}

export const SignaturePad = forwardRef<SignaturePadHandle>(function SignaturePad(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#1A1A14"
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    canvasRef.current!.setPointerCapture(e.pointerId)
    const ctx = canvasRef.current!.getContext("2d")!
    const p = point(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    const p = point(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    if (empty) setEmpty(false)
  }
  const end = () => { drawing.current = false }

  useImperativeHandle(ref, () => ({
    toDataURL: () => (empty ? "" : canvasRef.current!.toDataURL("image/png")),
    clear: () => {
      const c = canvasRef.current
      if (!c) return
      c.getContext("2d")!.clearRect(0, 0, c.width, c.height)
      setEmpty(true)
    },
    isEmpty: () => empty,
  }))

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      className="w-full h-40 rounded-xl border-2 border-dashed border-border bg-white touch-none cursor-crosshair"
    />
  )
})
