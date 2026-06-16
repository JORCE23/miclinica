import { LoginForm } from "@/components/auth/LoginForm"
import { ShieldCheck, CalendarHeart, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panel de marca (izquierda, solo desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-panel text-white relative overflow-hidden">
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-steel/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <img src="/logo3.png" alt="Medique" className="w-[200px] h-auto object-contain" />

          <div className="space-y-8 max-w-md">
            <h1 className="font-display text-4xl xl:text-5xl font-semibold leading-tight">
              Gestiona tu clínica estética con <span className="text-gradient-brand">elegancia</span>.
            </h1>
            <p className="text-white/55 text-base leading-relaxed">
              Pacientes, reservas, fidelidad y marketing — todo en un solo lugar, diseñado para clínicas que cuidan cada detalle.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { icon: CalendarHeart, text: "Agenda y reservas inteligentes" },
                { icon: Sparkles,      text: "Programa de fidelidad y marketing" },
                { icon: ShieldCheck,   text: "Datos clínicos seguros y protegidos" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
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
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-app p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center flex flex-col items-center">
            <img src="/logo-medique-simbolo.png" alt="Medique Logo" className="h-20 w-auto max-w-full object-contain mb-5 lg:hidden" />

            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              Bienvenido de nuevo
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
