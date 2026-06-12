# MedScale — Instrucciones de Rebrand y Actualización de Paleta para Agente

> **Contexto:** El producto cambia de nombre y marca de **"Myclinic"** a **"MedScale"**. Este documento describe todos los cambios de identidad visual, paleta de colores y layout que el agente debe implementar. Referencia visual: imágenes de branding y poster de dashboard proporcionadas.
>
> **Prioridad:** Estos cambios son de capa UI/CSS. No tocar lógica de negocio, queries ni schema de base de datos salvo donde se indique explícitamente.

---

## PARTE 1 — NUEVA IDENTIDAD DE MARCA

### 1.1 — Cambio de nombre: Myclinic → MedScale

Reemplazar en **todo el proyecto** todas las ocurrencias del nombre anterior:

| Buscar | Reemplazar con |
|---|---|
| `Myclinic` | `MedScale` |
| `myclinic` | `medscale` |
| `MYCLINIC` | `MEDSCALE` |
| `"Clínica SaaS"` (título HTML) | `"MedScale"` |
| `"Sistema de gestión para clínicas estéticas"` (meta description) | `"Software + Marketing para Clínicas Estéticas"` |

**Archivos clave a revisar:**
- `app/layout.tsx` — metadata title y description
- `public/` — cualquier archivo con nombre que referencie "myclinic"
- Componentes de navbar/header/sidebar donde aparezca el nombre
- `package.json` → campo `name` (opcional, solo cosmético)

### 1.2 — Tagline oficial

El tagline de la marca es:

```
SOFTWARE + MARKETING PARA CLÍNICAS ESTÉTICAS
```

Usar en: página de login, footer, metadata, y cualquier pantalla de onboarding.

Slogan secundario para uso en marketing/copy dentro de la app:

```
Tu clínica, potenciada.
```

---

### 1.3 — Logo

El nuevo logo de MedScale tiene dos elementos:

**Isotipo (ícono):** Monograma "M1" en azul navy oscuro con una línea diagonal plateada/cromada que lo atraviesa (evoca una aguja o bisturí — referencia directa al contexto de clínicas estéticas). Tiene efecto 3D/profundidad con sombra suave.

**Wordmark:** `Med` en serif oscuro (navy) + `Scale` en serif azul acero más claro. Ambas en la misma fuente tipográfica serif elegante.

**Variantes disponibles para usar:**
- Isotipo solo → para favicon, app icon, sidebar colapsado
- Isotipo + wordmark vertical → para pantalla de login y onboarding
- Isotipo + wordmark horizontal → para sidebar expandido
- Wordmark solo → para uso en documentos o exports

**Implementación en código:**

Hasta tener el SVG del logo disponible, usar el wordmark en texto con la tipografía correcta:

```tsx
// Componente Logo temporal en texto
<div className="flex items-center gap-1">
  <span className="font-serif text-xl font-bold text-[#1B2D45]">Med</span>
  <span className="font-serif text-xl font-bold text-[#7B9AB5]">Scale</span>
</div>
```

Cuando el SVG esté disponible, colocarlo en `public/logo.svg` y `public/logo-icon.svg` y referenciarlos con `<Image>` de Next.js.

---

## PARTE 2 — NUEVA PALETA DE COLORES

### 2.1 — Tokens de color del sistema MedScale

Extraídos de las imágenes de branding:

| Token | Nombre | Hex | Uso |
|---|---|---|---|
| `--color-navy` | Navy Primary | `#1B2D45` | Sidebar bg, textos principales, botón CTA |
| `--color-navy-light` | Navy Light | `#243552` | Sidebar hover, variante secundaria |
| `--color-steel` | Steel Blue | `#7B9AB5` | Wordmark "Scale", íconos secundarios, accents |
| `--color-steel-light` | Steel Light | `#A8C2D8` | Bordes suaves, estados hover en inputs |
| `--color-bg` | Background | `#F0F3F7` | Fondo general de la app (gris muy suave azulado) |
| `--color-surface` | Surface | `#FFFFFF` | Cards, modales, paneles |
| `--color-text-primary` | Text Primary | `#1B2D45` | Textos principales |
| `--color-text-secondary` | Text Secondary | `#6B7E94` | Labels, subtítulos, texto muted |
| `--color-border` | Border | `#D8E2ED` | Bordes de inputs, divisores |
| `--color-success` | Success | `#2D8A6E` | Estados activo, confirmado |
| `--color-warning` | Warning | `#D4900A` | Alertas, puntos de fidelidad |
| `--color-danger` | Danger | `#C94040` | Solo para eliminar/destructivo |

