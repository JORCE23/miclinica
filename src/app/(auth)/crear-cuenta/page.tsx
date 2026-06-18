import { SignupForm } from "@/components/auth/SignupForm"
import { ShieldCheck, CalendarHeart, Sparkles, TrendingUp, Users, Star } from "lucide-react"

export const metadata = { title: "Crear cuenta | Medique" }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panel de marca (izquierda, solo desktop) */}
      <div className="hidden lg:flex lg:w-[55%] bg-brand-panel text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand/25 blur-3xl animate-float" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-steel/15 blur-3xl animate-float-slow" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <img src="/logo3.png" alt="Medique" className="w-[210px] h-auto object-contain" />

          <div className="space-y-9 max-w-lg">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full glass-panel px-3.5 py-1.5 text-xs font-medium text-brand-light">
                <Sparkles className="h-3.5 w-3.5" /> Empieza en 1 minuto
              </span>
              <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.1]">
                Crea tu clínica y gestiónala como <span className="text-gradient-brand">profesional</span>.
              </h1>
              <p className="text-white/55 text-base leading-relaxed">
                Pacientes, agenda online, fidelidad, inventario, caja y marketing — todo listo desde el primer día.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Pacientes</span>
                </div>
                <p className="text-2xl font-bold">1,248</p>
                <p className="text-[11px] text-brand-light flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> +12% este mes</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Star className="h-4 w-4" />
                  <span className="text-[11px] uppercase tracking-wide text-white/50 font-semibold">Fidelidad</span>
                </div>
                <p className="text-2xl font-bold">96%</p>
                <p className="text-[11px] text-brand-light flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3" /> Retención</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                { icon: CalendarHeart, text: "Agenda y reservas online" },
                { icon: Sparkles, text: "Fidelidad y marketing integrados" },
                { icon: ShieldCheck, text: "Datos clínicos seguros y protegidos" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl glass-panel flex items-center justify-center">
                    <f.icon className="h-4 w-4 text-brand-light" />
                  </div>
                  <span className="text-sm text-white/75">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/35">Software + Marketing para Clínicas Estéticas</p>
        </div>
      </div>

      {/* Formulario (derecha) */}
      <div className="flex w-full lg:w-[45%] flex-col items-center justify-center bg-app p-6 sm:p-10 relative">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
        <div className="w-full max-w-md space-y-7 relative">
          <div className="text-center flex flex-col items-center">
            <img src="/logo-medique-simbolo.png" alt="Medique Logo" className="h-20 w-auto max-w-full object-contain mb-5 lg:hidden" />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">Crea tu clínica</h2>
            <p className="text-muted-foreground text-sm mt-2">Regístrate gratis y empieza a gestionar hoy.</p>
          </div>
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-brand font-medium hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  )
}
