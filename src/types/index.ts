// types/index.ts

export type UserRole = "clinic_admin" | "client";

export type AppointmentStatus =
  | "pendiente" | "confirmada" | "completada"
  | "cancelada" | "no_asistio";

export type AllergySeverity = "leve" | "moderada" | "severa";

export type LoyaltyTransactionType = "ganados" | "canjeados" | "ajuste" | "expirados";

export type PaymentMethod = "tarjeta" | "transferencia" | "efectivo";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  clinic_id: string;
  role: UserRole;
  full_name: string;
  rut?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // calculado
  age?: number;
  // nuevos
  source?: 'meta_ads' | 'google' | 'referido' | 'organico' | 'directo' | 'whatsapp' | 'otro';
  tags?: string[];
}

export interface MedicalHistory {
  id: string;
  clinic_id: string;
  patient_id: string;
  condition: string;
  diagnosed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Allergy {
  id: string;
  clinic_id: string;
  patient_id: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string;
  created_at: string;
}

export interface AestheticProcedureHistory {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_name: string;
  performed_at: string;
  performed_by?: string;
  notes?: string;
  before_image_url?: string;
  after_image_url?: string;
  facial_diagram_data?: any;
  created_at: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  loyalty_points_earned: number;
  is_active: boolean;
  
  // Nuevos campos del Libro Maestro de Procedimientos
  category?: string;
  section?: string;
  service_code?: string;
  zones?: string[];
  reference_products?: string[];
  dose_units?: string;
  application_route?: string;
  clinical_duration_min?: number;
  effect_onset?: string;
  effect_duration?: string;
  recommended_sessions?: string;
  sessions_interval?: string;
  recovery_time?: string;
  indications?: string[];
  use_general_contraindications?: boolean;
  use_toxin_contraindications?: boolean;
  post_care_type?: string;
  requires_consent?: boolean;
  requires_clinical_photo?: boolean;
  custom_field?: string;
}

export interface Professional {
  id: string;
  clinic_id: string;
  full_name: string;
  specialty?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  clinic_id: string;
  name: string;
  type: string;
  channel: 'meta' | 'google' | 'organico' | 'email' | 'whatsapp' | 'otro';
  status: 'activa' | 'pausada' | 'finalizada';
  start_date?: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  reach?: number;
  conversions?: number;
  leads_generated: number;
  appointments_gen: number;
  sales_generated?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  notes?: string;
  created_at: string;
  // calculados
  cpl?: number;
  cpa?: number;
  roi?: number;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  service_id?: string;
  professional_id?: string;
  campaign_id?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  payment_method?: PaymentMethod;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joins
  patient?: Profile;
  service?: Service;
  professional?: Professional;
}

export interface LoyaltyAccount {
  id: string;
  clinic_id: string;
  patient_id: string;
  total_points: number;
  lifetime_points: number;
}

export interface LoyaltyTransaction {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id?: string;
  type: LoyaltyTransactionType;
  points: number;
  description?: string;
  created_at: string;
}