### 2.2 — Configuración en Tailwind (`tailwind.config.ts`)

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta MedScale
        navy: {
          DEFAULT: '#1B2D45',
          light: '#243552',
          muted: '#3A5068',
        },
        steel: {
          DEFAULT: '#7B9AB5',
          light: '#A8C2D8',
          muted: '#BDD0E0',
        },
        'ms-bg': '#F0F3F7',
        'ms-surface': '#FFFFFF',
        'ms-border': '#D8E2ED',
        'ms-text': '#1B2D45',
        'ms-muted': '#6B7E94',
      },
      fontFamily: {
        // Para el wordmark del logo (si se usa en texto)
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

### 2.3 — Variables CSS globales (`app/globals.css`)

```css
/* app/globals.css */
:root {
  /* Colores MedScale */
  --ms-navy: #1B2D45;
  --ms-navy-light: #243552;
  --ms-steel: #7B9AB5;
  --ms-steel-light: #A8C2D8;
  --ms-bg: #F0F3F7;
  --ms-surface: #FFFFFF;
  --ms-border: #D8E2ED;
  --ms-text: #1B2D45;
  --ms-muted: #6B7E94;

  /* Mapeo a variables de shadcn/ui */
  --background: 214 30% 95%;         /* ms-bg */
  --foreground: 214 45% 18%;         /* ms-navy */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 214 45% 18%;
  --primary: 214 45% 18%;            /* navy */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 30% 60%;          /* steel */
  --secondary-foreground: 214 45% 18%;
  --muted: 210 20% 90%;
  --muted-foreground: 210 20% 45%;
  --border: 210 25% 85%;
  --ring: 214 45% 18%;
  --radius: 0.5rem;

  /* Destructive — SOLO para eliminar */
  --destructive: 0 65% 51%;
  --destructive-foreground: 0 0% 100%;
}
```

### 2.4 — Tabla de reemplazo: Teal → Navy

Buscar y reemplazar en todos los componentes:

| Clase anterior (teal) | Clase nueva (navy) |
|---|---|
| `bg-teal-600` | `bg-navy` o `bg-[#1B2D45]` |
| `bg-teal-700` | `bg-navy-light` o `bg-[#243552]` |
| `hover:bg-teal-700` | `hover:bg-navy-light` |
| `text-teal-600` | `text-navy` |
| `border-teal-600` | `border-navy` |
| `bg-teal-50` | `bg-steel-muted/20` |
| `text-teal-700` | `text-navy` |
| `ring-teal-500` | `ring-navy` |
| Underline activo teal en tabs | Underline `border-[#1B2D45]` |

**Nota importante:** El color de acento secundario (steel blue `#7B9AB5`) se usa para:
- El label "Scale" en el wordmark
- Íconos decorativos secundarios
- Badges de estado neutros
- NO para botones CTA (esos siguen siendo navy)

---

## PARTE 3 — CAMBIO DE LAYOUT: TOP NAV → SIDEBAR

Este es el cambio más significativo. El diseño de referencia (poster de MedScale) muestra una **sidebar de navegación lateral izquierda** de fondo navy oscuro, en lugar del top navigation horizontal actual.

### 3.1 — Estructura del nuevo layout

```
┌─────────────────────────────────────────────────────┐
│  [Sidebar navy]  │  [Header blanco/light]            │
│                  │  [Buscar...] [Notif] [Nueva Cita] │
│  🏷 MedScale    ├────────────────────────────────────│
│                  │                                    │
│  📊 Dashboard   │   CONTENIDO PRINCIPAL              │
│  👥 Pacientes   │                                    │
│  📅 Reservas    │                                    │
│  ⚙️ Servicios   │                                    │
│  🎁 Fidelidad   │                                    │
│  📈 Reportes    │                                    │
│  ⚙️ Config      │                                    │
│                  │                                    │
│  ─────────────  │                                    │
│  👤 Camila      │                                    │
│     Mi Perfil ˅ │                                    │
└─────────────────────────────────────────────────────┘
```

### 3.2 — Componente Sidebar

```tsx
// components/layout/Sidebar.tsx

const navItems = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pacientes',     icon: Users,            label: 'Pacientes' },
  { href: '/reservas',      icon: Calendar,         label: 'Reservas' },
  { href: '/servicios',     icon: Sparkles,         label: 'Servicios' },
  { href: '/fidelidad',     icon: Gift,             label: 'Fidelidad' },
  { href: '/reportes',      icon: BarChart2,         label: 'Reportes' },
  { href: '/configuracion', icon: Settings,          label: 'Configuración' },
]

// Clases del sidebar container:
// className="w-56 min-h-screen bg-[#1B2D45] flex flex-col"

// Clases de ítem de nav activo:
// className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium"

// Clases de ítem de nav inactivo:
// className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/60 hover:bg-white/8 hover:text-white transition-colors"

// Logo en top del sidebar:
// className="px-4 py-6 border-b border-white/10"

// Usuario en bottom del sidebar:
// className="px-4 py-4 border-t border-white/10 mt-auto"
```

### 3.3 — Layout root

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F0F3F7]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3.4 — Header simplificado (ya no contiene nav)

