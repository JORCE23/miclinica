-- Receta de insumos por servicio: qué productos (y cuántos) consume cada
-- servicio. Al completar una cita, el stock de esos productos se descuenta.

CREATE TABLE IF NOT EXISTS public.service_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (service_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_service_products_service
  ON public.service_products (service_id);

ALTER TABLE public.service_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_service_products" ON public.service_products;
CREATE POLICY "admin_manage_service_products" ON public.service_products
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
