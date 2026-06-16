-- Caja diaria (ingresos/egresos manuales) y estado de llegada para la sala de espera.

-- 1) Movimientos de caja
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  type        TEXT CHECK (type IN ('ingreso', 'egreso')) NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  method      TEXT,
  concept     TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_clinic_date
  ON public.cash_movements (clinic_id, created_at DESC);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_cash" ON public.cash_movements;
CREATE POLICY "admin_manage_cash" ON public.cash_movements
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

-- 2) Estado de llegada para la sala de espera (no toca el flujo de 'status')
--    Valores que usa la app: 'esperando', 'en_atencion', 'finalizado' (NULL = por llegar)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS arrival_status TEXT;
