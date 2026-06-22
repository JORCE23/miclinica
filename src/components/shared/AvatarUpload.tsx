"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Avatar } from "./Avatar"

/**
 * Selector + subida de foto de perfil. Sube al bucket `clinical_photos`
 * bajo `avatars/<folder>/...` y devuelve la URL pública por `onChange`.
 * Si no hay foto, muestra las iniciales (Avatar por defecto).
 */
export function AvatarUpload({
  value, onChange, name, folder = "general", size = 88,
}: {
  value?: string | null
  onChange: (url: string) => void
  name?: string | null
  folder?: string
  size?: number
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("Selecciona una imagen"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5 MB"); return }
    setLoading(true)
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase()
      const path = `avatars/${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
      const { error } = await supabase.storage.from("clinical_photos").upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("clinical_photos").getPublicUrl(path)
      onChange(publicUrl)
    } catch {
      toast.error("No se pudo subir la foto (revisa tu conexión).")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Avatar src={value} name={name} size={size} rounded="full" className="ring-2 ring-border" />
        {loading && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center shadow-soft hover:bg-brand-dark disabled:opacity-60"
          aria-label="Subir foto"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <div className="text-sm">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="font-medium text-brand hover:underline disabled:opacity-60">
          {value ? "Cambiar foto" : "Subir foto"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="ml-3 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Quitar
          </button>
        )}
        <p className="text-xs text-muted-foreground mt-1">JPG o PNG · máx 5 MB</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  )
}
