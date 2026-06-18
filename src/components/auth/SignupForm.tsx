"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SignupForm() {
  const [form, setForm] = useState({ clinic_name: "", full_name: "", email: "", password: "", phone: "" })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("No se pudo crear la cuenta", { description: data?.error })
        setLoading(false)
        return
      }
      // Iniciar sesión automáticamente
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) {
        toast.success("Cuenta creada", { description: "Ahora inicia sesión." })
        window.location.href = "/login"
        return
      }
      toast.success("¡Bienvenido! Tu clínica está lista 🎉")
      window.location.href = "/" // el middleware redirige al panel
    } catch {
      toast.error("Error inesperado", { description: "Intenta de nuevo." })
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-card">
      <CardContent className="pt-6 sm:p-7">
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinic_name">Nombre de la clínica</Label>
            <Input id="clinic_name" placeholder="Clínica Estética Bella" value={form.clinic_name} onChange={(e) => set("clinic_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Tu nombre</Label>
            <Input id="full_name" placeholder="Dra. María Pérez" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" placeholder="tu@clinica.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="+56 9 1234 5678" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
          </div>
          <Button type="submit" className="w-full h-11 bg-brand text-white hover:bg-brand-dark shadow-glow" disabled={loading}>
            {loading ? "Creando tu clínica..." : "Crear mi clínica"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
