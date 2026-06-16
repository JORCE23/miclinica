-- Tabla de auditoría para acceso y modificación de datos clínicos.
-- Cumplimiento: Ley 20.584 (registros médicos) y Ley 21.719 (datos sensibles de salud).
-- Política: solo INSERT/SELECT para clinic_admin; nunca UPDATE ni DELETE (append-only).

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) NOT NULL,
  actor_id    UUID                         NOT NULL, -- profiles.id del usuario que actuó
  action      TEXT                         NOT NULL, -- ver audit.ts para valores válidos
  patient_id  UUID REFERENCES profiles(id),
  record_id   UUID,                                  -- ID del registro específico afectado
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON audit_logs (clinic_id, created_at DESC);
CREATE INDEX ON audit_logs (patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX ON audit_logs (actor_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_admin_audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

CREATE POLICY "clinic_admin_audit_select" ON audit_logs
  FOR SELECT USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
