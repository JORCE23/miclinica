-- supabase/migrations/20260615000000_enable_clinics_rls.sql
-- La tabla clinics estaba SIN RLS (expuesta a la anon key).
-- Las rutas públicas (/api/public/clinics/*) usan SERVICE ROLE y NO se ven afectadas.
-- La creación/edición de clinics queda restringida (solo service role o admin de la propia clínica).

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados solo ven su propia clínica
CREATE POLICY "users_view_own_clinic" ON clinics
  FOR SELECT USING (id = get_user_clinic_id());

-- Solo el admin de la clínica puede actualizar su propia clínica
CREATE POLICY "admin_update_own_clinic" ON clinics
  FOR UPDATE USING (
    get_user_role() = 'clinic_admin' AND id = get_user_clinic_id()
  );