El header en el nuevo diseño contiene solo:
- Barra de búsqueda (centrada o a la izquierda)
- Ícono de notificaciones
- Botón `+ Nueva Cita` (navy, no rojo)

```tsx
// Clases del header:
// className="h-16 bg-white border-b border-[#D8E2ED] flex items-center px-6 gap-4"

// Botón Nueva Cita:
// <Button className="bg-[#1B2D45] hover:bg-[#243552] text-white">
//   <Plus className="w-4 h-4 mr-2" /> Nueva Cita
// </Button>
```

### 3.5 — Nota sobre ítem "Reportes"

El poster de MedScale muestra **"Reportes"** como ítem de menú (antes no existía en el nav). Agregar la ruta `/reportes` aunque sea una página placeholder por ahora:

```tsx
// app/(dashboard)/reportes/page.tsx
export default function ReportesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-ms-muted">
      <BarChart2 className="w-12 h-12 opacity-30" />
      <p className="text-lg font-medium">Reportes — Próximamente</p>
      <p className="text-sm">Estadísticas y métricas de tu clínica en desarrollo.</p>
    </div>
  )
}
```

---

## PARTE 4 — ACTUALIZACIÓN DE COMPONENTES ESPECÍFICOS

### 4.1 — KPI Cards del Dashboard

En el diseño de referencia, las cards KPI mantienen su estructura pero con el nuevo esquema de color:

```tsx
// Card KPI — ajuste de estilo
<div className="bg-white rounded-xl border border-[#D8E2ED] p-5 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-lg bg-[#F0F3F7]">
      <Icon className="w-5 h-5 text-[#7B9AB5]" />
    </div>
    <div>
      <p className="text-xs text-[#6B7E94] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold text-[#1B2D45] mt-0.5">
        {value}
      </p>
    </div>
  </div>
</div>
```

### 4.2 — Citas en el panel del Dashboard

En el diseño de referencia, la cita de JORGE CEBALLOS se muestra con:
- Avatar circular con inicial del nombre (fondo steel blue claro)
- Nombre del paciente + tipo de servicio
- Hora y duración a la derecha
- Link "Ver" en navy

```tsx
<div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F0F3F7] transition-colors">
  <div className="w-8 h-8 rounded-full bg-[#A8C2D8] flex items-center justify-center text-white text-sm font-semibold">
    {patient.name[0]}
  </div>
  <div className="flex-1">
    <p className="font-semibold text-[#1B2D45] text-sm">{patient.name}</p>
    <p className="text-xs text-[#6B7E94]">{service.name}</p>
  </div>
  <div className="text-right">
    <p className="font-semibold text-[#1B2D45] text-sm">{time}</p>
    <p className="text-xs text-[#6B7E94]">{duration} min</p>
  </div>
  <Button variant="ghost" size="sm" className="text-[#1B2D45] font-medium">Ver</Button>
</div>
```

### 4.3 — Accesos Rápidos del Dashboard

En el diseño de referencia, los accesos rápidos tienen flechas `>` a la derecha:

