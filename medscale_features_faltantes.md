# MedScale — Funcionalidades Faltantes y Plan de Construcción
> **Basado en:** Master Document v1, Manual de Branding y Estructura de Precios.
> **Análisis del codebase:** Se revisó el proyecto completo. Este documento lista ÚNICAMENTE lo que falta o debe mejorarse respecto a los documentos de producto. No duplica lo ya cubierto en los archivos de rebrand.

---

## PARTE 1 — CAMBIOS DE BASE DE DATOS (SQL)

Ejecutar en Supabase SQL Editor en este orden.

### 1.1 — Tabla `professionals` (nueva)

```sql
-- Profesionales / Staff de la clínica
CREATE TABLE professionals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) NOT NULL,
  full_name   TEXT NOT NULL,
  specialty   TEXT,           -- "Médico Estético", "Enfermera", "Técnico", etc.
  email       TEXT,
  phone       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_professionals" ON professionals
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
```

### 1.2 — Agregar `professional_id` a `appointments`

```sql
ALTER TABLE appointments
  ADD COLUMN professional_id UUID REFERENCES professionals(id);
```

### 1.3 — Agregar `source` y `tags` a `profiles`

```sql
ALTER TABLE profiles
  ADD COLUMN source TEXT CHECK (source IN (
    'meta_ads', 'google', 'referido', 'organico', 'directo', 'whatsapp', 'otro'
  )),
  ADD COLUMN tags TEXT[] DEFAULT '{}';
```

### 1.4 — Agregar fotos e imagen a `aesthetic_procedures_history`

```sql
ALTER TABLE aesthetic_procedures_history
  ADD COLUMN before_image_url TEXT,
  ADD COLUMN after_image_url  TEXT,
  ADD COLUMN facial_diagram_data JSONB;
```

### 1.5 — Tabla `campaigns` (nueva — módulo Marketing)

```sql
CREATE TABLE campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID REFERENCES clinics(id) NOT NULL,
  name             TEXT NOT NULL,
  channel          TEXT CHECK (channel IN ('meta', 'google', 'organico', 'email', 'whatsapp', 'otro')) NOT NULL,
  status           TEXT CHECK (status IN ('activa', 'pausada', 'finalizada')) DEFAULT 'activa',
  start_date       DATE,
  end_date         DATE,
  budget           DECIMAL(10,2),        -- presupuesto total
  spent            DECIMAL(10,2) DEFAULT 0, -- gasto real
  leads_generated  INTEGER DEFAULT 0,
  appointments_gen INTEGER DEFAULT 0,    -- citas generadas
  sales_generated  DECIMAL(10,2) DEFAULT 0,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_campaigns" ON campaigns
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
```

### 1.6 — Agregar `campaign_id` y `source` a `appointments`

```sql
ALTER TABLE appointments
  ADD COLUMN campaign_id UUID REFERENCES campaigns(id);
```

---

## PARTE 2 — ACTUALIZACIÓN DE TIPOS TypeScript

**Archivo:** `src/types/index.ts`

Agregar al tipo `Appointment`:
```ts
professional_id?: string;
campaign_id?: string;
// joins
professional?: Professional;
```

Agregar al tipo `Profile` (paciente):
```ts
source?: 'meta_ads' | 'google' | 'referido' | 'organico' | 'directo' | 'whatsapp' | 'otro';
tags?: string[];
```

Agregar tipos nuevos:
```ts
export interface Professional {
  id: string;
  clinic_id: string;
  full_name: string;
  specialty?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  clinic_id: string;
  name: string;
  channel: 'meta' | 'google' | 'organico' | 'email' | 'whatsapp' | 'otro';
  status: 'activa' | 'pausada' | 'finalizada';
  start_date?: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  leads_generated: number;
  appointments_gen: number;
  sales_generated?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  notes?: string;
  created_at: string;
  // calculados
  cpl?: number;   // cost per lead
  cpa?: number;   // cost per appointment
  roi?: number;   // return on investment
}
```

