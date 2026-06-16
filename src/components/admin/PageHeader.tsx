import * as React from "react"

type IconType = React.ComponentType<{ className?: string }>

/**
 * Encabezado de página premium reutilizable.
 * Panel navy con gradiente, título en serif, icono opcional en glass y slot de acciones.
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
    <div className={`page-header mb-6 ${className}`}>
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="hidden sm:flex h-12 w-12 rounded-2xl glass-panel items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-brand-light" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-white">
              {title}
            </h1>
            {description && (
              <p className="text-white/55 text-sm mt-1 max-w-xl">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">{children}</div>
        )}
      </div>
    </div>
  )
}
