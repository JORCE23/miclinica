-- ============================================================
-- TABLA: professionals
-- ============================================================
CREATE TABLE IF NOT EXISTS professionals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id) NOT NULL,
  full_name   TEXT NOT NULL,
  specialty   TEXT,           -- "Médico Estético", "Enfermera", "Técnico", etc.
  email       TEXT,
  phone       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_professionals" ON professionals
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

-- ============================================================
-- TABLA: campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID REFERENCES clinics(id) NOT NULL,
  name             TEXT NOT NULL,
  channel          TEXT CHECK (channel IN ('meta', 'google', 'organico', 'email', 'whatsapp', 'otro')) NOT NULL,
  status           TEXT CHECK (status IN ('activa', 'pausada', 'finalizada')) DEFAULT 'activa',
  start_date       DATE,
  end_date         DATE,
  budget           DECIMAL(10,2),        -- presupuesto total
  spent            DECIMAL(10,2) DEFAULT 0, -- gasto real
  leads_generated  INTEGER DEFAULT 0,
  appointments_gen INTEGER DEFAULT 0,    -- citas generadas
  sales_generated  DECIMAL(10,2) DEFAULT 0,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_campaigns" ON campaigns
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

-- ============================================================
-- TABLA: automations
-- ============================================================
CREATE TABLE IF NOT EXISTS automations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID REFERENCES clinics(id) NOT NULL,
  trigger_type TEXT CHECK (trigger_type IN ('cita_programada', 'post_cita', 'inactivo_90d', 'cumpleanos')) NOT NULL,
  channel      TEXT CHECK (channel IN ('email', 'whatsapp')) DEFAULT 'email',
  delay_hours  INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT false,
  template_id  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_automations" ON automations
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );

-- ============================================================
-- ALTER TABLES
-- ============================================================

-- appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id),
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN (
    'meta_ads', 'google', 'referido', 'organico', 'directo', 'whatsapp', 'otro'
  )),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- aesthetic_procedures_history
ALTER TABLE aesthetic_procedures_history
  ADD COLUMN IF NOT EXISTS before_image_url TEXT,
  ADD COLUMN IF NOT EXISTS after_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS facial_diagram_data JSONB;
