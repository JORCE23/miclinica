# Revisión de Repositorio: `JORCE23/miclinica`
> Prompt para agente de codificación — aplica todas las correcciones descritas a continuación.

---

## CONTEXTO

Este repositorio es un SaaS multi-tenant para clínicas estéticas en Chile. Stack: Next.js 14 App Router + TypeScript + Supabase + Drizzle ORM + TanStack Query + shadcn/ui + Tailwind. La especificación completa del proyecto está en `GEMINI.md`.

Se detectaron los siguientes problemas estructurales. Corrígelos en orden.

---

## CORRECCIONES REQUERIDAS

### 1. Limpiar archivos sueltos en la raíz del proyecto

Los siguientes archivos no pertenecen a la raíz del proyecto y deben ser reubicados o eliminados:

- **`test.js`** → Mover a `/tests/test.js` o eliminar si no forma parte de una suite de tests definida. Si es un script de prueba manual de Supabase/Drizzle, moverlo a `/scripts/test.js`.
- **`demo-medico.html`** → Mover a `/docs/demo-medico.html`. Es un prototipo de referencia visual, no código de producción.
- **`libro-maestro-procedimientos.md`** → Mover a `/docs/libro-maestro-procedimientos.md`.
- **`procedimientos.json`** → Si es data de seed para la base de datos, mover a `/supabase/seed/procedimientos.json`. Si es solo referencia, mover a `/docs/procedimientos.json`.

Después de moverlos, verificar que ningún archivo de código los importa desde la raíz.

---

### 2. Corregir la migración SQL suelta en la raíz

El archivo `supabase_update_services.sql` está en la raíz del proyecto. Esto rompe el tracking de migraciones del Supabase CLI.

**Acción:**
1. Revisar el contenido de `supabase_update_services.sql`.
2. Moverlo a `/supabase/migrations/` con el naming correcto del CLI: `YYYYMMDDHHMMSS_update_services.sql`. Usar un timestamp coherente con el orden real de las migraciones existentes.
3. Eliminar el archivo original de la raíz.
4. Verificar que el archivo dentro de `/supabase/migrations/` sea reconocido correctamente por el CLI con `supabase migration list`.

---

### 3. Verificar y corregir `pnpm-workspace.yaml`

Existe un `pnpm-workspace.yaml` en la raíz, lo cual implica una configuración de monorepo. Si el proyecto es una sola aplicación Next.js (no hay múltiples paquetes en el repo), este archivo está de más y puede causar comportamientos inesperados.

**Acción:**
1. Revisar el contenido de `pnpm-workspace.yaml`.
2. Si solo define un workspace apuntando al root (e.g., `packages: ['.']`), eliminar el archivo — pnpm funciona correctamente sin él en proyectos single-package.
3. Si define múltiples workspaces que realmente se usan (e.g., `/apps/web`, `/packages/ui`), documentarlo en el README y asegurarse de que la estructura de carpetas lo refleje.

---

### 4. Auditar el uso de `@base-ui/react`

El paquete `@base-ui/react@^1.5.0` está instalado en `dependencies` pero no aparece en la especificación del proyecto (`GEMINI.md`) ni en shadcn/ui.

**Acción:**
1. Buscar en todo el codebase (`src/`) si `@base-ui/react` está siendo importado en algún archivo.
2. Si **no se usa**: eliminarlo de `package.json` y correr `pnpm install` para limpiar el lockfile.
3. Si **sí se usa**: documentar en qué componentes y por qué se prefirió sobre la alternativa de shadcn/ui correspondiente.

---

### 5. Verificar compatibilidad de `lucide-react@^1.17.0`

Se instaló `lucide-react` en la versión `^1.x`, que tiene cambios de API respecto a la `^0.x` que documenta la mayoría de guías de shadcn/ui.

**Acción:**
1. Verificar que todos los imports de iconos en el codebase usen la API correcta de la v1. En v1, algunos iconos cambiaron de nombre.
2. Correr el build (`pnpm build`) y verificar que no haya errores de "module not found" o props deprecadas relacionadas con lucide.
3. Si hay errores, corregirlos usando los nombres actualizados de la v1 de lucide-react.

---

### 6. Verificar que el schema de Drizzle ORM esté correctamente ubicado

`drizzle-orm` y `drizzle-kit` están instalados pero no se encontró un archivo `drizzle.config.ts` ni un schema visible en la raíz.

**Acción:**
1. Confirmar que existen los siguientes archivos (o equivalentes según la convención elegida):
   - `/drizzle.config.ts` — configuración de Drizzle Kit (apuntando a Supabase)
   - `/src/lib/db/schema.ts` o `/src/db/schema.ts` — definición de tablas en Drizzle
   - `/src/lib/db/index.ts` o `/src/db/index.ts` — cliente de base de datos
2. Si alguno falta, crearlo siguiendo el esquema SQL definido en `GEMINI.md` (sección "ESQUEMA DE BASE DE DATOS").
3. El `drizzle.config.ts` debe apuntar a las variables de entorno de Supabase (`DATABASE_URL` con la connection string de PostgreSQL directo, no la URL pública de Supabase).

Ejemplo mínimo de `drizzle.config.ts`:
```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

> ⚠️ Nota: Si las migraciones se manejan 100% con el Supabase CLI (SQL manual), y Drizzle solo se usa como query builder (sin `drizzle-kit generate`), documentar esa decisión claramente y considerar si `drizzle-kit` en devDependencies es necesario.

---

### 7. Reemplazar el README con uno propio del proyecto

El `README.md` actual es el generado por defecto por `create-next-app` y no tiene información del proyecto real.

**Acción:** Reemplazar `README.md` con uno que incluya al menos:

```md
# MiClínica — SaaS para Clínicas Estéticas

Plataforma multi-tenant para gestión de clínicas estéticas en Chile.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Drizzle ORM + TanStack Query
- Tailwind CSS + shadcn/ui

## Roles
- `clinic_admin`: gestión completa de pacientes, citas, servicios y puntos
- `client`: portal de paciente (mis citas, mis puntos, mi perfil)

## Setup local

\```bash
pnpm install
cp .env.example .env.local
# Agregar variables de Supabase en .env.local
pnpm dev
\```

## Variables de entorno requeridas

\```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          # PostgreSQL directo para Drizzle
\```

## Migraciones

\```bash
supabase db push       # aplica migraciones a Supabase
\```

## Especificación completa
Ver `GEMINI.md` para el mega-prompt con esquema de BD, RLS, tipos, y lógica de negocio.
```

---

### 8. Agregar `.env.example` al repositorio

No se detectó un archivo `.env.example` en la raíz. Esto es necesario para que cualquier desarrollador (o agente) sepa qué variables configurar.

**Acción:** Crear `/.env.example` con:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
```

Verificar que `.env.example` **no** esté en `.gitignore` (debe commitearse), y que `.env.local` **sí** esté ignorado.

---

## VERIFICACIÓN FINAL

Una vez aplicadas todas las correcciones, confirmar que:

- [ ] La raíz del proyecto solo contiene archivos de configuración estándar
- [ ] Todas las migraciones están en `/supabase/migrations/` con naming correcto
- [ ] `pnpm build` corre sin errores ni warnings de dependencias
- [ ] `pnpm lint` pasa sin errores
- [ ] El archivo `drizzle.config.ts` existe y apunta al schema correcto
- [ ] `.env.example` está en el repo y `.env.local` está en `.gitignore`
- [ ] El `README.md` describe el proyecto real
- [ ] `@base-ui/react` está eliminado si no se usa
