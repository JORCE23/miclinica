"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buildWhatsappLink } from "@/lib/whatsapp/link"
import { cn } from "@/lib/utils"

type WhatsappButtonProps = {
  phone?: string | null
  message?: string
  label?: string
  className?: string
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm"
  variant?: "default" | "outline" | "secondary" | "ghost"
  iconOnly?: boolean
}

/**
 * Botón "click-to-chat" de WhatsApp. Abre wa.me con el teléfono y un mensaje
 * prellenado en una pestaña nueva. Se deshabilita si no hay teléfono válido.
 */
export function WhatsappButton({
  phone,
  message,
  label = "WhatsApp",
  className,
  size = "sm",
  variant = "outline",
  iconOnly = false,
}: WhatsappButtonProps) {
  const href = buildWhatsappLink(phone, message)
  const disabled = !href

  return (
    <Button
      type="button"
      size={iconOnly ? "icon-sm" : size}
      variant={variant}
      disabled={disabled}
      title={disabled ? "Sin teléfono registrado" : "Abrir WhatsApp"}
      onClick={() => href && window.open(href, "_blank", "noopener,noreferrer")}
      className={cn(
        !disabled && "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {!iconOnly && label}
    </Button>
  )
}
