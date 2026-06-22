-- Foto de perfil (avatar) para el equipo / profesionales.
-- (La tabla `profiles` ya tiene avatar_url para usuarios y pacientes; se asegura por si acaso.)
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
