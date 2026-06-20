import Link from "next/link"
import type { ReactNode } from "react"
import { MarketingNav } from "@/components/marketing/MarketingNav"

/**
 * Layout del sitio público (marketing). Nav superior + footer.
 * Las páginas que cuelgan de aquí son públicas (sin auth ni chrome de admin).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNav />

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card">
        <div className="mx-auto max-w-6xl px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-medique-simbolo.png" alt="" className="h-7 w-7 object-contain" />
              <span className="font-display text-xl font-semibold text-brand-dark">Medique</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">El sistema para tu clínica: agenda, pacientes, reservas online y marketing, todo en un solo lugar.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-3">Producto</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/#funciones" className="hover:text-foreground">Funciones</Link></li>
              <li><Link href="/planes" className="hover:text-foreground">Planes y precios</Link></li>
              <li><Link href="/estetica" className="hover:text-foreground">Para estética</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-3">Empresa</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/#verticales" className="hover:text-foreground">Para tu clínica</Link></li>
              <li><Link href="/crear-cuenta" className="hover:text-foreground">Prueba gratis</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Iniciar sesión</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-3">Empezar</p>
            <Link href="/crear-cuenta" className="inline-flex h-9 items-center px-4 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dark transition-colors">
              Crear mi cuenta
            </Link>
          </div>
        </div>
        <div className="border-t border-border/70">
          <div className="mx-auto max-w-6xl px-5 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Medique. Todos los derechos reservados.</p>
            <p>Hecho en Chile 🇨🇱</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
