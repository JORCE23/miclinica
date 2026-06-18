"use client"

import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MailButtonProps = {
  email?: string | null
  subject?: string
  body?: string
  label?: string
  className?: string
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm"
  variant?: "default" | "outline" | "secondary" | "ghost"
  iconOnly?: boolean
}

/**
 * Botón para enviar un correo. Abre la ventana de redacción de Gmail (con
 * destinatario, asunto y cuerpo prellenados). Se deshabilita si no hay correo.
 */
export function MailButton({
  email,
  subject,
  body,
  label = "Correo",
  className,
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: MailButtonProps) {
  const disabled = !email
  const href = email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}` +
      (subject ? `&su=${encodeURIComponent(subject)}` : "") +
      (body ? `&body=${encodeURIComponent(body)}` : "")
    : null

  return (
    <Button
      type="button"
      size={iconOnly ? "icon-sm" : size}
      variant={variant}
      disabled={disabled}
      title={disabled ? "Sin correo registrado" : "Enviar correo (Gmail)"}
      onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
      className={cn(
        !disabled && "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40",
        className
      )}
    >
      <Mail className="h-4 w-4" />
      {!iconOnly && label}
    </Button>
  )
}