---

## PARTE 3 — MÓDULO: PROFESIONALES

**Descripción:** Gestión del equipo de la clínica. Esencial para asignar profesional a cada cita.

### 3.1 — Rutas a crear

```
src/app/admin/professionals/page.tsx          → Lista de profesionales
src/app/admin/professionals/new/page.tsx      → Crear profesional
src/app/admin/professionals/[id]/page.tsx     → Editar profesional
src/app/api/professionals/route.ts            → GET (lista) + POST (crear)
src/app/api/professionals/[id]/route.ts       → GET + PUT + DELETE
src/components/admin/professionals/ProfessionalList.tsx
src/components/admin/professionals/ProfessionalForm.tsx
```

### 3.2 — Schema del formulario

```ts
// src/lib/validations/professional.ts
export const professionalSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  specialty: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
})
```

### 3.3 — Agregar al sidebar

Agregar item "Equipo" en `AdminSidebar.tsx`:
```ts
{ label: "Equipo", icon: UserCheck, href: "/admin/professionals" },
```
Posición: entre "Servicios" y "Fidelidad".

### 3.4 — API GET `/api/professionals`

```ts
// Filtrar por clinic_id del usuario autenticado
// Retornar: id, full_name, specialty, email, phone, is_active
// Ordenar por full_name ASC
```

---

## PARTE 4 — MEJORA: CAMPO PROFESIONAL EN CITAS

Una vez creado el módulo de profesionales, actualizar los formularios de citas.

### 4.1 — `AppointmentForm.tsx`

Agregar campo `Profesional *` entre `Servicio` y `Fecha y Hora`:

```tsx
// Hook para cargar profesionales
const { data: professionals } = useQuery({
  queryKey: ['professionals'],
  queryFn: async () => {
    const res = await fetch('/api/professionals')
    return res.json()
  }
})

// Campo en el formulario
<div className="space-y-2">
  <Label>Profesional</Label>
  <Controller
    name="professional_id"
    control={control}
    render={({ field }) => (
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar profesional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Sin asignar</SelectItem>
          {professionals?.map((p: Professional) => (
            <SelectItem key={p.id} value={p.id}>
              {p.full_name}{p.specialty ? ` — ${p.specialty}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
</div>
```

### 4.2 — `appointmentSchema` en validations

Agregar campo:
```ts
professional_id: z.string().uuid().optional().nullable(),
```

### 4.3 — API de appointments

Actualizar `POST /api/appointments` y `PUT /api/appointments/[id]` para incluir `professional_id` al insertar/actualizar en Supabase.

### 4.4 — Mostrar profesional en PatientAppointmentsTab

En el listado de atenciones del paciente, reemplazar `"Sin asignar"` por el nombre real:
```tsx
// En el join de appointments, incluir professional
const { data } = await supabase
  .from('appointments')
  .select(`
    ...,
    professional:professionals!professional_id(full_name, specialty)
  `)

// Display
<span>{apt.professional?.full_name || 'Sin asignar'}</span>
```

---

## PARTE 5 — MEJORA: FUENTE DE CAPTACIÓN EN PACIENTES

### 5.1 — `PatientForm.tsx` — Agregar campo Source

Agregar al formulario de nuevo/editar paciente:

```tsx
const sourceOptions = [
  { value: 'meta_ads',  label: 'Meta Ads (Instagram/Facebook)' },
  { value: 'google',    label: 'Google' },
  { value: 'referido',  label: 'Referido por otro paciente' },
  { value: 'organico',  label: 'Redes sociales orgánico' },
  { value: 'directo',   label: 'Visita directa / llamada' },
  { value: 'whatsapp',  label: 'WhatsApp' },
  { value: 'otro',      label: 'Otro' },
]

