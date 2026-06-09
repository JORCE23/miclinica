# MEGA-PROMPT: SaaS Web App — Clínica Estética (Multi-tenant)

> Copia y pega este prompt completo en tu agente de IA (Claude Code, Cursor, Gemini CLI, etc.)

---

## VISIÓN GENERAL DEL PROYECTO

Construye una aplicación web SaaS multi-tenant para clínicas estéticas. Cada clínica es un tenant independiente con datos completamente aislados. El sistema tiene dos roles de usuario: **clinic_admin** y **client** (paciente). La app debe ser production-ready, escalable y moderna.

El objetivo es que esta misma base sirva para múltiples clínicas (multi-tenant), con sus propios pacientes, servicios, reservas y puntos de fidelidad.

---

## STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 con App Router + TypeScript |
| UI / Componentes | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth + Row Level Security (RLS) |
| ORM | Drizzle ORM |
| Formularios | React Hook Form + Zod |
| Data fetching | TanStack Query v5 (React Query) |
| Fechas | date-fns |
| Íconos | Lucide React |
| Temas | next-themes (dark mode) |
| Package manager | pnpm |
| Deploy | Vercel + Supabase Cloud |

---

## ARQUITECTURA MULTI-TENANT

- Todas las tablas (excepto `clinics` y `profiles`) tienen columna `clinic_id` como FK.
- Supabase RLS garantiza el aislamiento de datos entre clínicas.
- Un usuario solo puede pertenecer a UNA clínica.
- El `clinic_id` se asigna automáticamente desde el perfil del usuario autenticado.

---

## ESQUEMA DE BASE DE DATOS

Ejecutar en el SQL Editor de Supabase:

```sql
-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLÍNICAS (raíz del tenant)
-- ============================================================
CREATE TABLE clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,        -- para URLs amigables
  logo_url      TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id     UUID REFERENCES clinics(id),
  role          TEXT CHECK (role IN ('clinic_admin', 'client')) NOT NULL,
  full_name     TEXT NOT NULL,
  rut           TEXT,               -- Formato chileno: 12.345.678-9
  birth_date    DATE,
  phone         TEXT,
  email         TEXT,
  avatar_url    TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANTECEDENTES MÓRBIDOS
-- ============================================================
CREATE TABLE medical_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) NOT NULL,
  patient_id    UUID REFERENCES profiles(id) NOT NULL,
  condition     TEXT NOT NULL,
  diagnosed_at  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERGIAS
-- ============================================================
CREATE TABLE allergies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) NOT NULL,
  patient_id    UUID REFERENCES profiles(id) NOT NULL,
  allergen      TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('leve', 'moderada', 'severa')) DEFAULT 'leve',
  reaction      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HISTORIAL DE PROCEDIMIENTOS ESTÉTICOS PREVIOS
-- ============================================================
CREATE TABLE aesthetic_procedures_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  procedure_name  TEXT NOT NULL,
  performed_at    DATE NOT NULL,
  performed_by    TEXT,               -- nombre del profesional (texto libre)
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICIOS (catálogo de cada clínica)
-- ============================================================
CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID REFERENCES clinics(id) NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  duration_minutes      INTEGER DEFAULT 60,
  price                 DECIMAL(10,2),
  loyalty_points_earned INTEGER DEFAULT 0,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESERVAS / CITAS (appointments)
-- ============================================================
CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES clinics(id) NOT NULL,
  patient_id        UUID REFERENCES profiles(id) NOT NULL,
  service_id        UUID REFERENCES services(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER DEFAULT 60,
  status            TEXT CHECK (status IN (
                      'pendiente', 'confirmada', 'completada',
                      'cancelada', 'no_asistio'
                    )) DEFAULT 'pendiente',
  notes             TEXT,
  price             DECIMAL(10,2),
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUNTOS DE FIDELIDAD
-- ============================================================
CREATE TABLE loyalty_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  total_points    INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, patient_id)
);

CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  appointment_id  UUID REFERENCES appointments(id),
  type            TEXT CHECK (type IN ('ganados', 'canjeados', 'ajuste', 'expirados')) NOT NULL,
  points          INTEGER NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## POLÍTICAS ROW LEVEL SECURITY (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE aesthetic_procedures_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener clinic_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES
CREATE POLICY "admin_manage_clinic_profiles" ON profiles
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "client_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- MEDICAL HISTORY (solo admin de la clínica puede ver/editar)
CREATE POLICY "admin_medical_history" ON medical_history
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_medical_history" ON medical_history
  FOR SELECT USING (patient_id = auth.uid());

-- ALLERGIES
CREATE POLICY "admin_allergies" ON allergies
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_allergies" ON allergies
  FOR SELECT USING (patient_id = auth.uid());

-- AESTHETIC PROCEDURES HISTORY
CREATE POLICY "admin_procedures" ON aesthetic_procedures_history
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_procedures" ON aesthetic_procedures_history
  FOR SELECT USING (patient_id = auth.uid());

-- SERVICES
CREATE POLICY "admin_manage_services" ON services
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_services" ON services
  FOR SELECT USING (clinic_id = get_user_clinic_id());

-- APPOINTMENTS
CREATE POLICY "admin_manage_appointments" ON appointments
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

-- LOYALTY ACCOUNTS
CREATE POLICY "admin_loyalty" ON loyalty_accounts
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_loyalty" ON loyalty_accounts
  FOR SELECT USING (patient_id = auth.uid());

-- LOYALTY TRANSACTIONS
CREATE POLICY "admin_loyalty_tx" ON loyalty_transactions
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_loyalty_tx" ON loyalty_transactions
  FOR SELECT USING (patient_id = auth.uid());
```