```tsx
<div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#F0F3F7] transition-colors group">
  <div className="p-1.5 rounded-md bg-[#F0F3F7] group-hover:bg-[#D8E2ED]">
    <Icon className="w-4 h-4 text-[#7B9AB5]" />
  </div>
  <div className="flex-1">
    <p className="text-sm font-medium text-[#1B2D45]">{title}</p>
    <p className="text-xs text-[#6B7E94]">{subtitle}</p>
  </div>
  <ChevronRight className="w-4 h-4 text-[#6B7E94] group-hover:text-[#1B2D45] transition-colors" />
</div>
```

### 4.4 — Header de ficha de paciente

La franja teal actual del header de paciente debe cambiar a navy:

```tsx
// Antes: bg-teal-600 o similar
// Después:
className="bg-[#1B2D45] text-white px-6 py-5"

// Avatar del paciente:
className="w-14 h-14 rounded-full bg-[#7B9AB5] text-white text-xl font-bold flex items-center justify-center border-2 border-white/30"
```

### 4.5 — Badges de estado en servicios / citas

| Estado | Clase actual | Clase nueva |
|---|---|---|
| Activo | `bg-green-100 text-green-800` | Mantener ✅ |
| Inactivo | `bg-gray-100 text-gray-600` | Mantener ✅ |
| Pendiente | — | `bg-blue-50 text-blue-700 border border-blue-200` |
| Confirmado | — | `bg-emerald-50 text-emerald-700 border border-emerald-200` |
| Cancelado | — | `bg-red-50 text-red-600 border border-red-200` |
| No Asistió | — | `bg-orange-50 text-orange-700 border border-orange-200` |

---

## PARTE 5 — TIPOGRAFÍA

### 5.1 — Fuentes recomendadas

Basado en el estilo del wordmark MedScale (serif elegante + sans-serif limpio):

```bash
# Instalar fuentes via next/font
```

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import { Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700'],
})

// Agregar ambas variables al <html>:
// className={`${inter.variable} ${playfair.variable}`}
```

**Uso:**
- `font-sans` (Inter) → toda la UI, labels, tablas, formularios
- `font-serif` (Playfair Display) → solo para el wordmark del logo y títulos de landing/marketing

---

## PARTE 6 — FAVICON E ÍCONOS DE APP

### 6.1 — Actualizar favicon

```
public/
├── favicon.ico          → isotipo M1 (16x16 y 32x32)
├── favicon-32x32.png    → isotipo M1
├── apple-touch-icon.png → isotipo M1 con fondo navy (#1B2D45)
├── logo.svg             → isotipo + wordmark horizontal
└── logo-icon.svg        → isotipo solo
```

### 6.2 — Metadata en layout

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | MedScale',
    default: 'MedScale — Software para Clínicas Estéticas',
  },
  description: 'Software + Marketing para Clínicas Estéticas. Gestiona pacientes, citas y fidelidad desde un solo lugar.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

---

## RESUMEN — ORDEN DE EJECUCIÓN RECOMENDADO

El agente debe ejecutar en este orden para minimizar conflictos:

```
1. Actualizar tailwind.config.ts con nueva paleta de colores
2. Actualizar app/globals.css con variables CSS
3. Crear/actualizar componente Sidebar con diseño navy
4. Actualizar app/(dashboard)/layout.tsx para incluir Sidebar
5. Eliminar navegación horizontal del Header (dejar solo search + notif + CTA)
6. Reemplazar todas las clases teal → navy en componentes existentes
7. Actualizar header de ficha de paciente (teal → navy)
8. Actualizar botones CTA (teal → navy, rojo → navy donde corresponda)
9. Reemplazar texto/logo "Myclinic" → "MedScale" en toda la app
10. Actualizar metadata (title, description) en layout.tsx
11. Crear página placeholder /reportes
12. Actualizar favicon y assets públicos cuando el SVG esté disponible
```

---

## NOTAS PARA EL AGENTE

- **No cambiar** la lógica de autenticación, queries de Supabase, ni el schema de base de datos.
- Si algún componente usa el color teal como variable de shadcn/ui (`bg-primary`), actualizar la variable `--primary` en globals.css es suficiente para que todos los componentes hereden el cambio.
- El cambio de top-nav a sidebar afecta el layout root. Asegurarse de que las rutas protegidas siguen funcionando con el nuevo layout.
- El isotipo M1 del logo tiene una línea diagonal plateada que evoca una aguja o bisturí — este elemento debe preservarse fielmente en el SVG cuando esté disponible. No simplificar.
- La paleta silver/chrome del logo es decorativa y **no** debe usarse como color de UI interactivo.