<div className="space-y-2">
  <Label>Fuente de captación</Label>
  <Controller name="source" control={control} render={({ field }) => (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger>
        <SelectValue placeholder="¿Cómo nos encontró?" />
      </SelectTrigger>
      <SelectContent>
        {sourceOptions.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )} />
</div>
```

### 5.2 — `patientSchema`

```ts
source: z.enum(['meta_ads', 'google', 'referido', 'organico', 'directo', 'whatsapp', 'otro']).optional(),
```

### 5.3 — Mostrar en `PersonalTab.tsx`

Agregar badge de fuente en los datos administrativos del paciente:
```tsx
{patient.source && (
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fuente</span>
    <span className="text-xs px-2 py-0.5 rounded-full bg-[#6E8CA6]/15 text-[#1C2838] font-medium border border-[#6E8CA6]/20">
      {sourceLabels[patient.source]}
    </span>
  </div>
)}
```

---

## PARTE 6 — MEJORA: DASHBOARD CON GRÁFICOS E INGRESOS

El dashboard actual solo tiene 4 KPI cards sin gráficos. El Master Document especifica:
- KPI de Ingresos del Mes
- Gráfico de ingresos por semana (área)
- Distribución de fuentes de pacientes (donut)
- Retention rate

### 6.1 — Nuevo KPI: Ingresos del Mes

**API:** Agregar a `GET /api/dashboard/route.ts`:

```ts
// Ingresos del mes (citas completadas con precio)
const { data: completedAppointments } = await supabase
  .from('appointments')
  .select('price')
  .eq('clinic_id', clinicId)
  .eq('status', 'completada')
  .gte('scheduled_at', startOfMonth)

const monthlyRevenue = completedAppointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0

// Tasa de retención: pacientes con 2+ citas / total pacientes
const { data: returningPatients } = await supabase.rpc('get_returning_patients_count', {
  p_clinic_id: clinicId,
  p_start: startOfMonth
})
```

**Stat card adicional en `DashboardStats.tsx`:**
```ts
{
  title: "Ingresos del Mes",
  value: formatCurrency(stats.monthlyRevenue),
  icon: DollarSign,
  color: "text-emerald-600",
  bgLight: "bg-emerald-50",
  description: "Citas completadas",
}
```

### 6.2 — Gráfico de Ingresos Semanales

Usar `recharts` (ya instalado):

```tsx
// src/components/admin/charts/RevenueChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Datos: agrupar appointments.price por semana del mes
// Colores del brand: stroke="#6E8CA6", fill="#6E8CA6" con opacity 20%
// El agente debe crear un endpoint GET /api/dashboard/revenue-chart
// que retorne [{week: "Sem 1", ingresos: 450000}, ...]
```

### 6.3 — Gráfico de Fuentes de Pacientes (Donut)

```tsx
// src/components/admin/charts/SourcesChart.tsx
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

// Datos: contar profiles agrupados por source
// GET /api/dashboard/sources-chart → [{name: 'Meta Ads', value: 12}, ...]
// Paleta: ['#121A26', '#6E8CA6', '#8AA4BC', '#A4B6C6', '#31363E', '#8B9197']
```

### 6.4 — Posición de los gráficos en el Dashboard

Reemplazar en `DashboardStats.tsx` la sección de "Citas y Accesos" por:
```
Fila 1: 4 KPI Cards (Pacientes, Citas Hoy, Nuevos, Ingresos Mes)
Fila 2: RevenueChart (2/3 ancho) + SourcesChart (1/3 ancho)
Fila 3: Próximas Citas del día (2/3) + Accesos Rápidos (1/3)
```

---

## PARTE 7 — MÓDULO: MARKETING / CAMPAÑAS

**Descripción:** Tracking de campañas de Meta Ads, Google y otros canales. Permite medir CPL, CPA y ROI por campaña.

### 7.1 — Rutas a crear

```
src/app/admin/marketing/page.tsx           → Lista de campañas con métricas
src/app/admin/marketing/new/page.tsx       → Crear campaña
src/app/admin/marketing/[id]/page.tsx      → Detalle y edición de campaña
src/app/api/campaigns/route.ts             → GET + POST
src/app/api/campaigns/[id]/route.ts        → GET + PUT + DELETE
src/components/admin/marketing/CampaignList.tsx
src/components/admin/marketing/CampaignForm.tsx
src/components/admin/marketing/CampaignMetrics.tsx
```

### 7.2 — Listado de campañas (columnas de la tabla)

| Columna | Fuente |
|---|---|
| Nombre | `campaigns.name` |
| Canal | Badge con ícono (Meta, Google, etc.) |
| Estado | Chip: Activa (verde) / Pausada (ámbar) / Finalizada (gris) |
| Leads | `campaigns.leads_generated` |
| Citas | `campaigns.appointments_gen` |
| CPL | `budget / leads_generated` — calculado |
| ROI | `(sales_generated - spent) / spent × 100` — calculado |
| Acciones | Editar / Archivar |

### 7.3 — Schema del formulario

```ts
// src/lib/validations/campaign.ts
export const campaignSchema = z.object({
  name:        z.string().min(2),
  channel:     z.enum(['meta', 'google', 'organico', 'email', 'whatsapp', 'otro']),
  status:      z.enum(['activa', 'pausada', 'finalizada']).default('activa'),
  start_date:  z.string().optional(),
  end_date:    z.string().optional(),
  budget:      z.coerce.number().min(0).optional(),
  spent:       z.coerce.number().min(0).optional(),
  leads_generated:  z.coerce.number().min(0).default(0),
  appointments_gen: z.coerce.number().min(0).default(0),
  sales_generated:  z.coerce.number().min(0).optional(),
  utm_source:  z.string().optional(),
  utm_medium:  z.string().optional(),
  utm_campaign: z.string().optional(),
  notes:       z.string().optional(),
})
```

### 7.4 — Agregar al sidebar

```ts
{ label: "Marketing", icon: Megaphone, href: "/admin/marketing" },
```
Posición: entre "Fidelidad" y "Reportes".

---

## PARTE 8 — MÓDULO: REPORTES (contenido real)

La página `/admin/reports` es un placeholder. Debe mostrar métricas reales exportables.

### 8.1 — Rutas/archivos a crear

```
src/app/admin/reports/page.tsx              → Reemplazar placeholder con contenido
src/app/api/reports/monthly/route.ts        → GET — datos del reporte mensual
src/components/admin/reports/MonthlyReport.tsx
src/components/admin/reports/ReportExport.tsx
```

### 8.2 — Contenido del reporte mensual

```tsx
// Secciones del reporte (todas con datos reales del mes seleccionado):
// 1. KPIs resumen: ingresos, citas totales, asistencia, ticket promedio
// 2. Top 5 servicios por ingresos
// 3. Top 5 profesionales por citas realizadas
// 4. Fuentes de pacientes nuevos (tabla)
// 5. Tasa de retención (pacientes que volvieron)
// 6. No-shows y cancelaciones
```

### 8.3 — Selector de período

```tsx
// Dropdown mes/año en el header de la página
// Default: mes anterior
// Opciones: últimos 6 meses
```

### 8.4 — Exportar PDF/Excel

Implementar botón de exportación. Usar:
- `jsPDF` + `html2canvas` para PDF (o la librería preferida del agente)
- `xlsx` (SheetJS — ya está en las dependencias) para Excel

```tsx
<Button onClick={exportToExcel} variant="outline">
  Exportar Excel
</Button>
<Button onClick={exportToPDF} className="bg-primary text-white">
  Exportar PDF
</Button>
```

---

## PARTE 9 — MÓDULO: AUTOMATIZACIONES (configuración)

El Master Document especifica: recordatorio -24h, follow-up post-cita, reactivación de inactivos.  
**Scope MVP:** Solo la interfaz de configuración. La ejecución real (envío de emails/WhatsApp) es v2.

### 9.1 — Rutas a crear

```
src/app/admin/automations/page.tsx          → Lista de automatizaciones configuradas
src/app/api/automations/route.ts            → GET + POST
src/components/admin/automations/AutomationList.tsx
src/components/admin/automations/AutomationToggle.tsx
```

### 9.2 — Automatizaciones predefinidas (MVP)

En lugar de builder libre, mostrar 3 automatizaciones predefinidas con toggle on/off:

```tsx
const defaultAutomations = [
  {
    id: 'reminder_24h',
    name: 'Recordatorio -24h',
    description: 'Envía un recordatorio al paciente 24 horas antes de su cita.',
    trigger: 'cita_programada',
    delay_hours: -24,
    channel: 'email',
    is_active: false,
  },
  {
    id: 'followup_post_cita',
    name: 'Seguimiento post-cita',
    description: 'Envía un mensaje de seguimiento 48 horas después de la cita.',
    trigger: 'post_cita',
    delay_hours: 48,
    channel: 'email',
    is_active: false,
  },
  {
    id: 'reactivacion_inactivo',
    name: 'Reactivación de pacientes inactivos',
    description: 'Contacta pacientes que no han agendado en los últimos 90 días.',
    trigger: 'inactivo_90d',
    delay_hours: 0,
    channel: 'email',
    is_active: false,
  },
]
```

### 9.3 — Tabla en Supabase

```sql
CREATE TABLE automations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID REFERENCES clinics(id) NOT NULL,
  trigger_type TEXT CHECK (trigger_type IN ('cita_programada', 'post_cita', 'inactivo_90d', 'cumpleanos')) NOT NULL,
  channel      TEXT CHECK (channel IN ('email', 'whatsapp')) DEFAULT 'email',
  delay_hours  INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT false,
  template_id  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_automations" ON automations
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
```

### 9.4 — Agregar al sidebar

```ts
{ label: "Automatizaciones", icon: Zap, href: "/admin/automations" },
```
Posición: entre "Marketing" y "Reportes".

---

## PARTE 10 — TIPOGRAFÍA: Cormorant Garamond + Jost

El Manual de Branding especifica:
- **Cormorant Garamond** — Titulares, hero, nombres de sección
- **Jost** — Navegación, botones, badges, UI, datos

### 10.1 — Actualizar `app/layout.tsx`

```tsx
// Reemplazar Plus_Jakarta_Sans por:
import { Jost } from 'next/font/google'
import { Cormorant_Garamond } from 'next/font/google'

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
  weight: ['400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600'],
})

