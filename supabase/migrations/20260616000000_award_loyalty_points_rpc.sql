-- Funciones RPC atómicas para puntos de fidelidad.
-- Reemplazan el patrón JS read-modify-write que tenía race conditions.

-- Para citas completadas: idempotente por appointment_id
CREATE OR REPLACE FUNCTION award_loyalty_points(
  p_clinic_id      UUID,
  p_patient_id     UUID,
  p_appointment_id UUID,
  p_points         INTEGER,
  p_description    TEXT DEFAULT 'Puntos ganados por servicio completado'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  -- Idempotencia: si ya se otorgaron puntos para esta cita, no hacer nada
  IF EXISTS (
    SELECT 1 FROM loyalty_transactions
    WHERE appointment_id = p_appointment_id
      AND type = 'ganados'
      AND clinic_id = p_clinic_id
  ) THEN
    RETURN jsonb_build_object('status', 'already_awarded');
  END IF;

  INSERT INTO loyalty_transactions (clinic_id, patient_id, appointment_id, type, points, description)
  VALUES (p_clinic_id, p_patient_id, p_appointment_id, 'ganados', p_points, p_description);

  -- UPSERT atómico: elimina la race condition de leer-modificar-escribir
  INSERT INTO loyalty_accounts (clinic_id, patient_id, total_points, lifetime_points)
  VALUES (p_clinic_id, p_patient_id, p_points, p_points)
  ON CONFLICT (clinic_id, patient_id)
  DO UPDATE SET
    total_points    = loyalty_accounts.total_points + p_points,
    lifetime_points = loyalty_accounts.lifetime_points + p_points;

  RETURN jsonb_build_object('status', 'awarded', 'points', p_points);
END;
$$;

-- Para ajustes manuales: soporta puntos positivos y negativos
CREATE OR REPLACE FUNCTION adjust_loyalty_points(
  p_clinic_id   UUID,
  p_patient_id  UUID,
  p_points      INTEGER,
  p_description TEXT DEFAULT 'Ajuste manual',
  p_type        TEXT DEFAULT 'ajuste'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO loyalty_transactions (clinic_id, patient_id, type, points, description)
  VALUES (p_clinic_id, p_patient_id, p_type, p_points, p_description);

  INSERT INTO loyalty_accounts (clinic_id, patient_id, total_points, lifetime_points)
  VALUES (
    p_clinic_id,
    p_patient_id,
    GREATEST(0, p_points),
    GREATEST(0, p_points)
  )
  ON CONFLICT (clinic_id, patient_id)
  DO UPDATE SET
    total_points    = GREATEST(0, loyalty_accounts.total_points + p_points),
    lifetime_points = CASE
                        WHEN p_points > 0
                          THEN loyalty_accounts.lifetime_points + p_points
                        ELSE loyalty_accounts.lifetime_points
                      END;

  RETURN jsonb_build_object('status', 'adjusted', 'points', p_points);
END;
$$;
