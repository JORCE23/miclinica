"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarCheck, Copy, ExternalLink, Check, Download } from "lucide-react"
import { toast } from "sonner"

/**
 * Tarjeta para compartir el link público de reserva online (/agenda/[slug])
 * con botón de copiar, código QR descargable y acceso directo.
 */
export function BookingShareCard({ slug }: { slug?: string | null }) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin)
  }, [])

  if (!slug) {
    return (
      <Card className="rounded-2xl border border-border/70 bg-card shadow-soft">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brand" /> Reserva online
          </CardTitle>
          <CardDescription>
            Aún no hay un enlace de reserva configurado para tu clínica.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const url = `${origin}/agenda/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Enlace copiado")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }

  const handleDownloadQr = () => {
    const canvas = document.getElementById("booking-qr") as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `reserva-${slug}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <Card className="rounded-2xl border border-border/70 bg-card shadow-soft">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b pb-6">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-brand" /> Reserva online — comparte tu link
        </CardTitle>
        <CardDescription>
          Comparte este enlace o código QR en Instagram, WhatsApp o tu web para que tus
          pacientes agenden solos.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Enlace público</label>
            <div className="flex gap-2">
              <Input readOnly value={url} className="font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" onClick={handleCopy} title="Copiar enlace">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4 mr-1.5" /> Abrir
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadQr}>
                <Download className="h-4 w-4 mr-1.5" /> Descargar QR
              </Button>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-border bg-white p-3 mx-auto md:mx-0">
            {origin && (
              <QRCodeCanvas id="booking-qr" value={url} size={140} level="M" marginSize={2} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