// En el <html>:
className={`${jost.variable} ${cormorant.variable}`}
```

### 10.2 — Actualizar `tailwind.config.ts`

```ts
fontFamily: {
  sans:    ['var(--font-jost)', 'system-ui', 'sans-serif'],
  display: ['var(--font-cormorant)', 'Georgia', 'serif'],
},
```

### 10.3 — Uso en componentes

```tsx
// Títulos de página principal (H1)
<h1 className="font-display text-3xl font-semibold text-[#121A26]">
  Resumen de Clínica
</h1>

// Todo lo demás (labels, botones, tablas, nav)
// Ya usa font-sans por defecto al cambiar la variable CSS
```

---

## PARTE 11 — DESIGN TOKENS: Tablas y Status Chips

### 11.1 — Headers de tabla (Manual de Branding p.10)

El brand manual especifica: `Header: fondo Ink (#121A26), texto blanco, Jost 12px/600`

Actualizar `src/components/ui/table.tsx` o agregar clase helper:

```tsx
// En TableHead (th)
// ANTES: className genérico
// DESPUÉS: agregar clase global para headers de tabla admin

// En globals.css:
.admin-table thead tr th {
  @apply bg-[#121A26] text-white font-semibold text-xs uppercase tracking-wide py-3 px-4;
}
.admin-table tbody tr:nth-child(even) {
  @apply bg-[#ECEEF0];
}
.admin-table tbody tr:hover {
  @apply bg-[#6E8CA6]/10;
}
```

### 11.2 — Status chips de citas (Design Tokens p.4)

Crear componente `StatusBadge` (o actualizar el existente en `shared/StatusBadge.tsx`):

```tsx
// src/components/shared/StatusBadge.tsx
const statusConfig = {
  pendiente:  { bg: '#ECEEF0', text: '#31363E', border: '#8B9197',  label: 'Pendiente'  },
  confirmada: { bg: '#6E8CA615', text: '#1C2838', border: '#6E8CA6', label: 'Confirmada' },
  completada: { bg: '#1A7A4A15', text: '#1A7A4A', border: '#1A7A4A', label: 'Realizada'  },
  cancelada:  { bg: '#9B1C1C15', text: '#9B1C1C', border: '#9B1C1C', label: 'Cancelada'  },
  no_asistio: { bg: '#B86A1A15', text: '#B86A1A', border: '#B86A1A', label: 'No Asistió' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status] || statusConfig.pendiente
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border-l-2"
      style={{ backgroundColor: config.bg, color: config.text, borderColor: config.border }}
    >
      {config.label}
    </span>
  )
}
```

### 11.3 — Colores de eventos del calendario (Reservas)

En `AppointmentCalendar.tsx`, actualizar la función que genera el color de cada evento:

```tsx
const getEventStyle = (status: AppointmentStatus) => {
  const styles = {
    pendiente:  { backgroundColor: '#ECEEF0', borderColor: '#8B9197',  color: '#31363E' },
    confirmada: { backgroundColor: '#6E8CA620', borderColor: '#6E8CA6', color: '#1C2838' },
    completada: { backgroundColor: '#1A7A4A15', borderColor: '#1A7A4A', color: '#1A7A4A' },
    cancelada:  { backgroundColor: '#9B1C1C10', borderColor: '#9B1C1C', color: '#9B1C1C' },
    no_asistio: { backgroundColor: '#B86A1A10', borderColor: '#B86A1A', color: '#B86A1A' },
  }
  return styles[status] || styles.pendiente
}
```

---

## PARTE 12 — SIDEBAR: Menú completo actualizado

Una vez construidos todos los módulos, el sidebar debe tener esta estructura definitiva:

```tsx
const routes = [
  { label: "Dashboard",        icon: LayoutDashboard, href: "/admin/dashboard"     },
  { label: "Pacientes",        icon: Users,           href: "/admin/patients"      },
  { label: "Reservas",         icon: Calendar,        href: "/admin/appointments"  },
  { label: "Servicios",        icon: Sparkles,        href: "/admin/services"      },
  { label: "Equipo",           icon: UserCheck,       href: "/admin/professionals" },
  { label: "Fidelidad",        icon: Gift,            href: "/admin/loyalty"       },
  { label: "Marketing",        icon: Megaphone,       href: "/admin/marketing"     },
  { label: "Automatizaciones", icon: Zap,             href: "/admin/automations"   },
  { label: "Reportes",         icon: BarChart2,        href: "/admin/reports"       },
  { label: "Configuración",    icon: Settings,        href: "/admin/settings"      },
]
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
SEMANA 1 — Base crítica
1. Ejecutar SQL: crear tabla professionals, agregar professional_id a appointments
2. Ejecutar SQL: agregar source y tags a profiles
3. Crear tipos TypeScript actualizados
4. Módulo Profesionales (CRUD completo)
5. Campo Professional en AppointmentForm

SEMANA 2 — Dashboard + Pacientes
6. KPI Ingresos del Mes en dashboard API
7. Gráfico de ingresos semanales (RevenueChart)
8. Campo Source en PatientForm y display
9. StatusBadge actualizado con colores del brand
10. Headers de tabla dark (globals.css)

SEMANA 3 — Módulos nuevos
11. Ejecutar SQL: tabla campaigns
12. Módulo Marketing/Campañas (CRUD + métricas calculadas)
13. Gráfico de fuentes de pacientes (donut)
14. Reportes con datos reales + exportar Excel

SEMANA 4 — Polish
15. Tipografía: Cormorant Garamond + Jost
16. Automatizaciones (config panel + tabla SQL)
17. Colores de eventos del calendario
18. Sidebar con menú completo de 10 items
```

---

## RESUMEN DE ARCHIVOS NUEVOS A CREAR

| Archivo | Tipo |
|---|---|
| `src/app/admin/professionals/page.tsx` | Página |
| `src/app/admin/professionals/new/page.tsx` | Página |
| `src/app/admin/professionals/[id]/page.tsx` | Página |
| `src/app/api/professionals/route.ts` | API |
| `src/app/api/professionals/[id]/route.ts` | API |
| `src/components/admin/professionals/ProfessionalList.tsx` | Componente |
| `src/components/admin/professionals/ProfessionalForm.tsx` | Componente |
| `src/lib/validations/professional.ts` | Validación |
| `src/app/admin/marketing/page.tsx` | Página |
| `src/app/admin/marketing/new/page.tsx` | Página |
| `src/app/admin/marketing/[id]/page.tsx` | Página |
| `src/app/api/campaigns/route.ts` | API |
| `src/app/api/campaigns/[id]/route.ts` | API |
| `src/components/admin/marketing/CampaignList.tsx` | Componente |
| `src/components/admin/marketing/CampaignForm.tsx` | Componente |
| `src/components/admin/marketing/CampaignMetrics.tsx` | Componente |
| `src/lib/validations/campaign.ts` | Validación |
| `src/app/admin/automations/page.tsx` | Página |
| `src/app/api/automations/route.ts` | API |
| `src/components/admin/automations/AutomationList.tsx` | Componente |
| `src/app/api/dashboard/revenue-chart/route.ts` | API |
| `src/app/api/dashboard/sources-chart/route.ts` | API |
| `src/components/admin/charts/RevenueChart.tsx` | Componente |
| `src/components/admin/charts/SourcesChart.tsx` | Componente |
| `src/app/api/reports/monthly/route.ts` | API |
| `src/components/admin/reports/MonthlyReport.tsx` | Componente |
| `src/components/admin/reports/ReportExport.tsx` | Componente |

## RESUMEN DE ARCHIVOS MODIFICADOS

| Archivo | Qué cambia |
|---|---|
| `src/types/index.ts` | Nuevos tipos: Professional, Campaign. Actualizar Appointment, Profile |
| `src/app/admin/reports/page.tsx` | Reemplazar placeholder con contenido real |
| `src/components/admin/appointments/AppointmentForm.tsx` | Campo professional_id |
| `src/lib/validations/appointment.ts` | Agregar professional_id al schema |
| `src/app/api/appointments/route.ts` | Incluir professional_id en INSERT |
| `src/components/admin/patients/PatientForm.tsx` | Campo source |
| `src/components/admin/patients/tabs/PersonalTab.tsx` | Mostrar source badge |
| `src/lib/validations/patient.ts` | Agregar source al schema |
| `src/app/api/patients/route.ts` | Incluir source en INSERT |
| `src/app/api/dashboard/route.ts` | Agregar ingresos mensuales y retention |
| `src/components/admin/DashboardStats.tsx` | Nuevo KPI ingresos, agregar gráficos |
| `src/components/admin/AdminSidebar.tsx` | Menú completo con 10 items |
| `src/components/shared/StatusBadge.tsx` | Colores brand del manual |
| `src/components/admin/appointments/AppointmentCalendar.tsx` | Colores por estado |
| `src/app/globals.css` | Clases para table headers dark |
| `src/app/layout.tsx` | Tipografía Jost + Cormorant Garamond |
| `tailwind.config.ts` | Fuentes sans y display |
