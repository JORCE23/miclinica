-- Lotes de inventario: permite registrar lotes con fecha de vencimiento por
-- producto, para alertar de productos por vencer o vencidos.

CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  batch_code  TEXT,
  quantity    INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_batches_product
  ON public.inventory_batches (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry
  ON public.inventory_batches (clinic_id, expiry_date);

ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_inv_batches" ON public.inventory_batches;
CREATE POLICY "admin_manage_inv_batches" ON public.inventory_batches
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
