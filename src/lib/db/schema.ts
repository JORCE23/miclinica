import { pgTable, uuid, text, boolean, timestamp, date, integer, decimal, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // References auth.users(id)
  clinicId: uuid('clinic_id').references(() => clinics.id),
  role: text('role').notNull(),
  fullName: text('full_name').notNull(),
  rut: text('rut'),
  birthDate: date('birth_date'),
  phone: text('phone'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const medicalHistory = pgTable('medical_history', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  condition: text('condition').notNull(),
  diagnosedAt: date('diagnosed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const allergies = pgTable('allergies', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  allergen: text('allergen').notNull(),
  severity: text('severity').default('leve'),
  reaction: text('reaction'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const aestheticProceduresHistory = pgTable('aesthetic_procedures_history', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  procedureName: text('procedure_name').notNull(),
  performedAt: date('performed_at').notNull(),
  performedBy: text('performed_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').default(60),
  price: decimal('price', { precision: 10, scale: 2 }),
  loyaltyPointsEarned: integer('loyalty_points_earned').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').default(60),
  status: text('status').default('pendiente'),
  notes: text('notes'),
  price: decimal('price', { precision: 10, scale: 2 }),
  createdBy: uuid('created_by').references(() => profiles.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const loyaltyAccounts = pgTable('loyalty_accounts', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  totalPoints: integer('total_points').default(0),
  lifetimePoints: integer('lifetime_points').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.clinicId, t.patientId)
}));

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => profiles.id).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  type: text('type').notNull(),
  points: integer('points').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
