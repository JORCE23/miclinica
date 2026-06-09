-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLÍNICAS (raíz del tenant)
-- ============================================================
CREATE TABLE clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,        -- para URLs amigables
  logo_url      TEXT,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFILES (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id     UUID REFERENCES clinics(id),
  role          TEXT CHECK (role IN ('clinic_admin', 'client')) NOT NULL,
  full_name     TEXT NOT NULL,
  rut           TEXT,               -- Formato chileno: 12.345.678-9
  birth_date    DATE,
  phone         TEXT,
  email         TEXT,
  avatar_url    TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANTECEDENTES MÓRBIDOS
-- ============================================================
CREATE TABLE medical_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) NOT NULL,
  patient_id    UUID REFERENCES profiles(id) NOT NULL,
  condition     TEXT NOT NULL,
  diagnosed_at  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERGIAS
-- ============================================================
CREATE TABLE allergies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) NOT NULL,
  patient_id    UUID REFERENCES profiles(id) NOT NULL,
  allergen      TEXT NOT NULL,
  severity      TEXT CHECK (severity IN ('leve', 'moderada', 'severa')) DEFAULT 'leve',
  reaction      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HISTORIAL DE PROCEDIMIENTOS ESTÉTICOS PREVIOS
-- ============================================================
CREATE TABLE aesthetic_procedures_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  procedure_name  TEXT NOT NULL,
  performed_at    DATE NOT NULL,
  performed_by    TEXT,               -- nombre del profesional (texto libre)
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICIOS (catálogo de cada clínica)
-- ============================================================
CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID REFERENCES clinics(id) NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  duration_minutes      INTEGER DEFAULT 60,
  price                 DECIMAL(10,2),
  loyalty_points_earned INTEGER DEFAULT 0,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESERVAS / CITAS (appointments)
-- ============================================================
CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES clinics(id) NOT NULL,
  patient_id        UUID REFERENCES profiles(id) NOT NULL,
  service_id        UUID REFERENCES services(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER DEFAULT 60,
  status            TEXT CHECK (status IN (
                      'pendiente', 'confirmada', 'completada',
                      'cancelada', 'no_asistio'
                    )) DEFAULT 'pendiente',
  notes             TEXT,
  price             DECIMAL(10,2),
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUNTOS DE FIDELIDAD
-- ============================================================
CREATE TABLE loyalty_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  total_points    INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, patient_id)
);

CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID REFERENCES clinics(id) NOT NULL,
  patient_id      UUID REFERENCES profiles(id) NOT NULL,
  appointment_id  UUID REFERENCES appointments(id),
  type            TEXT CHECK (type IN ('ganados', 'canjeados', 'ajuste', 'expirados')) NOT NULL,
  points          INTEGER NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE aesthetic_procedures_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener clinic_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Función helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES
CREATE POLICY "admin_manage_clinic_profiles" ON profiles
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "client_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- MEDICAL HISTORY (solo admin de la clínica puede ver/editar)
CREATE POLICY "admin_medical_history" ON medical_history
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_medical_history" ON medical_history
  FOR SELECT USING (patient_id = auth.uid());

-- ALLERGIES
CREATE POLICY "admin_allergies" ON allergies
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_allergies" ON allergies
  FOR SELECT USING (patient_id = auth.uid());

-- AESTHETIC PROCEDURES HISTORY
CREATE POLICY "admin_procedures" ON aesthetic_procedures_history
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_procedures" ON aesthetic_procedures_history
  FOR SELECT USING (patient_id = auth.uid());

-- SERVICES
CREATE POLICY "admin_manage_services" ON services
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_services" ON services
  FOR SELECT USING (clinic_id = get_user_clinic_id());

-- APPOINTMENTS
CREATE POLICY "admin_manage_appointments" ON appointments
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_appointments" ON appointments
  FOR SELECT USING (patient_id = auth.uid());

-- LOYALTY ACCOUNTS
CREATE POLICY "admin_loyalty" ON loyalty_accounts
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_loyalty" ON loyalty_accounts
  FOR SELECT USING (patient_id = auth.uid());

-- LOYALTY TRANSACTIONS
CREATE POLICY "admin_loyalty_tx" ON loyalty_transactions
  FOR ALL USING (
    get_user_role() = 'clinic_admin' AND clinic_id = get_user_clinic_id()
  );
CREATE POLICY "client_view_own_loyalty_tx" ON loyalty_transactions
  FOR SELECT USING (patient_id = auth.uid());

