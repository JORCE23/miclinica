-- Inventario de la clínica: productos con stock y movimientos (entradas/salidas).

CREATE TABLE IF NOT EXISTS public.inventory_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT,
  sku         TEXT,
  unit        TEXT DEFAULT 'unidad',
  stock       INTEGER NOT NULL DEFAULT 0,
  min_stock   INTEGER NOT NULL DEFAULT 5,
  cost        DECIMAL(10, 2),
  supplier    TEXT,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_products_clinic
  ON public.inventory_products (clinic_id, name);

ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_inventory" ON public.inventory_products;
CREATE POLICY "admin_manage_inventory" ON public.inventory_products
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

-- Historial de movimientos de stock
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES inventory_products(id) ON DELETE CASCADE NOT NULL,
  type        TEXT CHECK (type IN ('entrada', 'salida', 'ajuste')) NOT NULL,
  quantity    INTEGER NOT NULL,
  reason      TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product
  ON public.inventory_movements (product_id, created_at DESC);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_inv_movements" ON public.inventory_movements;
CREATE POLICY "admin_manage_inv_movements" ON public.inventory_movements
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
