import * as React from "react"

type IconType = React.ComponentType<{ className?: string }>

/**
 * Encabezado de página minimalista (estilo del prototipo).
 * Título en serif sobre fondo claro, icono sutil opcional y slot de acciones.
 * Solo presentación — no contiene lógica.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: IconType
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="hidden sm:flex h-11 w-11 rounded-xl bg-brand/10 items-center justify-center shrink-0">
            <Icon className="h-[22px] w-[22px] text-brand" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-[34px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-0.5 max-w-xl">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{children}</div>
      )}
    </div>
  )
}
