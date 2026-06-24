"use client"

import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarButtonProps = {
  /** Inicio de la cita (ISO o Date) */
  start?: string | Date | null
  /** Duración en minutos (default 30) */
  durationMinutes?: number
  title?: string
  details?: string
  location?: string
  label?: string
  className?: string
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm"
  variant?: "default" | "outline" | "secondary" | "ghost"
  iconOnly?: boolean
}

// Formato YYYYMMDDTHHMMSSZ (UTC) que exige Google Calendar
function gcalStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/**
 * Botón "Agregar al calendario": abre Google Calendar con un evento prellenado
 * (fecha, hora, duración, título y detalles de la cita) en una pestaña nueva.
 */
export function CalendarButton({
  start,
  durationMinutes = 30,
  title = "Cita",
  details = "",
  location = "",
  label = "Agregar al calendario",
  className,
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: CalendarButtonProps) {
  const startDate = start ? new Date(start) : null
  const valid = startDate && !isNaN(startDate.getTime())

  const buildHref = () => {
    if (!valid) return ""
    const end = new Date(startDate!.getTime() + durationMinutes * 60_000)
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${gcalStamp(startDate!)}/${gcalStamp(end)}`,
    })
    if (details) params.set("details", details)
    if (location) params.set("location", location)
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  return (
    <Button
      type="button"
      size={iconOnly ? "icon-sm" : size}
      variant={variant}
      disabled={!valid}
      title={valid ? "Agregar a Google Calendar" : "Sin fecha definida"}
      onClick={() => {
        const href = buildHref()
        if (href) window.open(href, "_blank", "noopener,noreferrer")
      }}
      className={cn(
        valid && "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40",
        className
      )}
    >
      <CalendarPlus className="h-4 w-4" />
      {!iconOnly && label}
    </Button>
  )
}