---

## ESTRUCTURA DE ARCHIVOS

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                  # Layout con sidebar admin
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Stats, KPIs, resumen
│   │   ├── patients/
│   │   │   ├── page.tsx                # Lista de pacientes
│   │   │   ├── new/page.tsx            # Crear paciente
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Ficha del paciente (6 tabs)
│   │   ├── appointments/
│   │   │   ├── page.tsx                # Lista + calendario de reservas
│   │   │   ├── new/page.tsx            # Crear reserva
│   │   │   └── [id]/page.tsx           # Detalle de reserva
│   │   ├── services/
│   │   │   └── page.tsx                # Gestión catálogo de servicios
│   │   └── loyalty/
│   │       └── page.tsx                # Puntos por paciente
│   │
│   ├── (client)/
│   │   ├── layout.tsx                  # Layout cliente (nav top)
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Home cliente
│   │   ├── appointments/
│   │   │   └── page.tsx                # Mis reservas
│   │   ├── loyalty/
│   │   │   └── page.tsx                # Mis puntos
│   │   └── profile/
│   │       └── page.tsx                # Mi perfil (vista/edición limitada)
│   │
│   ├── api/
│   │   ├── patients/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PUT, DELETE
│   │   │       ├── medical-history/route.ts
│   │   │       ├── allergies/route.ts
│   │   │       └── procedures/route.ts
│   │   ├── appointments/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── status/route.ts     # Cambio de estado + puntos
│   │   ├── services/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── loyalty/
│   │       └── [patientId]/
│   │           ├── route.ts
│   │           └── adjust/route.ts
│   │
│   ├── layout.tsx
│   └── page.tsx                        # Redirect según rol
│
├── components/
│   ├── ui/                             # shadcn/ui (auto-generados)
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── patients/
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientSearchBar.tsx
│   │   │   ├── PatientForm.tsx         # Datos personales
│   │   │   ├── MedicalHistoryTab.tsx
│   │   │   ├── AllergiesTab.tsx
│   │   │   ├── ProceduresTab.tsx
│   │   │   ├── PatientAppointmentsTab.tsx
│   │   │   └── PatientLoyaltyTab.tsx
│   │   ├── appointments/
│   │   │   ├── AppointmentList.tsx
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   └── AppointmentStatusActions.tsx
│   │   └── loyalty/
│   │       └── LoyaltyAdjustForm.tsx
│   ├── client/
│   │   ├── ClientNav.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── LoyaltyCard.tsx
│   │   └── ClientProfileForm.tsx
│   └── shared/
│       ├── RutInput.tsx               # Input RUT chileno con validación
│       ├── StatusBadge.tsx
│       ├── PointsBadge.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # createBrowserClient
│   │   ├── server.ts                  # createServerClient
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── patient.ts                 # Zod schemas paciente
│   │   ├── appointment.ts             # Zod schemas cita
│   │   └── rut.ts                     # Validación RUT chileno
│   └── utils.ts
│
├── hooks/
│   ├── usePatients.ts
│   ├── useAppointments.ts
│   ├── useLoyalty.ts
│   └── useProfile.ts
│
├── types/
│   └── index.ts                       # Todos los tipos TypeScript
│
└── middleware.ts                       # Protección de rutas por rol
```

---

## TIPOS TYPESCRIPT

```typescript
// types/index.ts

