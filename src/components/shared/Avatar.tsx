import { cn } from "@/lib/utils"

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ""
  const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (a + b).toUpperCase() || "?"
}

/**
 * Avatar reutilizable: muestra la foto si existe (`src`), o las iniciales
 * del nombre sobre el color de marca como imagen por defecto.
 */
export function Avatar({
  src, name, size = 40, rounded = "full", className,
}: {
  src?: string | null
  name?: string | null
  size?: number
  rounded?: "full" | "xl"
  className?: string
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl"

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Avatar"}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={cn(radius, "object-cover bg-muted shrink-0", className)}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) }}
      className={cn(radius, "shrink-0 flex items-center justify-center bg-brand/10 text-brand font-semibold select-none", className)}
      aria-label={name || "Avatar"}
    >
      {initials(name)}
    </div>
  )
}
