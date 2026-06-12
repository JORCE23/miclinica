# MiClínica — SaaS para Clínicas Estéticas

Plataforma multi-tenant para gestión de clínicas estéticas en Chile.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Drizzle ORM + TanStack Query
- Tailwind CSS + shadcn/ui

*Nota sobre UI: Este proyecto utiliza componentes primarios de `@base-ui/react` integrados en la estructura de componentes de shadcn/ui para una personalización más profunda.*

## Roles
- `clinic_admin`: gestión completa de pacientes, citas, servicios y puntos
- `client`: portal de paciente (mis citas, mis puntos, mi perfil)

## Setup local

```bash
pnpm install
cp .env.example .env.local
# Agregar variables de Supabase en .env.local
pnpm dev
```

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          # PostgreSQL directo para Drizzle
```

## Migraciones

```bash
supabase db push       # aplica migraciones a Supabase
```

## Especificación completa
Ver `GEMINI.md` para el mega-prompt con esquema de BD, RLS, tipos, y lógica de negocio.