export type UserRole = 'clinic_admin' | 'client';

export type AppointmentStatus =
  | 'pendiente' | 'confirmada' | 'completada'
  | 'cancelada' | 'no_asistio';

export type AllergySeverity = 'leve' | 'moderada' | 'severa';

export type LoyaltyTransactionType = 'ganados' | 'canjeados' | 'ajuste' | 'expirados';

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  role: UserRole;
  full_name: string;
  rut?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // calculado
  age?: number;
}

export interface MedicalHistory {
  id: string;
  clinic_id: string;
  patient_id: string;
  condition: string;
  diagnosed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Allergy {
  id: string;
  clinic_id: string;
  patient_id: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  created_at: string;
}

export interface AestheticProcedureHistory {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_name: string;
  performed_at: string;
  performed_by?: string;
  notes?: string;
  created_at: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  loyalty_points_earned: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  service_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joins
  patient?: Profile;
  service?: Service;
}

export interface LoyaltyAccount {
  id: string;
  clinic_id: string;
  patient_id: string;
  total_points: number;
  lifetime_points: number;
}

export interface LoyaltyTransaction {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id?: string;
  type: LoyaltyTransactionType;
  points: number;
  description?: string;
  created_at: string;
}
```

---

## VALIDACIÓN RUT CHILENO

```typescript
// lib/validations/rut.ts

export function validateRut(rut: string): boolean {
  const cleaned = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv   = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const expected  = remainder === 0 ? '0' : remainder === 1 ? 'K' : String(11 - remainder);

  return dv === expected;
}

export function formatRut(value: string): string {
  const cleaned = value.replace(/\./g, '').replace(/-/g, '').replace(/[^0-9Kk]/g, '').toUpperCase();
  if (cleaned.length <= 1) return cleaned;

  const body          = cleaned.slice(0, -1);
  const dv            = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}
```

```tsx
// components/shared/RutInput.tsx
// Input controlado que:
// 1. Formatea automáticamente el RUT mientras el usuario escribe
// 2. Muestra ✓ verde cuando es válido, ✗ rojo cuando no
// 3. Compatible con React Hook Form

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { validateRut, formatRut } from '@/lib/validations/rut';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RutInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function RutInput({ value, onChange, onBlur, error }: RutInputProps) {
  const [isDirty, setIsDirty] = useState(false);
  const isValid = isDirty && value.length > 3 && validateRut(value);
  const isInvalid = isDirty && value.length > 3 && !validateRut(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    onChange(formatted);
    setIsDirty(true);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="12.345.678-9"
        maxLength={12}
        className={isInvalid ? 'border-red-500' : isValid ? 'border-green-500' : ''}
      />
      {isValid   && <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />}
      {isInvalid && <XCircle      className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />}
      {error     && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
```

---

## FUNCIONALIDADES: PANEL ADMIN

### Dashboard (`/admin/dashboard`)
- Cards con KPIs:
  - Total de pacientes activos
  - Citas hoy
  - Citas próximas 7 días
  - Nuevos pacientes este mes
  - Puntos de fidelidad otorgados este mes
- Lista de próximas citas del día (5 más cercanas)
- Accesos rápidos: crear paciente, crear cita

---

### Gestión de Pacientes (`/admin/patients`)

**Lista:**
- Búsqueda por nombre, RUT o email
- Filtros: activos/inactivos
- Columnas: Avatar, Nombre Completo, RUT, Edad, Teléfono, Última visita, Puntos, Acciones
- Paginación (20 por página)
- Botón exportar CSV

**Ficha del Paciente (`/admin/patients/[id]`) — 6 pestañas:**

**Tab 1: Datos Personales**
- Nombre completo (requerido)
- RUT con validación Mod11 chilena
- Fecha de nacimiento → mostrar edad calculada automáticamente
- Teléfono, email, dirección
- Foto de perfil (upload a Supabase Storage)
- Notas internas

**Tab 2: Antecedentes Mórbidos**
- Lista cronológica de condiciones médicas
- Campos: condición, fecha diagnóstico, notas
- CRUD completo (agregar / editar / eliminar con confirmación)
- Renderizar como timeline visual

**Tab 3: Alergias**
- Lista de alergias con badges de severidad:
  - Leve → badge verde
  - Moderada → badge amarillo/naranja
  - Severa → badge rojo con ⚠️
- Campos: alérgeno, severidad, descripción de reacción
- CRUD completo

**Tab 4: Procedimientos Estéticos Previos**
- Lista ordenada de forma cronológica (más reciente primero)
- Campos: nombre del procedimiento, fecha, profesional que realizó, notas
- CRUD completo

**Tab 5: Historial de Citas**
- Todas las citas del paciente en esta clínica
- Con filtro de estado
- Badge de estado por cita
- Botón "Nueva Cita" en la esquina

**Tab 6: Puntos de Fidelidad**
- Saldo actual de puntos (número grande y destacado)
- Puntos totales ganados (lifetime)
- Tabla de transacciones: fecha, tipo, puntos, descripción
- Botón para ajuste manual de puntos (modal con razón)

---

### Reservas / Citas (`/admin/appointments`)

**Lista:**
- Toggle entre vista Lista y vista Calendario (monthly/weekly)
- Filtros: estado, rango de fechas, servicio, paciente
- Columnas: Paciente, Servicio, Fecha/Hora, Duración, Estado, Precio, Acciones
- Badges de estado:
  - Pendiente → gris
  - Confirmada → azul
  - Completada → verde ✓
  - Cancelada → rojo
  - No asistió → naranja

**Crear/Editar Cita:**
- Selector de paciente (searchable dropdown con nombre + RUT)
- Selector de servicio (dropdown desde catálogo de la clínica)
- Date & time picker
- Duración (auto-llenada desde servicio, editable)
- Precio (auto-llenado desde servicio, editable)
- Notas
- Estado

**Acciones de estado:**
- Confirmar → cambia a "confirmada"
- Marcar como Completada:
  - Cambia a "completada"
  - Si el servicio tiene `loyalty_points_earned > 0`:
    - Pregunta si desea asignar los puntos automáticamente
    - Si acepta: inserta en `loyalty_transactions` y actualiza `loyalty_accounts`
- Cancelar → cambia a "cancelada" con confirmación
- No asistió → cambia a "no_asistio"

---

### Catálogo de Servicios (`/admin/services`)
- Lista de servicios con: nombre, duración, precio, puntos que otorga, estado
- Toggle activo/inactivo
- CRUD completo
- Formulario: nombre, descripción, duración (minutos), precio, puntos de fidelidad que otorga

---

### Puntos de Fidelidad (`/admin/loyalty`)
- Tabla de todos los pacientes activos con su saldo de puntos
- Ordenable por puntos (mayor a menor)
- Ajuste manual: modal con paciente, tipo (sumar/restar), cantidad, motivo
- Historial de transacciones por paciente

---

## FUNCIONALIDADES: PORTAL CLIENTE

### Dashboard Cliente (`/client/dashboard`)
- Saludo: "Hola, {nombre}!"
- Card prominente con puntos actuales (con estrella ⭐)
- Card de próxima cita (fecha, hora, servicio, estado)
- Acceso rápido a "Mis Citas" y "Mis Puntos"

### Mis Citas (`/client/appointments`)
- Lista de todas sus citas en la clínica
- Tabs: Próximas / Pasadas
- Card por cita: nombre del servicio, fecha y hora, estado, notas
- No puede crear ni editar (solo lectura)

### Mis Puntos (`/client/loyalty`)
- Saldo actual (visual prominente)
- Barra de progreso hacia próximo nivel/beneficio (configurable)
- Historial de transacciones: fecha, descripción, +/- puntos

### Mi Perfil (`/client/profile`)
- Ver: nombre, RUT, email, teléfono, fecha de nacimiento, edad
- Editar (limitado): teléfono, email
- Ver (solo lectura): alergias registradas, historial médico
- No puede editar datos médicos (solo el admin)

---

## FLUJO DE AUTENTICACIÓN

```
1. Usuario va a /login
2. Ingresa email + contraseña (Supabase Auth)
3. En el server action de login:
   a. Obtener sesión de Supabase
   b. Consultar profiles donde id = auth.uid()
   c. Si role = 'clinic_admin' → redirect a /admin/dashboard
   d. Si role = 'client'       → redirect a /client/dashboard
4. middleware.ts protege:
   - /admin/* → solo clinic_admin
   - /client/* → solo client
   - Si no autenticado → redirect a /login
```

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Verificar sesión y rol, redirigir apropiadamente
  // Proteger /admin/* para clinic_admin
  // Proteger /client/* para client
}
```

---

## RUTAS DE API (Next.js Route Handlers)

```
# Pacientes
POST   /api/patients                                  Crear paciente
GET    /api/patients                                  Listar (search, filter, paginate)
GET    /api/patients/[id]                             Detalle paciente
PUT    /api/patients/[id]                             Actualizar paciente
DELETE /api/patients/[id]                             Soft delete

POST   /api/patients/[id]/medical-history             Agregar antecedente
PUT    /api/patients/[id]/medical-history/[mhId]      Actualizar
DELETE /api/patients/[id]/medical-history/[mhId]      Eliminar

POST   /api/patients/[id]/allergies                   Agregar alergia
PUT    /api/patients/[id]/allergies/[aId]             Actualizar
DELETE /api/patients/[id]/allergies/[aId]             Eliminar

POST   /api/patients/[id]/procedures                  Agregar procedimiento
PUT    /api/patients/[id]/procedures/[pId]            Actualizar
DELETE /api/patients/[id]/procedures/[pId]            Eliminar

# Citas / Reservas
POST   /api/appointments                              Crear cita
GET    /api/appointments                              Listar (filtros: status, date, patient)
GET    /api/appointments/[id]                         Detalle
PUT    /api/appointments/[id]                         Actualizar
PUT    /api/appointments/[id]/status                  Cambiar estado (+ lógica puntos)

# Servicios
GET    /api/services                                  Listar servicios activos
POST   /api/services                                  Crear servicio
PUT    /api/services/[id]                             Actualizar
DELETE /api/services/[id]                             Desactivar

# Puntos de fidelidad
GET    /api/loyalty/[patientId]                       Cuenta de puntos
GET    /api/loyalty/[patientId]/transactions          Historial
POST   /api/loyalty/[patientId]/adjust                Ajuste manual
```

---

## LÓGICA DE NEGOCIO (REGLAS IMPORTANTES)

1. **RUT único por clínica**: al crear/editar un paciente, verificar que el RUT no exista en `profiles` para el mismo `clinic_id`.
2. **Puntos automáticos**: al cambiar cita a `completada` y el servicio tiene `loyalty_points_earned > 0`:
   - Insertar en `loyalty_transactions` (type: 'ganados', points: servicio.loyalty_points_earned)
   - Actualizar `loyalty_accounts.total_points` y `lifetime_points`
3. **Puntos nunca negativos**: al canjear/ajustar, verificar que `total_points - amount >= 0`.
4. **Solapamiento de citas**: al crear una cita, verificar que no haya otra cita en estado activo para el mismo paciente en el mismo horario (scheduled_at ± duration_minutes).
5. **clinic_id automático**: todos los nuevos registros deben recibir el `clinic_id` del usuario autenticado (nunca del body de la request).
6. **Edad calculada**: calcular y mostrar la edad en base a `birth_date` con date-fns, nunca guardarla en BD.
7. **Soft delete en pacientes**: usar `is_active = false`, nunca borrar físicamente.

---

## DISEÑO Y UI

### Paleta de colores (estética de clínica)
- **Primary**: Rose 500 (`#f43f5e`) y Rose 600 (`#e11d48`) — tono premium femenino
- **Background admin**: Slate 50 / White con sidebar en Slate 900
- **Background client**: White con acentos en Rose suave
- **Success**: Emerald 500
- **Warning**: Amber 500
- **Error**: Red 500
- **Neutral**: Slate scale

### Componentes clave a usar de shadcn/ui
- `Button`, `Input`, `Select`, `Textarea`
- `Dialog` (modales de confirmación y formularios)
- `Tabs` (ficha del paciente)
- `Badge` (estados, severidad)
- `Card`
- `Table`, `Pagination`
- `Calendar` (picker de fechas)
- `Avatar`
- `Skeleton` (loading states)
- `Toast` / `Sonner` (notificaciones)
- `Command` (searchable dropdowns)

### Sidebar Admin (colapsable en mobile)
```
┌─────────────────────┐
│ [Logo] Mi Clínica   │
├─────────────────────┤
│ 📊 Dashboard        │
│ 👤 Pacientes        │
│ 📅 Reservas         │
│ ✨ Servicios        │
│ 🎁 Fidelidad        │
│ ⚙️  Configuración   │
├─────────────────────┤
│ [Avatar] Admin User │
│          Cerrar ses.│
└─────────────────────┘
```

### Estados requeridos en TODA la app
- **Loading**: Skeleton loaders mientras cargan datos
- **Empty state**: Ilustración + mensaje + CTA cuando no hay datos
- **Error state**: Mensaje descriptivo + botón de reintentar
- **Success feedback**: Toast con mensaje de confirmación en cada acción

---

## VARIABLES DE ENTORNO

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## ORDEN DE CONSTRUCCIÓN (BUILD ORDER)

Sigue este orden estrictamente:

1. **Setup inicial**: `pnpm create next-app`, instalar shadcn/ui, Supabase, TanStack Query, etc.
2. **Base de datos**: Ejecutar todo el SQL en Supabase (tablas + RLS)
3. **Tipos TypeScript**: Crear `types/index.ts` completo
4. **Supabase client/server**: Configurar `lib/supabase/client.ts` y `server.ts`
5. **Middleware**: Protección de rutas por rol
6. **Auth**: Login y lógica de redirección por rol
7. **Layout Admin**: Sidebar + layout base
8. **Gestión de Pacientes** (módulo más importante):
   - Lista de pacientes
   - Crear paciente con RutInput
   - Ficha con 6 tabs
9. **Reservas/Citas**: Lista, calendario, crear, cambiar estado
10. **Servicios**: CRUD del catálogo
11. **Puntos de fidelidad**: Admin management
12. **Layout Cliente + Portal**: Mis citas, mis puntos, mi perfil
13. **Dashboard Admin**: KPIs y stats

---

## ENTREGABLES ESPERADOS

Al finalizar, la aplicación debe incluir:

- [ ] Migraciones SQL completas en `/supabase/migrations/`
- [ ] Panel admin completo y funcional con todos los módulos
- [ ] Portal cliente completo y funcional
- [ ] Autenticación con redirección por rol
- [ ] Formularios con validación Zod (incluyendo RUT chileno)
- [ ] Diseño responsive (mobile-first con Tailwind + shadcn/ui)
- [ ] Paleta de colores rose/pink coherente con estética de clínica
- [ ] Loading, error y empty states en todos los módulos
- [ ] Tipos TypeScript completos para todas las entidades
- [ ] Políticas RLS funcionando correctamente en Supabase
- [ ] Lógica de puntos de fidelidad automáticos al completar cita

---

*Prompt generado para: Claude Code / Cursor / Gemini CLI / cualquier agente de codificación IA*
*Proyecto: SaaS Multi-tenant Clínica Estética — Chile*
