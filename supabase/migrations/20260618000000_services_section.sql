-- Servicios: separar por sección (facial / corporal). La columna `category` ya existe.
ALTER TABLE services ADD COLUMN IF NOT EXISTS section TEXT;
