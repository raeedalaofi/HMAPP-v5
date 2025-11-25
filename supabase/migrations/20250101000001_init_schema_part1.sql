-- =====================================================
-- HMAPP v5.0 - PART 1: CORE SCHEMA
-- =====================================================
-- نظام سوق الخدمات الحرفية المتكامل
-- تاريخ الإنشاء: 2025
-- =====================================================

SET search_path = public;

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- 2. ENUM TYPES
-- =====================================================

-- أدوار المستخدمين
CREATE TYPE user_role AS ENUM (
  'customer',
  'technician',
  'company_owner',
  'admin',
  'super_admin'
);

-- حالة التحقق
CREATE TYPE verification_status AS ENUM (
  'unverified',
  'email_verified',
  'phone_verified',
  'fully_verified',
  'identity_verified'
);

-- الجنس
CREATE TYPE gender_type AS ENUM (
  'male',
  'female',
  'not_specified'
);

-- حالات الوظيفة
CREATE TYPE job_status AS ENUM (
  'draft',
  'waiting_for_offers',
  'offers_expired',
  'assigned',
  'payment_pending',
  'payment_expired',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

-- حالات العرض
CREATE TYPE offer_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'expired',
  'withdrawn'
);

-- حالات رابط الدفع
CREATE TYPE payment_link_status AS ENUM (
  'pending',
  'paid',
  'expired',
  'cancelled',
  'refunded'
);

-- حالات الـ Batch
CREATE TYPE batch_status AS ENUM (
  'active',
  'ready',
  'processing',
  'completed'
);

-- حالات الفني
CREATE TYPE technician_status AS ENUM (
  'pending_approval',
  'active',
  'suspended',
  'inactive',
  'banned'
);

-- حالات الشركة
CREATE TYPE company_status AS ENUM (
  'pending_verification',
  'active',
  'suspended',
  'inactive'
);

-- أنواع الإشعارات
CREATE TYPE notification_type AS ENUM (
  'new_job_nearby',
  'offer_received',
  'offer_accepted',
  'offer_rejected',
  'payment_received',
  'job_started',
  'job_completed',
  'new_review',
  'review_response',
  'system_alert',
  'promotion'
);

-- منصات الأجهزة
CREATE TYPE device_platform AS ENUM (
  'ios',
  'android',
  'web'
);

-- =====================================================
-- 3. CORE TABLES
-- =====================================================

-- -----------------------------------------------------
-- 3.1 الملفات الشخصية (User Profiles)
-- -----------------------------------------------------
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- المعلومات الأساسية
  full_name             TEXT NOT NULL,
  email                 TEXT,
  phone                 TEXT,
  phone_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- البروفايل
  avatar_url            TEXT,
  bio                   TEXT,
  date_of_birth         DATE,
  gender                gender_type DEFAULT 'not_specified',
  
  -- التحقق والأمان
  role                  user_role NOT NULL,
  verification          verification_status NOT NULL DEFAULT 'unverified',
  identity_number       TEXT,
  identity_verified_at  TIMESTAMPTZ,
  
  -- الموقع
  default_location      GEOGRAPHY(POINT, 4326),
  city                  TEXT,
  district              TEXT,
  
  -- الإعدادات
  language              TEXT NOT NULL DEFAULT 'ar',
  notification_settings JSONB DEFAULT '{
    "push_enabled": true,
    "email_enabled": true,
    "sms_enabled": false,
    "new_jobs": true,
    "offers": true,
    "reviews": true,
    "promotions": true
  }'::jsonb,
  
  -- التتبع
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$')
);

-- -----------------------------------------------------
-- 3.2 العملاء (Customers)
-- -----------------------------------------------------
CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  profile_id        UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE RESTRICT,
  
  -- الإحصائيات
  total_jobs        INTEGER NOT NULL DEFAULT 0,
  completed_jobs    INTEGER NOT NULL DEFAULT 0,
  cancelled_jobs    INTEGER NOT NULL DEFAULT 0,
  total_spent       NUMERIC(14,2) NOT NULL DEFAULT 0,
  
  -- التقييم (من الفنيين)
  rating            NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews     INTEGER NOT NULL DEFAULT 0,
  
  -- الحالة
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_blocked        BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason    TEXT,
  blocked_at        TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.3 الشركات (Companies)
-- -----------------------------------------------------
CREATE TABLE companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  profile_id          UUID REFERENCES user_profiles(id) ON DELETE RESTRICT,
  
  -- معلومات الشركة
  name                TEXT NOT NULL,
  name_en             TEXT,
  logo_url            TEXT,
  cover_url           TEXT,
  description         TEXT,
  phone               TEXT,
  email               TEXT,
  website             TEXT,
  
  -- التوثيق
  commercial_register TEXT,
  cr_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  cr_document_url     TEXT,
  tax_number          TEXT,
  
  -- العنوان
  address             TEXT,
  city                TEXT,
  location            GEOGRAPHY(POINT, 4326),
  
  -- البنك
  bank_name           TEXT,
  bank_account        TEXT,
  iban                TEXT,
  
  -- الإعدادات
  batch_size          INTEGER NOT NULL DEFAULT 5 CHECK (batch_size >= 1 AND batch_size <= 100),
  commission_rate     NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 50),
  
  -- الإحصائيات
  total_technicians   INTEGER NOT NULL DEFAULT 0,
  active_technicians  INTEGER NOT NULL DEFAULT 0,
  total_jobs          INTEGER NOT NULL DEFAULT 0,
  completed_jobs      INTEGER NOT NULL DEFAULT 0,
  total_revenue       NUMERIC(14,2) NOT NULL DEFAULT 0,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews       INTEGER NOT NULL DEFAULT 0,
  
  -- الحالة
  status              company_status NOT NULL DEFAULT 'pending_verification',
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES auth.users(id)
);

-- -----------------------------------------------------
-- 3.4 الفنيون (Technicians)
-- -----------------------------------------------------
CREATE TABLE technicians (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  profile_id            UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE RESTRICT,
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  
  -- معلومات إضافية
  employee_number       TEXT,
  specialization        TEXT,
  experience_years      INTEGER DEFAULT 0,
  
  -- التوثيق
  license_number        TEXT,
  license_expiry        DATE,
  license_document_url  TEXT,
  
  -- الإحصائيات
  rating                NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews         INTEGER NOT NULL DEFAULT 0,
  jobs_done             INTEGER NOT NULL DEFAULT 0,
  jobs_cancelled        INTEGER NOT NULL DEFAULT 0,
  total_earnings        NUMERIC(14,2) NOT NULL DEFAULT 0,
  
  -- الموقع والتوفر
  current_location      GEOGRAPHY(POINT, 4326),
  location_updated_at   TIMESTAMPTZ,
  is_online             BOOLEAN NOT NULL DEFAULT FALSE,
  is_available          BOOLEAN NOT NULL DEFAULT TRUE,
  service_radius_km     INTEGER NOT NULL DEFAULT 10,
  
  -- الحالة
  status                technician_status NOT NULL DEFAULT 'pending_approval',
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at          TIMESTAMPTZ,
  activated_by          UUID REFERENCES auth.users(id),
  
  CONSTRAINT technician_must_have_company CHECK (company_id IS NOT NULL)
);

-- -----------------------------------------------------
-- 3.5 أجهزة المستخدمين (User Devices)
-- -----------------------------------------------------
CREATE TABLE user_devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  device_token    TEXT NOT NULL,
  platform        device_platform NOT NULL,
  device_name     TEXT,
  device_model    TEXT,
  os_version      TEXT,
  app_version     TEXT,
  
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, device_token)
);

-- -----------------------------------------------------
-- 3.6 رموز التحقق (Verification Codes)
-- -----------------------------------------------------
CREATE TABLE verification_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  target          TEXT NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('email', 'phone')),
  code            TEXT NOT NULL,
  purpose         TEXT NOT NULL DEFAULT 'verification',
  
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  
  expires_at      TIMESTAMPTZ NOT NULL,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_attempts CHECK (attempts <= max_attempts + 1)
);

-- -----------------------------------------------------
-- 3.7 فئات الخدمات (Service Categories)
-- -----------------------------------------------------
CREATE TABLE service_categories (
  id              BIGSERIAL PRIMARY KEY,
  parent_id       BIGINT REFERENCES service_categories(id) ON DELETE SET NULL,
  
  name            TEXT NOT NULL,
  name_en         TEXT,
  description     TEXT,
  icon            TEXT,
  image_url       TEXT,
  
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.8 مهارات الفنيين (Technician Skills)
-- -----------------------------------------------------
CREATE TABLE technician_skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  category_id     BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  
  proficiency     INTEGER DEFAULT 3 CHECK (proficiency >= 1 AND proficiency <= 5),
  years_experience INTEGER DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(technician_id, category_id)
);

-- -----------------------------------------------------
-- 3.9 أوقات عمل الفنيين (Working Hours)
-- -----------------------------------------------------
CREATE TABLE technician_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  
  day_of_week     INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(technician_id, day_of_week),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- -----------------------------------------------------
-- 3.10 مناطق الخدمة (Service Areas)
-- -----------------------------------------------------
CREATE TABLE service_areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id   UUID REFERENCES technicians(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  area_name       TEXT NOT NULL,
  city            TEXT NOT NULL,
  district        TEXT,
  polygon         GEOGRAPHY(POLYGON, 4326),
  center_point    GEOGRAPHY(POINT, 4326),
  radius_km       INTEGER,
  
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT must_have_owner CHECK (
    (technician_id IS NOT NULL AND company_id IS NULL) OR
    (technician_id IS NULL AND company_id IS NOT NULL)
  )
);

-- -----------------------------------------------------
-- 3.11 عناوين العملاء (Customer Addresses)
-- -----------------------------------------------------
CREATE TABLE customer_addresses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  label             TEXT NOT NULL DEFAULT 'المنزل',
  address_line1     TEXT NOT NULL,
  address_line2     TEXT,
  city              TEXT NOT NULL,
  district          TEXT,
  postal_code       TEXT,
  
  location          GEOGRAPHY(POINT, 4326),
  building_number   TEXT,
  floor_number      TEXT,
  apartment_number  TEXT,
  landmark          TEXT,
  
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- =====================================================
-- HMAPP v5.0 - PART 2: JOBS, PAYMENTS & REVIEWS
-- =====================================================

-- -----------------------------------------------------
-- 3.12 الوظائف/الطلبات (Jobs)
-- -----------------------------------------------------
CREATE TABLE jobs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number              TEXT UNIQUE,
  
  customer_id             UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  technician_id           UUID REFERENCES technicians(id) ON DELETE SET NULL,
  company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
  address_id              UUID NOT NULL REFERENCES customer_addresses(id) ON DELETE RESTRICT,
  category_id             BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  
  -- التفاصيل
  title                   TEXT NOT NULL,
  description             TEXT,
  urgency_level           INTEGER DEFAULT 1 CHECK (urgency_level >= 1 AND urgency_level <= 3),
  
  -- الموقع
  job_location            GEOGRAPHY(POINT, 4326),
  job_address             TEXT,
  job_city                TEXT,
  
  -- الحالة والتايمرات
  status                  job_status NOT NULL DEFAULT 'draft',
  offer_window_expires_at TIMESTAMPTZ,
  payment_expires_at      TIMESTAMPTZ,
  
  -- الأسعار
  estimated_price_min     NUMERIC(12,2),
  estimated_price_max     NUMERIC(12,2),
  final_price             NUMERIC(12,2),
  reward_discount         NUMERIC(12,2) DEFAULT 0,
  platform_fee            NUMERIC(12,2) DEFAULT 0,
  amount_to_pay           NUMERIC(12,2),
  amount_paid             NUMERIC(12,2),
  
  -- العروض
  offers_count            INTEGER NOT NULL DEFAULT 0,
  
  -- الأوقات
  preferred_date          DATE,
  preferred_time_start    TIME,
  preferred_time_end      TIME,
  scheduled_at            TIMESTAMPTZ,
  started_at              TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  
  -- الإلغاء
  cancellation_reason     TEXT,
  cancelled_by            UUID REFERENCES auth.users(id),
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.13 صور الوظائف (Job Photos)
-- -----------------------------------------------------
CREATE TABLE job_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  photo_type      TEXT NOT NULL DEFAULT 'before' CHECK (photo_type IN ('before', 'after', 'during', 'issue')),
  caption         TEXT,
  
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.14 عروض الأسعار (Price Offers)
-- -----------------------------------------------------
CREATE TABLE price_offers (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id             UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  
  amount                    NUMERIC(12,2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  status                    offer_status NOT NULL DEFAULT 'pending',
  message                   TEXT,
  estimated_duration_minutes INTEGER,
  breakdown                 JSONB,
  
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at                TIMESTAMPTZ,
  decided_at                TIMESTAMPTZ,
  
  UNIQUE(job_id, technician_id)
);

-- -----------------------------------------------------
-- 3.15 روابط الدفع (Payment Links)
-- -----------------------------------------------------
CREATE TABLE payment_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE RESTRICT,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  technician_id     UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  
  -- المبالغ
  subtotal          NUMERIC(12,2) NOT NULL CHECK (subtotal > 0),
  reward_discount   NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (reward_discount >= 0),
  platform_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  
  -- الرابط
  payment_url       TEXT,
  token             TEXT UNIQUE,
  status            payment_link_status NOT NULL DEFAULT 'pending',
  expires_at        TIMESTAMPTZ NOT NULL,
  
  -- معلومات الدفع
  payment_method    TEXT,
  payment_gateway   TEXT,
  payment_reference TEXT,
  gateway_response  JSONB,
  paid_at           TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.16 نظام الـ Batches
-- -----------------------------------------------------
CREATE TABLE company_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number    TEXT UNIQUE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  
  jobs_completed  INTEGER NOT NULL DEFAULT 0,
  target_jobs     INTEGER NOT NULL,
  status          batch_status NOT NULL DEFAULT 'active',
  
  -- المالية
  total_revenue   NUMERIC(12,2) NOT NULL DEFAULT 0,
  company_share   NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee    NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- السحب
  can_withdraw    BOOLEAN GENERATED ALWAYS AS (
    status = 'ready' AND jobs_completed >= target_jobs
  ) STORED,
  withdrawn_at    TIMESTAMPTZ,
  withdrawn_by    UUID REFERENCES auth.users(id),
  withdrawal_ref  TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  
  CONSTRAINT batch_progress_valid CHECK (jobs_completed <= target_jobs)
);

-- -----------------------------------------------------
-- 3.17 المحافظ (Wallets)
-- -----------------------------------------------------
CREATE TABLE wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type      TEXT NOT NULL CHECK (owner_type IN ('customer', 'company', 'platform')),
  owner_id        UUID NOT NULL,
  
  balance         NUMERIC(14,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_spent     NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0,
  
  currency        TEXT NOT NULL DEFAULT 'SAR',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(owner_type, owner_id),
  CONSTRAINT wallet_balance_non_negative CHECK (balance >= 0)
);

-- -----------------------------------------------------
-- 3.18 معاملات المحافظ (Wallet Transactions)
-- -----------------------------------------------------
CREATE TABLE wallet_transactions (
  id              BIGSERIAL PRIMARY KEY,
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
  job_id          UUID REFERENCES jobs(id) ON DELETE SET NULL,
  batch_id        UUID REFERENCES company_batches(id) ON DELETE SET NULL,
  
  direction       TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  balance_before  NUMERIC(14,2) NOT NULL,
  balance_after   NUMERIC(14,2) NOT NULL,
  
  tx_type         TEXT NOT NULL,
  description     TEXT,
  reference       TEXT UNIQUE,
  metadata        JSONB,
  
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);

-- -----------------------------------------------------
-- 3.19 تقييمات الفنيين (من العملاء)
-- -----------------------------------------------------
CREATE TABLE job_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID UNIQUE NOT NULL REFERENCES jobs(id) ON DELETE SET NULL,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  technician_id   UUID NOT NULL REFERENCES technicians(id) ON DELETE SET NULL,
  
  -- التقييم الرئيسي
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- التقييمات الفرعية
  quality_rating  INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timing_rating   INTEGER CHECK (timing_rating >= 1 AND timing_rating <= 5),
  behavior_rating INTEGER CHECK (behavior_rating >= 1 AND behavior_rating <= 5),
  price_rating    INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  
  comment         TEXT,
  photos          TEXT[],
  
  -- رد الفني
  response        TEXT,
  response_at     TIMESTAMPTZ,
  
  -- الإشراف
  is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
  is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason     TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.20 تقييمات العملاء (من الفنيين) - النظام المتبادل
-- -----------------------------------------------------
CREATE TABLE customer_reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                UUID UNIQUE NOT NULL REFERENCES jobs(id) ON DELETE SET NULL,
  technician_id         UUID NOT NULL REFERENCES technicians(id) ON DELETE SET NULL,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE SET NULL,
  
  -- التقييم الرئيسي
  rating                INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- التقييمات الفرعية
  communication_rating  INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  location_accuracy_rating INTEGER CHECK (location_accuracy_rating >= 1 AND location_accuracy_rating <= 5),
  payment_rating        INTEGER CHECK (payment_rating >= 1 AND payment_rating <= 5),
  
  comment               TEXT,
  
  is_visible            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.21 الرسائل (Messages)
-- -----------------------------------------------------
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  message_type    TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'location', 'system')),
  body            TEXT,
  media_url       TEXT,
  
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.22 الإشعارات (Notifications)
-- -----------------------------------------------------
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT,
  
  data            JSONB,
  action_url      TEXT,
  
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  
  is_sent         BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,
  send_error      TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

-- -----------------------------------------------------
-- 3.23 المسؤولون (Admin Users)
-- -----------------------------------------------------
CREATE TABLE admin_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  role            TEXT NOT NULL DEFAULT 'operator',
  permissions     JSONB DEFAULT '[]'::jsonb,
  
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);

-- -----------------------------------------------------
-- 3.24 سجل الأحداث (Event Logs)
-- -----------------------------------------------------
CREATE TABLE event_logs (
  id              BIGSERIAL PRIMARY KEY,
  event_type      TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  
  user_id         UUID REFERENCES auth.users(id),
  ip_address      INET,
  user_agent      TEXT,
  
  resource_type   TEXT,
  resource_id     UUID,
  
  payload         JSONB,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.25 تقارير الإساءة (Abuse Reports)
-- -----------------------------------------------------
CREATE TABLE abuse_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES auth.users(id),
  
  reported_user_id  UUID REFERENCES auth.users(id),
  reported_job_id   UUID REFERENCES jobs(id),
  reported_review_id UUID,
  
  reason            TEXT NOT NULL,
  description       TEXT,
  evidence_urls     TEXT[],
  
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution        TEXT,
  resolved_by       UUID REFERENCES auth.users(id),
  resolved_at       TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.26 إعدادات النظام (System Settings)
-- -----------------------------------------------------
CREATE TABLE system_settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  description     TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

-- -----------------------------------------------------
-- 3.27 الأسئلة الشائعة (FAQs)
-- -----------------------------------------------------
CREATE TABLE faqs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  category        TEXT,
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3.28 الترقيات والعروض (Promotions)
-- -----------------------------------------------------
CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(12,2) NOT NULL,
  max_discount    NUMERIC(12,2),
  min_order       NUMERIC(12,2) DEFAULT 0,
  
  usage_limit     INTEGER,
  used_count      INTEGER NOT NULL DEFAULT 0,
  per_user_limit  INTEGER DEFAULT 1,
  
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  
  applicable_categories BIGINT[],
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);
-- =====================================================
-- HMAPP v5.0 - PART 3: INDEXES
-- =====================================================

-- User Profiles
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_user_profiles_email ON user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(default_location) WHERE default_location IS NOT NULL;

-- Customers
CREATE INDEX idx_customers_user ON customers(user_id);
CREATE INDEX idx_customers_profile ON customers(profile_id);
CREATE INDEX idx_customers_rating ON customers(rating DESC);
CREATE INDEX idx_customers_active ON customers(is_active) WHERE is_active = TRUE;

-- Companies
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_location ON companies USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX idx_companies_active ON companies(status) WHERE status = 'active';
CREATE INDEX idx_companies_featured ON companies(is_featured) WHERE is_featured = TRUE;

-- Technicians
CREATE INDEX idx_technicians_user ON technicians(user_id);
CREATE INDEX idx_technicians_company ON technicians(company_id);
CREATE INDEX idx_technicians_status ON technicians(status);
CREATE INDEX idx_technicians_rating ON technicians(rating DESC);
CREATE INDEX idx_technicians_active ON technicians(company_id, status) WHERE status = 'active';
CREATE INDEX idx_technicians_location ON technicians USING GIST(current_location) WHERE status = 'active' AND is_online = TRUE;
CREATE INDEX idx_technicians_available ON technicians(is_online, is_available, status) WHERE status = 'active';
CREATE INDEX idx_technicians_online ON technicians(company_id) WHERE is_online = TRUE AND status = 'active';

-- Jobs
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_technician ON jobs(technician_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_location ON jobs USING GIST(job_location) WHERE status = 'waiting_for_offers';
CREATE INDEX idx_jobs_timers ON jobs(offer_window_expires_at, payment_expires_at) WHERE status IN ('waiting_for_offers', 'payment_pending');
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_number ON jobs(job_number) WHERE job_number IS NOT NULL;
CREATE INDEX idx_jobs_waiting ON jobs(status, created_at DESC) WHERE status = 'waiting_for_offers';
CREATE INDEX idx_jobs_in_progress ON jobs(technician_id, status) WHERE status = 'in_progress';

-- Price Offers
CREATE INDEX idx_price_offers_job ON price_offers(job_id);
CREATE INDEX idx_price_offers_tech ON price_offers(technician_id);
CREATE INDEX idx_price_offers_pending ON price_offers(job_id, status) WHERE status = 'pending';
CREATE INDEX idx_price_offers_created ON price_offers(created_at DESC);

-- Payment Links
CREATE INDEX idx_payment_links_job ON payment_links(job_id);
CREATE INDEX idx_payment_links_status ON payment_links(status);
CREATE INDEX idx_payment_links_token ON payment_links(token) WHERE token IS NOT NULL;
CREATE INDEX idx_payment_links_expiring ON payment_links(expires_at, status) WHERE status = 'pending';
CREATE INDEX idx_payment_links_customer ON payment_links(customer_id);

-- Company Batches
CREATE INDEX idx_company_batches_company ON company_batches(company_id);
CREATE INDEX idx_company_batches_tech ON company_batches(technician_id);
CREATE INDEX idx_company_batches_active ON company_batches(company_id, technician_id, status) WHERE status = 'active';
CREATE INDEX idx_company_batches_ready ON company_batches(company_id, status) WHERE status = 'ready';
CREATE INDEX idx_company_batches_number ON company_batches(batch_number) WHERE batch_number IS NOT NULL;

-- Wallets
CREATE INDEX idx_wallets_owner ON wallets(owner_type, owner_id);
CREATE INDEX idx_wallets_customer ON wallets(owner_id) WHERE owner_type = 'customer';
CREATE INDEX idx_wallets_company ON wallets(owner_id) WHERE owner_type = 'company';

-- Wallet Transactions
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_tx_reference ON wallet_transactions(reference) WHERE reference IS NOT NULL;
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(tx_type);
CREATE INDEX idx_wallet_tx_job ON wallet_transactions(job_id) WHERE job_id IS NOT NULL;

-- Reviews
CREATE INDEX idx_job_reviews_tech ON job_reviews(technician_id);
CREATE INDEX idx_job_reviews_customer ON job_reviews(customer_id);
CREATE INDEX idx_job_reviews_rating ON job_reviews(rating DESC);
CREATE INDEX idx_job_reviews_visible ON job_reviews(technician_id, is_visible) WHERE is_visible = TRUE;
CREATE INDEX idx_job_reviews_created ON job_reviews(created_at DESC);

CREATE INDEX idx_customer_reviews_customer ON customer_reviews(customer_id);
CREATE INDEX idx_customer_reviews_tech ON customer_reviews(technician_id);
CREATE INDEX idx_customer_reviews_visible ON customer_reviews(customer_id, is_visible) WHERE is_visible = TRUE;

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unsent ON notifications(is_sent, created_at) WHERE is_sent = FALSE;

-- Messages
CREATE INDEX idx_messages_job ON messages(job_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(job_id, is_read) WHERE is_read = FALSE;

-- Event Logs
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
CREATE INDEX idx_event_logs_user ON event_logs(user_id);
CREATE INDEX idx_event_logs_resource ON event_logs(resource_type, resource_id);
CREATE INDEX idx_event_logs_created ON event_logs(created_at DESC);
CREATE INDEX idx_event_logs_severity ON event_logs(severity) WHERE severity IN ('error', 'critical');

-- Technician Skills
CREATE INDEX idx_tech_skills_tech ON technician_skills(technician_id);
CREATE INDEX idx_tech_skills_category ON technician_skills(category_id);
CREATE INDEX idx_tech_skills_verified ON technician_skills(technician_id, is_verified) WHERE is_verified = TRUE;

-- Service Categories
CREATE INDEX idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX idx_service_categories_active ON service_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_service_categories_order ON service_categories(display_order);

-- Service Areas
CREATE INDEX idx_service_areas_tech ON service_areas(technician_id) WHERE technician_id IS NOT NULL;
CREATE INDEX idx_service_areas_company ON service_areas(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_service_areas_polygon ON service_areas USING GIST(polygon) WHERE polygon IS NOT NULL;
CREATE INDEX idx_service_areas_center ON service_areas USING GIST(center_point) WHERE center_point IS NOT NULL;

-- Customer Addresses
CREATE INDEX idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_default ON customer_addresses(customer_id) WHERE is_default = TRUE;
CREATE INDEX idx_customer_addresses_location ON customer_addresses USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX idx_customer_addresses_active ON customer_addresses(customer_id, is_active) WHERE is_active = TRUE;

-- Verification Codes
CREATE INDEX idx_verification_codes_target ON verification_codes(target, target_type);
CREATE INDEX idx_verification_codes_user ON verification_codes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_valid ON verification_codes(target, code, expires_at) WHERE verified_at IS NULL;

-- User Devices
CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_token ON user_devices(device_token);
CREATE INDEX idx_user_devices_active ON user_devices(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_devices_platform ON user_devices(platform, user_id);

-- Abuse Reports
CREATE INDEX idx_abuse_reports_reporter ON abuse_reports(reporter_id);
CREATE INDEX idx_abuse_reports_status ON abuse_reports(status);
CREATE INDEX idx_abuse_reports_pending ON abuse_reports(status, created_at) WHERE status = 'pending';

-- Promotions
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_active ON promotions(is_active, starts_at, ends_at) WHERE is_active = TRUE;
CREATE INDEX idx_promotions_dates ON promotions(starts_at, ends_at);

-- FAQs
CREATE INDEX idx_faqs_category ON faqs(category);
CREATE INDEX idx_faqs_active ON faqs(is_active, display_order) WHERE is_active = TRUE;

-- Full Text Search Indexes
CREATE INDEX idx_jobs_title_search ON jobs USING GIN(to_tsvector('arabic', title));
CREATE INDEX idx_companies_name_search ON companies USING GIN(to_tsvector('arabic', name));
CREATE INDEX idx_service_categories_name_search ON service_categories USING GIN(to_tsvector('arabic', name));

-- Unique Constraints
CREATE UNIQUE INDEX idx_customer_addresses_one_default
  ON customer_addresses(customer_id)
  WHERE is_default = TRUE;

CREATE UNIQUE INDEX idx_one_active_batch_per_technician
  ON company_batches(technician_id)
  WHERE status = 'active';
-- =====================================================
-- HMAPP v5.0 - PART 4: HELPER FUNCTIONS & TRIGGERS
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- هل المستخدم admin؟
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$;

-- هل المستخدم super_admin؟
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
      AND is_active = TRUE 
      AND role = 'super_admin'
  );
$$;

-- هل المستخدم مدير الشركة؟
CREATE OR REPLACE FUNCTION is_company_manager(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM companies 
    WHERE id = p_company_id 
      AND owner_id = auth.uid()
      AND status = 'active'
  );
$$;

-- الحصول على معرف العميل
CREATE OR REPLACE FUNCTION get_customer_id(p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM customers 
  WHERE user_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

-- الحصول على معرف الفني
CREATE OR REPLACE FUNCTION get_technician_id(p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM technicians 
  WHERE user_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

-- الحصول على معرف الشركة
CREATE OR REPLACE FUNCTION get_company_id(p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM companies 
  WHERE owner_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

-- الحصول على دور المستخدم
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM user_profiles 
  WHERE user_id = COALESCE(p_user_id, auth.uid())
  LIMIT 1;
$$;

-- الحصول على batch النشط للفني
CREATE OR REPLACE FUNCTION get_active_batch(p_technician_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT id FROM company_batches
  WHERE technician_id = p_technician_id 
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- توليد رقم طلب فريد
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'JOB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
    SELECT EXISTS(SELECT 1 FROM jobs WHERE job_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$;

-- توليد رقم batch فريد
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_number := 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                UPPER(SUBSTRING(gen_random_uuid()::text, 1, 4));
    SELECT EXISTS(SELECT 1 FROM company_batches WHERE batch_number = v_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_number;
END;
$$;

-- توليد reference للمعاملات
CREATE OR REPLACE FUNCTION generate_tx_reference()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'TX-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || 
         UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
$$;

-- حساب المسافة بين نقطتين بالكيلومتر
CREATE OR REPLACE FUNCTION distance_km(
  p_point1 GEOGRAPHY,
  p_point2 GEOGRAPHY
)
RETURNS NUMERIC
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT ROUND((ST_Distance(p_point1, p_point2) / 1000)::numeric, 2);
$$;

-- تحويل إحداثيات لـ Geography Point
CREATE OR REPLACE FUNCTION make_point(
  p_latitude NUMERIC,
  p_longitude NUMERIC
)
RETURNS GEOGRAPHY
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- تطبيق على الجداول
CREATE TRIGGER trg_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_technicians_updated BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customer_addresses_updated BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_job_reviews_updated BEFORE UPDATE ON job_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_service_categories_updated BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------
-- توليد رقم الطلب تلقائياً
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.job_number IS NULL THEN
    NEW.job_number := generate_job_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_job_number
BEFORE INSERT ON jobs
FOR EACH ROW EXECUTE FUNCTION set_job_number();

-- -----------------------------------------------------
-- توليد رقم الـ batch تلقائياً
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION set_batch_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.batch_number IS NULL THEN
    NEW.batch_number := generate_batch_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_batch_number
BEFORE INSERT ON company_batches
FOR EACH ROW EXECUTE FUNCTION set_batch_number();

-- -----------------------------------------------------
-- إنشاء محفظة العميل (100 ريال مكافأة)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION create_customer_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  INSERT INTO wallets (owner_type, owner_id, balance, total_earned)
  VALUES ('customer', NEW.id, 100.00, 100.00)
  RETURNING id INTO v_wallet_id;
  
  INSERT INTO wallet_transactions (
    wallet_id, direction, amount, balance_before, balance_after,
    tx_type, description, reference, metadata, created_by
  )
  VALUES (
    v_wallet_id, 'credit', 100.00, 0, 100.00,
    'signup_bonus',
    'رصيد ترحيبي - 4 خصومات × 25 ريال',
    generate_tx_reference(),
    jsonb_build_object('customer_id', NEW.id, 'bonus_type', 'signup'),
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_customer_wallet
AFTER INSERT ON customers
FOR EACH ROW EXECUTE FUNCTION create_customer_wallet();

-- -----------------------------------------------------
-- إنشاء محفظة الشركة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION create_company_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO wallets (owner_type, owner_id, balance)
  VALUES ('company', NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_company_wallet
AFTER INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION create_company_wallet();

-- -----------------------------------------------------
-- إنشاء batch عند تفعيل الفني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION initialize_technician_batch()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_size INTEGER;
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending_approval' THEN
    SELECT batch_size INTO v_batch_size
    FROM companies WHERE id = NEW.company_id;
    
    INSERT INTO company_batches (
      company_id, technician_id, 
      jobs_completed, target_jobs, status
    )
    VALUES (
      NEW.company_id, NEW.id,
      0, COALESCE(v_batch_size, 5), 'active'
    );
    
    UPDATE companies
    SET active_technicians = active_technicians + 1
    WHERE id = NEW.company_id;
  END IF;
  
  IF NEW.status IN ('suspended', 'inactive', 'banned') AND OLD.status = 'active' THEN
    UPDATE companies
    SET active_technicians = GREATEST(0, active_technicians - 1)
    WHERE id = NEW.company_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_initialize_technician_batch
AFTER UPDATE OF status ON technicians
FOR EACH ROW EXECUTE FUNCTION initialize_technician_batch();

-- -----------------------------------------------------
-- تحديث عداد الفنيين
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_company_tech_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE companies
    SET total_technicians = total_technicians + 1
    WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE companies
    SET 
      total_technicians = GREATEST(0, total_technicians - 1),
      active_technicians = CASE 
        WHEN OLD.status = 'active' THEN GREATEST(0, active_technicians - 1)
        ELSE active_technicians
      END
    WHERE id = OLD.company_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_company_tech_count
AFTER INSERT OR DELETE ON technicians
FOR EACH ROW EXECUTE FUNCTION update_company_tech_count();

-- -----------------------------------------------------
-- بدء نافذة العروض
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION start_offer_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'waiting_for_offers' AND OLD.status = 'draft' THEN
    NEW.offer_window_expires_at := NOW() + INTERVAL '5 minutes';
    
    IF NEW.job_location IS NULL THEN
      SELECT location, address_line1 || ', ' || city, city
      INTO NEW.job_location, NEW.job_address, NEW.job_city
      FROM customer_addresses
      WHERE id = NEW.address_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_start_offer_window
BEFORE UPDATE OF status ON jobs
FOR EACH ROW EXECUTE FUNCTION start_offer_window();

-- -----------------------------------------------------
-- تحديث عداد العروض
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_job_offers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs SET offers_count = offers_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs SET offers_count = GREATEST(0, offers_count - 1) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_job_offers_count
AFTER INSERT OR DELETE ON price_offers
FOR EACH ROW EXECUTE FUNCTION update_job_offers_count();

-- -----------------------------------------------------
-- تحديث تقييم الفني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_technician_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE technicians
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM job_reviews
      WHERE technician_id = NEW.technician_id AND is_visible = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM job_reviews
      WHERE technician_id = NEW.technician_id AND is_visible = TRUE
    )
  WHERE id = NEW.technician_id;
  
  -- تحديث تقييم الشركة
  UPDATE companies c
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(t.rating)::numeric, 2), 0)
      FROM technicians t
      WHERE t.company_id = c.id AND t.status = 'active'
    ),
    total_reviews = (
      SELECT COALESCE(SUM(t.total_reviews), 0)
      FROM technicians t
      WHERE t.company_id = c.id AND t.status = 'active'
    )
  WHERE c.id = (SELECT company_id FROM technicians WHERE id = NEW.technician_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_technician_rating
AFTER INSERT OR UPDATE OF rating, is_visible ON job_reviews
FOR EACH ROW EXECUTE FUNCTION update_technician_rating();

-- -----------------------------------------------------
-- تحديث تقييم العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_customer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM customer_reviews
      WHERE customer_id = NEW.customer_id AND is_visible = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM customer_reviews
      WHERE customer_id = NEW.customer_id AND is_visible = TRUE
    )
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_customer_rating
AFTER INSERT OR UPDATE OF rating, is_visible ON customer_reviews
FOR EACH ROW EXECUTE FUNCTION update_customer_rating();

-- -----------------------------------------------------
-- تحديث إحصائيات العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
    UPDATE customers
    SET 
      completed_jobs = completed_jobs + 1,
      total_spent = total_spent + COALESCE(NEW.amount_paid, 0)
    WHERE id = NEW.customer_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status NOT IN ('cancelled', 'completed') THEN
    UPDATE customers
    SET cancelled_jobs = cancelled_jobs + 1
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_customer_stats
AFTER UPDATE OF status ON jobs
FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- -----------------------------------------------------
-- إرسال إشعارات للفنيين القريبين
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_nearby_technicians()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_technician RECORD;
  v_job_location GEOGRAPHY;
  v_notification_radius_km NUMERIC := 2;
BEGIN
  IF NEW.status <> 'waiting_for_offers' OR 
     (OLD IS NOT NULL AND OLD.status = 'waiting_for_offers') THEN
    RETURN NEW;
  END IF;
  
  v_job_location := NEW.job_location;
  
  IF v_job_location IS NULL THEN
    SELECT location INTO v_job_location
    FROM customer_addresses WHERE id = NEW.address_id;
  END IF;
  
  IF v_job_location IS NULL THEN
    RETURN NEW;
  END IF;
  
  FOR v_technician IN 
    SELECT t.id, t.user_id, up.full_name
    FROM technicians t
    JOIN user_profiles up ON t.profile_id = up.id
    JOIN technician_skills ts ON t.id = ts.technician_id
    WHERE t.status = 'active'
      AND t.is_online = TRUE
      AND t.is_available = TRUE
      AND t.current_location IS NOT NULL
      AND ts.category_id = NEW.category_id
      AND ST_DWithin(t.current_location, v_job_location, v_notification_radius_km * 1000)
  LOOP
    INSERT INTO notifications (
      recipient_id, type, title, body, data
    )
    VALUES (
      v_technician.user_id,
      'new_job_nearby',
      'طلب جديد في منطقتك 📍',
      NEW.title,
      jsonb_build_object(
        'job_id', NEW.id,
        'job_number', NEW.job_number,
        'category_id', NEW.category_id,
        'expires_at', NEW.offer_window_expires_at
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_nearby_technicians
AFTER INSERT OR UPDATE OF status ON jobs
FOR EACH ROW EXECUTE FUNCTION notify_nearby_technicians();

-- -----------------------------------------------------
-- منع أكثر من عنوان افتراضي
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE customer_addresses
    SET is_default = FALSE
    WHERE customer_id = NEW.customer_id
      AND id <> NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_single_default_address
BEFORE INSERT OR UPDATE OF is_default ON customer_addresses
FOR EACH ROW
WHEN (NEW.is_default = TRUE)
EXECUTE FUNCTION ensure_single_default_address();
-- =====================================================
-- HMAPP v5.0 - PART 5: REGISTRATION & AUTH FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 5.1 تسجيل عميل جديد
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION register_customer(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_customer_id UUID;
BEGIN
  -- التحقق من عدم وجود تسجيل سابق
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already registered';
  END IF;
  
  -- إنشاء الملف الشخصي
  INSERT INTO user_profiles (
    user_id, full_name, phone, email, role, verification
  )
  VALUES (
    p_user_id, p_full_name, p_phone, p_email, 'customer', 'unverified'
  )
  RETURNING id INTO v_profile_id;
  
  -- إنشاء سجل العميل
  INSERT INTO customers (user_id, profile_id)
  VALUES (p_user_id, v_profile_id)
  RETURNING id INTO v_customer_id;
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('customer_registered', p_user_id, 'customer', v_customer_id, 
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone));
  
  RETURN jsonb_build_object(
    'success', true,
    'customer_id', v_customer_id,
    'profile_id', v_profile_id,
    'wallet_balance', 100.00,
    'message', 'تم التسجيل بنجاح! حصلت على 100 ريال رصيد ترحيبي'
  );
END;
$$;

-- -----------------------------------------------------
-- 5.2 تسجيل شركة جديدة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION register_company(
  p_user_id UUID,
  p_owner_name TEXT,
  p_company_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_commercial_register TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_company_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already registered';
  END IF;
  
  -- إنشاء الملف الشخصي للمالك
  INSERT INTO user_profiles (
    user_id, full_name, phone, email, role, verification
  )
  VALUES (
    p_user_id, p_owner_name, p_phone, p_email, 'company_owner', 'unverified'
  )
  RETURNING id INTO v_profile_id;
  
  -- إنشاء الشركة
  INSERT INTO companies (
    owner_id, profile_id, name, phone, email, 
    commercial_register, city, status
  )
  VALUES (
    p_user_id, v_profile_id, p_company_name, p_phone, p_email, 
    p_commercial_register, p_city, 'pending_verification'
  )
  RETURNING id INTO v_company_id;
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('company_registered', p_user_id, 'company', v_company_id,
    jsonb_build_object('company_name', p_company_name, 'owner_name', p_owner_name));
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_company_id,
    'profile_id', v_profile_id,
    'status', 'pending_verification',
    'message', 'تم تسجيل الشركة بنجاح. سيتم مراجعة طلبك خلال 24 ساعة'
  );
END;
$$;

-- -----------------------------------------------------
-- 5.3 تسجيل فني جديد
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION register_technician(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_id UUID,
  p_email TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_technician_id UUID;
  v_company companies%ROWTYPE;
BEGIN
  -- التحقق من وجود الشركة
  SELECT * INTO v_company FROM companies WHERE id = p_company_id AND status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found or not active';
  END IF;
  
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User already registered';
  END IF;
  
  -- إنشاء الملف الشخصي
  INSERT INTO user_profiles (
    user_id, full_name, phone, email, role, verification
  )
  VALUES (
    p_user_id, p_full_name, p_phone, p_email, 'technician', 'unverified'
  )
  RETURNING id INTO v_profile_id;
  
  -- إنشاء سجل الفني
  INSERT INTO technicians (
    user_id, profile_id, company_id, specialization, status
  )
  VALUES (
    p_user_id, v_profile_id, p_company_id, p_specialization, 'pending_approval'
  )
  RETURNING id INTO v_technician_id;
  
  -- إرسال إشعار لمدير الشركة
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_company.owner_id,
    'system_alert',
    'طلب انضمام فني جديد 👤',
    p_full_name || ' يريد الانضمام إلى شركتك',
    jsonb_build_object('technician_id', v_technician_id, 'technician_name', p_full_name)
  );
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('technician_registered', p_user_id, 'technician', v_technician_id,
    jsonb_build_object('full_name', p_full_name, 'company_id', p_company_id));
  
  RETURN jsonb_build_object(
    'success', true,
    'technician_id', v_technician_id,
    'profile_id', v_profile_id,
    'company_name', v_company.name,
    'status', 'pending_approval',
    'message', 'تم التسجيل بنجاح. في انتظار موافقة الشركة'
  );
END;
$$;

-- -----------------------------------------------------
-- 5.4 إرسال رمز التحقق
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION send_verification_code(
  p_target TEXT,
  p_target_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_purpose TEXT DEFAULT 'verification'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_code_id UUID;
  v_recent_count INTEGER;
BEGIN
  IF p_target_type NOT IN ('email', 'phone') THEN
    RAISE EXCEPTION 'Invalid target type. Must be email or phone';
  END IF;
  
  -- Rate limiting
  SELECT COUNT(*) INTO v_recent_count
  FROM verification_codes 
  WHERE target = p_target 
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many verification attempts. Please try again in 1 hour.';
  END IF;
  
  -- إلغاء الرموز السابقة
  UPDATE verification_codes 
  SET expires_at = NOW()
  WHERE target = p_target AND verified_at IS NULL AND expires_at > NOW();
  
  -- توليد رمز جديد
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  INSERT INTO verification_codes (user_id, target, target_type, code, purpose, expires_at)
  VALUES (p_user_id, p_target, p_target_type, v_code, p_purpose, v_expires_at)
  RETURNING id INTO v_code_id;
  
  -- في الإنتاج: إرسال عبر SMS/Email service
  
  RETURN jsonb_build_object(
    'success', true,
    'code_id', v_code_id,
    'expires_at', v_expires_at,
    'expires_in_seconds', 600,
    'message', CASE 
      WHEN p_target_type = 'phone' THEN 'تم إرسال رمز التحقق إلى رقم الجوال'
      ELSE 'تم إرسال رمز التحقق إلى البريد الإلكتروني'
    END
    -- للتطوير فقط:
    -- ,'debug_code', v_code
  );
END;
$$;

-- -----------------------------------------------------
-- 5.5 التحقق من الرمز
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION verify_code(
  p_target TEXT,
  p_code TEXT,
  p_purpose TEXT DEFAULT 'verification'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record verification_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_record
  FROM verification_codes
  WHERE target = p_target 
    AND code = p_code
    AND purpose = p_purpose
    AND verified_at IS NULL
    AND expires_at > NOW()
    AND attempts < max_attempts
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    -- زيادة عداد المحاولات الفاشلة
    UPDATE verification_codes
    SET attempts = attempts + 1
    WHERE target = p_target 
      AND verified_at IS NULL 
      AND expires_at > NOW();
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'رمز التحقق غير صحيح أو منتهي الصلاحية'
    );
  END IF;
  
  -- تحديث الرمز كمُحقق
  UPDATE verification_codes
  SET verified_at = NOW()
  WHERE id = v_record.id;
  
  -- تحديث حالة التحقق
  IF v_record.user_id IS NOT NULL THEN
    IF v_record.target_type = 'email' THEN
      UPDATE user_profiles
      SET 
        email_verified = TRUE,
        verification = CASE 
          WHEN phone_verified THEN 'fully_verified'::verification_status
          ELSE 'email_verified'::verification_status
        END
      WHERE user_id = v_record.user_id;
    ELSIF v_record.target_type = 'phone' THEN
      UPDATE user_profiles
      SET 
        phone_verified = TRUE,
        verification = CASE 
          WHEN email_verified THEN 'fully_verified'::verification_status
          ELSE 'phone_verified'::verification_status
        END
      WHERE user_id = v_record.user_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_record.user_id,
    'message', 'تم التحقق بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 5.6 تحديث الملف الشخصي
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_profile(
  p_user_id UUID,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
  UPDATE user_profiles
  SET
    full_name = COALESCE(p_data->>'full_name', full_name),
    avatar_url = COALESCE(p_data->>'avatar_url', avatar_url),
    bio = COALESCE(p_data->>'bio', bio),
    date_of_birth = COALESCE((p_data->>'date_of_birth')::DATE, date_of_birth),
    gender = COALESCE((p_data->>'gender')::gender_type, gender),
    city = COALESCE(p_data->>'city', city),
    district = COALESCE(p_data->>'district', district),
    language = COALESCE(p_data->>'language', language),
    notification_settings = COALESCE(
      p_data->'notification_settings', 
      notification_settings
    ),
    last_active_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تحديث الملف الشخصي بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 5.7 تسجيل جهاز للإشعارات
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION register_device(
  p_user_id UUID,
  p_device_token TEXT,
  p_platform device_platform,
  p_device_name TEXT DEFAULT NULL,
  p_device_model TEXT DEFAULT NULL,
  p_app_version TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id UUID;
BEGIN
  INSERT INTO user_devices (
    user_id, device_token, platform, 
    device_name, device_model, app_version
  )
  VALUES (
    p_user_id, p_device_token, p_platform,
    p_device_name, p_device_model, p_app_version
  )
  ON CONFLICT (user_id, device_token) 
  DO UPDATE SET
    is_active = TRUE,
    last_used_at = NOW(),
    app_version = COALESCE(p_app_version, user_devices.app_version)
  RETURNING id INTO v_device_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'device_id', v_device_id
  );
END;
$$;

-- -----------------------------------------------------
-- 5.8 إلغاء تسجيل جهاز
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION unregister_device(
  p_user_id UUID,
  p_device_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_devices
  SET is_active = FALSE
  WHERE user_id = p_user_id AND device_token = p_device_token;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- -----------------------------------------------------
-- 5.9 الحصول على الملف الشخصي الكامل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_full_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile user_profiles%ROWTYPE;
  v_result JSONB;
  v_role user_role;
BEGIN
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'user_id', v_profile.user_id,
      'full_name', v_profile.full_name,
      'email', v_profile.email,
      'phone', v_profile.phone,
      'avatar_url', v_profile.avatar_url,
      'bio', v_profile.bio,
      'role', v_profile.role,
      'verification', v_profile.verification,
      'phone_verified', v_profile.phone_verified,
      'email_verified', v_profile.email_verified,
      'city', v_profile.city,
      'language', v_profile.language,
      'notification_settings', v_profile.notification_settings,
      'created_at', v_profile.created_at
    )
  );
  
  -- إضافة بيانات حسب الدور
  IF v_profile.role = 'customer' THEN
    SELECT v_result || jsonb_build_object(
      'customer', jsonb_build_object(
        'id', c.id,
        'total_jobs', c.total_jobs,
        'completed_jobs', c.completed_jobs,
        'total_spent', c.total_spent,
        'rating', c.rating,
        'total_reviews', c.total_reviews
      ),
      'wallet_balance', COALESCE(w.balance, 0)
    )
    INTO v_result
    FROM customers c
    LEFT JOIN wallets w ON w.owner_type = 'customer' AND w.owner_id = c.id
    WHERE c.user_id = p_user_id;
    
  ELSIF v_profile.role = 'technician' THEN
    SELECT v_result || jsonb_build_object(
      'technician', jsonb_build_object(
        'id', t.id,
        'company_id', t.company_id,
        'company_name', co.name,
        'status', t.status,
        'rating', t.rating,
        'total_reviews', t.total_reviews,
        'jobs_done', t.jobs_done,
        'total_earnings', t.total_earnings,
        'is_online', t.is_online,
        'is_available', t.is_available
      )
    )
    INTO v_result
    FROM technicians t
    JOIN companies co ON co.id = t.company_id
    WHERE t.user_id = p_user_id;
    
  ELSIF v_profile.role = 'company_owner' THEN
    SELECT v_result || jsonb_build_object(
      'company', jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'status', c.status,
        'total_technicians', c.total_technicians,
        'active_technicians', c.active_technicians,
        'total_jobs', c.total_jobs,
        'total_revenue', c.total_revenue,
        'rating', c.rating
      ),
      'wallet_balance', COALESCE(w.balance, 0)
    )
    INTO v_result
    FROM companies c
    LEFT JOIN wallets w ON w.owner_type = 'company' AND w.owner_id = c.id
    WHERE c.owner_id = p_user_id;
  END IF;
  
  RETURN v_result;
END;
$$;
-- =====================================================
-- HMAPP v5.0 - PART 6: LOCATION & SEARCH FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 6.1 تحديث موقع الفني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_technician_location(
  p_user_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_is_online BOOLEAN DEFAULT TRUE,
  p_is_available BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech_id UUID;
  v_location GEOGRAPHY;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  v_location := make_point(p_latitude, p_longitude);
  
  UPDATE technicians
  SET 
    current_location = v_location,
    location_updated_at = NOW(),
    is_online = p_is_online,
    is_available = p_is_available
  WHERE id = v_tech_id;
  
  -- تحديث آخر نشاط
  UPDATE user_profiles
  SET last_active_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'is_online', p_is_online,
    'is_available', p_is_available
  );
END;
$$;

-- -----------------------------------------------------
-- 6.2 تحديث حالة الاتصال فقط
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION set_technician_online_status(
  p_user_id UUID,
  p_is_online BOOLEAN,
  p_is_available BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE technicians
  SET 
    is_online = p_is_online,
    is_available = COALESCE(p_is_available, is_available),
    location_updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  RETURN jsonb_build_object('success', true, 'is_online', p_is_online);
END;
$$;

-- -----------------------------------------------------
-- 6.3 البحث عن فنيين قريبين
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION find_nearby_technicians(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_radius_km NUMERIC DEFAULT 2,
  p_category_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  technician_id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_id UUID,
  company_name TEXT,
  company_logo TEXT,
  specialization TEXT,
  rating NUMERIC,
  total_reviews INTEGER,
  jobs_done INTEGER,
  distance_km NUMERIC,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_point GEOGRAPHY;
BEGIN
  v_point := make_point(p_latitude, p_longitude);
  
  RETURN QUERY
  SELECT 
    t.id AS technician_id,
    t.user_id,
    up.full_name,
    up.avatar_url,
    up.phone,
    t.company_id,
    c.name AS company_name,
    c.logo_url AS company_logo,
    t.specialization,
    t.rating,
    t.total_reviews,
    t.jobs_done,
    ROUND((ST_Distance(t.current_location, v_point) / 1000)::NUMERIC, 2) AS distance_km,
    t.is_available
  FROM technicians t
  JOIN user_profiles up ON t.profile_id = up.id
  JOIN companies c ON t.company_id = c.id
  WHERE t.status = 'active'
    AND t.is_online = TRUE
    AND t.current_location IS NOT NULL
    AND ST_DWithin(t.current_location, v_point, p_radius_km * 1000)
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM technician_skills ts 
      WHERE ts.technician_id = t.id AND ts.category_id = p_category_id
    ))
  ORDER BY 
    t.is_available DESC,
    ST_Distance(t.current_location, v_point),
    t.rating DESC
  LIMIT p_limit;
END;
$$;

-- -----------------------------------------------------
-- 6.4 البحث عن فنيين بالفئة والمدينة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION search_technicians(
  p_category_id BIGINT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'rating',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  technician_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  specialization TEXT,
  city TEXT,
  rating NUMERIC,
  total_reviews INTEGER,
  jobs_done INTEGER,
  is_online BOOLEAN,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS technician_id,
    up.full_name,
    up.avatar_url,
    c.name AS company_name,
    t.specialization,
    up.city,
    t.rating,
    t.total_reviews,
    t.jobs_done,
    t.is_online,
    t.is_available
  FROM technicians t
  JOIN user_profiles up ON t.profile_id = up.id
  JOIN companies c ON t.company_id = c.id
  WHERE t.status = 'active'
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM technician_skills ts 
      WHERE ts.technician_id = t.id AND ts.category_id = p_category_id
    ))
    AND (p_city IS NULL OR up.city = p_city)
    AND (p_min_rating IS NULL OR t.rating >= p_min_rating)
  ORDER BY
    CASE WHEN p_sort_by = 'rating' THEN t.rating END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'reviews' THEN t.total_reviews END DESC,
    CASE WHEN p_sort_by = 'jobs' THEN t.jobs_done END DESC,
    t.is_online DESC,
    t.is_available DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- -----------------------------------------------------
-- 6.5 البحث عن شركات
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION search_companies(
  p_city TEXT DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  company_id UUID,
  name TEXT,
  logo_url TEXT,
  city TEXT,
  rating NUMERIC,
  total_reviews INTEGER,
  total_technicians INTEGER,
  active_technicians INTEGER,
  total_jobs INTEGER,
  is_featured BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS company_id,
    c.name,
    c.logo_url,
    c.city,
    c.rating,
    c.total_reviews,
    c.total_technicians,
    c.active_technicians,
    c.total_jobs,
    c.is_featured
  FROM companies c
  WHERE c.status = 'active'
    AND (p_city IS NULL OR c.city = p_city)
    AND (p_min_rating IS NULL OR c.rating >= p_min_rating)
    AND (p_search_term IS NULL OR c.name ILIKE '%' || p_search_term || '%')
  ORDER BY
    c.is_featured DESC,
    c.rating DESC,
    c.total_jobs DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- -----------------------------------------------------
-- 6.6 إضافة عنوان للعميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION add_customer_address(
  p_user_id UUID,
  p_label TEXT,
  p_address_line1 TEXT,
  p_city TEXT,
  p_district TEXT DEFAULT NULL,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_building_number TEXT DEFAULT NULL,
  p_floor_number TEXT DEFAULT NULL,
  p_apartment_number TEXT DEFAULT NULL,
  p_landmark TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_address_id UUID;
  v_location GEOGRAPHY;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location := make_point(p_latitude, p_longitude);
  END IF;
  
  INSERT INTO customer_addresses (
    customer_id, label, address_line1, city, district,
    location, building_number, floor_number, apartment_number,
    landmark, is_default
  )
  VALUES (
    v_customer_id, p_label, p_address_line1, p_city, p_district,
    v_location, p_building_number, p_floor_number, p_apartment_number,
    p_landmark, p_is_default
  )
  RETURNING id INTO v_address_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'address_id', v_address_id,
    'message', 'تم إضافة العنوان بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 6.7 تحديث عنوان العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_customer_address(
  p_user_id UUID,
  p_address_id UUID,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_location GEOGRAPHY;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE id = p_address_id AND customer_id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'Address not found';
  END IF;
  
  -- تحديث الموقع إذا تم توفيره
  IF p_data ? 'latitude' AND p_data ? 'longitude' THEN
    v_location := make_point(
      (p_data->>'latitude')::NUMERIC,
      (p_data->>'longitude')::NUMERIC
    );
  END IF;
  
  UPDATE customer_addresses
  SET
    label = COALESCE(p_data->>'label', label),
    address_line1 = COALESCE(p_data->>'address_line1', address_line1),
    address_line2 = COALESCE(p_data->>'address_line2', address_line2),
    city = COALESCE(p_data->>'city', city),
    district = COALESCE(p_data->>'district', district),
    building_number = COALESCE(p_data->>'building_number', building_number),
    floor_number = COALESCE(p_data->>'floor_number', floor_number),
    apartment_number = COALESCE(p_data->>'apartment_number', apartment_number),
    landmark = COALESCE(p_data->>'landmark', landmark),
    location = COALESCE(v_location, location),
    is_default = COALESCE((p_data->>'is_default')::BOOLEAN, is_default)
  WHERE id = p_address_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تحديث العنوان');
END;
$$;

-- -----------------------------------------------------
-- 6.8 حذف عنوان العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_customer_address(
  p_user_id UUID,
  p_address_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  -- التحقق من عدم وجود طلبات مرتبطة
  IF EXISTS (
    SELECT 1 FROM jobs 
    WHERE address_id = p_address_id 
      AND status NOT IN ('completed', 'cancelled')
  ) THEN
    RAISE EXCEPTION 'Cannot delete address with active jobs';
  END IF;
  
  UPDATE customer_addresses
  SET is_active = FALSE
  WHERE id = p_address_id AND customer_id = v_customer_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم حذف العنوان');
END;
$$;

-- -----------------------------------------------------
-- 6.9 الحصول على عناوين العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_addresses(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_addresses JSONB;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ca.id,
      'label', ca.label,
      'address_line1', ca.address_line1,
      'address_line2', ca.address_line2,
      'city', ca.city,
      'district', ca.district,
      'building_number', ca.building_number,
      'floor_number', ca.floor_number,
      'apartment_number', ca.apartment_number,
      'landmark', ca.landmark,
      'latitude', ST_Y(ca.location::geometry),
      'longitude', ST_X(ca.location::geometry),
      'is_default', ca.is_default
    ) ORDER BY ca.is_default DESC, ca.created_at DESC
  ), '[]'::jsonb)
  INTO v_addresses
  FROM customer_addresses ca
  WHERE ca.customer_id = v_customer_id AND ca.is_active = TRUE;
  
  RETURN jsonb_build_object('success', true, 'addresses', v_addresses);
END;
$$;

-- -----------------------------------------------------
-- 6.10 إضافة مهارة للفني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION add_technician_skill(
  p_user_id UUID,
  p_category_id BIGINT,
  p_years_experience INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech_id UUID;
  v_skill_id UUID;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  INSERT INTO technician_skills (technician_id, category_id, years_experience)
  VALUES (v_tech_id, p_category_id, p_years_experience)
  ON CONFLICT (technician_id, category_id) 
  DO UPDATE SET years_experience = p_years_experience
  RETURNING id INTO v_skill_id;
  
  RETURN jsonb_build_object('success', true, 'skill_id', v_skill_id);
END;
$$;

-- -----------------------------------------------------
-- 6.11 الحصول على الفئات
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_service_categories(
  p_parent_id BIGINT DEFAULT NULL,
  p_include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_categories JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sc.id,
      'parent_id', sc.parent_id,
      'name', sc.name,
      'name_en', sc.name_en,
      'description', sc.description,
      'icon', sc.icon,
      'image_url', sc.image_url,
      'is_featured', sc.is_featured
    ) ORDER BY sc.display_order, sc.name
  ), '[]'::jsonb)
  INTO v_categories
  FROM service_categories sc
  WHERE (p_parent_id IS NULL AND sc.parent_id IS NULL)
     OR (sc.parent_id = p_parent_id)
    AND (p_include_inactive OR sc.is_active = TRUE);
  
  RETURN jsonb_build_object('success', true, 'categories', v_categories);
END;
$$;
-- =====================================================
-- HMAPP v5.0 - PART 7: JOB & OFFER FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 7.1 إنشاء طلب جديد
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION create_job(
  p_user_id UUID,
  p_address_id UUID,
  p_category_id BIGINT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_preferred_time_start TIME DEFAULT NULL,
  p_preferred_time_end TIME DEFAULT NULL,
  p_urgency_level INTEGER DEFAULT 1,
  p_photo_urls TEXT[] DEFAULT NULL,
  p_auto_publish BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_address customer_addresses%ROWTYPE;
  v_job_id UUID;
  v_status job_status;
  v_expires_at TIMESTAMPTZ;
  v_photo_url TEXT;
BEGIN
  -- الحصول على العميل
  SELECT * INTO v_customer 
  FROM customers 
  WHERE user_id = p_user_id AND is_active = TRUE AND is_blocked = FALSE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or blocked';
  END IF;
  
  -- التحقق من العنوان
  SELECT * INTO v_address
  FROM customer_addresses
  WHERE id = p_address_id AND customer_id = v_customer.id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Address not found';
  END IF;
  
  -- التحقق من الفئة
  IF NOT EXISTS (SELECT 1 FROM service_categories WHERE id = p_category_id AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Invalid category';
  END IF;
  
  -- تحديد الحالة الأولية
  IF p_auto_publish THEN
    v_status := 'waiting_for_offers';
    v_expires_at := NOW() + INTERVAL '5 minutes';
  ELSE
    v_status := 'draft';
  END IF;
  
  -- إنشاء الطلب
  INSERT INTO jobs (
    customer_id, address_id, category_id,
    title, description, urgency_level,
    preferred_date, preferred_time_start, preferred_time_end,
    status, offer_window_expires_at,
    job_location, job_address, job_city
  )
  VALUES (
    v_customer.id, p_address_id, p_category_id,
    p_title, p_description, p_urgency_level,
    p_preferred_date, p_preferred_time_start, p_preferred_time_end,
    v_status, v_expires_at,
    v_address.location, 
    v_address.address_line1 || COALESCE(', ' || v_address.district, ''),
    v_address.city
  )
  RETURNING id INTO v_job_id;
  
  -- إضافة الصور
  IF p_photo_urls IS NOT NULL THEN
    FOREACH v_photo_url IN ARRAY p_photo_urls
    LOOP
      INSERT INTO job_photos (job_id, url, photo_type, uploaded_by)
      VALUES (v_job_id, v_photo_url, 'before', p_user_id);
    END LOOP;
  END IF;
  
  -- تحديث عداد الوظائف
  IF v_status <> 'draft' THEN
    UPDATE customers SET total_jobs = total_jobs + 1 WHERE id = v_customer.id;
  END IF;
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('job_created', p_user_id, 'job', v_job_id, 
    jsonb_build_object('title', p_title, 'category_id', p_category_id, 'status', v_status));
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job_id,
    'status', v_status,
    'offer_window_expires_at', v_expires_at,
    'expires_in_seconds', CASE WHEN v_expires_at IS NOT NULL THEN 300 ELSE NULL END,
    'message', CASE 
      WHEN v_status = 'waiting_for_offers' THEN 'تم نشر طلبك. ستتلقى العروض خلال 5 دقائق'
      ELSE 'تم حفظ الطلب كمسودة'
    END
  );
END;
$$;

-- -----------------------------------------------------
-- 7.2 نشر طلب (من مسودة)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION publish_job(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.id = v_job.customer_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_job.status <> 'draft' THEN
    RAISE EXCEPTION 'Job is not a draft. Current status: %', v_job.status;
  END IF;
  
  v_expires_at := NOW() + INTERVAL '5 minutes';
  
  UPDATE jobs
  SET 
    status = 'waiting_for_offers',
    offer_window_expires_at = v_expires_at
  WHERE id = p_job_id;
  
  UPDATE customers SET total_jobs = total_jobs + 1 WHERE id = v_job.customer_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'waiting_for_offers',
    'offer_window_expires_at', v_expires_at,
    'expires_in_seconds', 300
  );
END;
$$;

-- -----------------------------------------------------
-- 7.3 تقديم عرض سعر
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION submit_offer(
  p_user_id UUID,
  p_job_id UUID,
  p_amount NUMERIC(12,2),
  p_message TEXT DEFAULT NULL,
  p_estimated_duration_minutes INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_tech technicians%ROWTYPE;
  v_offer_id UUID;
  v_customer_user_id UUID;
BEGIN
  -- الحصول على الطلب
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job.status <> 'waiting_for_offers' THEN
    RAISE EXCEPTION 'Job is not accepting offers. Status: %', v_job.status;
  END IF;
  
  IF v_job.offer_window_expires_at < NOW() THEN
    UPDATE jobs SET status = 'offers_expired' WHERE id = p_job_id;
    RAISE EXCEPTION 'Offer window has expired';
  END IF;
  
  -- الحصول على الفني
  SELECT * INTO v_tech FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  IF v_tech.status <> 'active' THEN
    RAISE EXCEPTION 'Technician is not active. Status: %', v_tech.status;
  END IF;
  
  -- التحقق من المهارات
  IF NOT EXISTS (
    SELECT 1 FROM technician_skills
    WHERE technician_id = v_tech.id AND category_id = v_job.category_id
  ) THEN
    RAISE EXCEPTION 'You do not have the required skills for this job category';
  END IF;
  
  -- التحقق من عدم وجود عرض سابق
  IF EXISTS (
    SELECT 1 FROM price_offers 
    WHERE job_id = p_job_id AND technician_id = v_tech.id
  ) THEN
    RAISE EXCEPTION 'You have already submitted an offer for this job';
  END IF;
  
  -- إنشاء العرض
  INSERT INTO price_offers (
    job_id, technician_id, amount, message, 
    estimated_duration_minutes, expires_at
  )
  VALUES (
    p_job_id, v_tech.id, p_amount, p_message,
    p_estimated_duration_minutes, v_job.offer_window_expires_at
  )
  RETURNING id INTO v_offer_id;
  
  -- إرسال إشعار للعميل
  SELECT c.user_id INTO v_customer_user_id
  FROM customers c WHERE c.id = v_job.customer_id;
  
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_customer_user_id,
    'offer_received',
    'عرض جديد 💰',
    'تلقيت عرضاً بقيمة ' || p_amount || ' ريال على طلبك',
    jsonb_build_object(
      'job_id', v_job.id,
      'job_number', v_job.job_number,
      'offer_id', v_offer_id,
      'amount', p_amount,
      'technician_id', v_tech.id
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'offer_id', v_offer_id,
    'amount', p_amount,
    'expires_at', v_job.offer_window_expires_at,
    'message', 'تم تقديم عرضك بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 7.4 سحب عرض
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION withdraw_offer(
  p_user_id UUID,
  p_offer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer price_offers%ROWTYPE;
  v_tech_id UUID;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  SELECT * INTO v_offer FROM price_offers WHERE id = p_offer_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  
  IF v_offer.technician_id <> v_tech_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot withdraw offer. Status: %', v_offer.status;
  END IF;
  
  UPDATE price_offers
  SET status = 'withdrawn', decided_at = NOW()
  WHERE id = p_offer_id;
  
  UPDATE jobs SET offers_count = GREATEST(0, offers_count - 1) WHERE id = v_offer.job_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم سحب العرض');
END;
$$;

-- -----------------------------------------------------
-- 7.5 قبول عرض
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION accept_offer(
  p_user_id UUID,
  p_offer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer price_offers%ROWTYPE;
  v_job jobs%ROWTYPE;
  v_customer customers%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_tech technicians%ROWTYPE;
  v_reward_discount NUMERIC(12,2) := 0;
  v_total NUMERIC(12,2);
  v_payment_link_id UUID;
  v_payment_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- الحصول على العرض
  SELECT * INTO v_offer FROM price_offers WHERE id = p_offer_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  
  IF v_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Offer is not pending. Status: %', v_offer.status;
  END IF;
  
  -- الحصول على الطلب
  SELECT * INTO v_job FROM jobs WHERE id = v_offer.job_id FOR UPDATE;
  
  IF v_job.technician_id IS NOT NULL THEN
    RAISE EXCEPTION 'Job is already assigned';
  END IF;
  
  -- التحقق من صلاحية العميل
  SELECT * INTO v_customer 
  FROM customers 
  WHERE id = v_job.customer_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- الحصول على الفني
  SELECT * INTO v_tech FROM technicians WHERE id = v_offer.technician_id;
  
  -- التحقق من خصم المكافأة
  SELECT * INTO v_wallet 
  FROM wallets
  WHERE owner_type = 'customer' AND owner_id = v_customer.id
  FOR UPDATE;
  
  IF FOUND AND v_wallet.balance >= 25 THEN
    v_reward_discount := 25.00;
    
    UPDATE wallets 
    SET 
      balance = balance - 25.00,
      total_spent = total_spent + 25.00
    WHERE id = v_wallet.id;
    
    INSERT INTO wallet_transactions (
      wallet_id, job_id, direction, amount, 
      balance_before, balance_after,
      tx_type, description, reference, created_by
    )
    VALUES (
      v_wallet.id, v_job.id, 'debit', 25.00,
      v_wallet.balance, v_wallet.balance - 25.00,
      'reward_discount', 'خصم مكافأة - ' || v_job.job_number,
      generate_tx_reference(), p_user_id
    );
  END IF;
  
  v_total := v_offer.amount - v_reward_discount;
  v_payment_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + INTERVAL '5 minutes';
  
  -- إنشاء رابط الدفع
  INSERT INTO payment_links (
    job_id, customer_id, technician_id,
    subtotal, reward_discount, total,
    payment_url, token, status, expires_at
  )
  VALUES (
    v_job.id, v_customer.id, v_offer.technician_id,
    v_offer.amount, v_reward_discount, v_total,
    'https://pay.hmapp.com/' || v_payment_token,
    v_payment_token, 'pending', v_expires_at
  )
  RETURNING id INTO v_payment_link_id;
  
  -- تحديث الطلب
  UPDATE jobs
  SET 
    technician_id = v_offer.technician_id,
    company_id = v_tech.company_id,
    status = 'payment_pending',
    payment_expires_at = v_expires_at,
    final_price = v_offer.amount,
    reward_discount = v_reward_discount,
    amount_to_pay = v_total
  WHERE id = v_job.id;
  
  -- تحديث العروض
  UPDATE price_offers SET status = 'accepted', decided_at = NOW() WHERE id = p_offer_id;
  UPDATE price_offers SET status = 'rejected', decided_at = NOW()
  WHERE job_id = v_job.id AND id <> p_offer_id AND status = 'pending';
  
  -- إرسال إشعار للفني
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech.user_id,
    'offer_accepted',
    'تم قبول عرضك ✅',
    'تم قبول عرضك على الطلب ' || v_job.job_number || ' - في انتظار الدفع',
    jsonb_build_object(
      'job_id', v_job.id,
      'job_number', v_job.job_number,
      'amount', v_offer.amount
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_link_id', v_payment_link_id,
    'payment_url', 'https://pay.hmapp.com/' || v_payment_token,
    'token', v_payment_token,
    'subtotal', v_offer.amount,
    'reward_discount', v_reward_discount,
    'total', v_total,
    'expires_at', v_expires_at,
    'expires_in_seconds', 300
  );
END;
$$;

-- -----------------------------------------------------
-- 7.6 رفض عرض
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION reject_offer(
  p_user_id UUID,
  p_offer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer price_offers%ROWTYPE;
  v_job jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_offer FROM price_offers WHERE id = p_offer_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
  
  SELECT * INTO v_job FROM jobs WHERE id = v_offer.job_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.id = v_job.customer_id AND c.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_offer.status <> 'pending' THEN
    RAISE EXCEPTION 'Offer is not pending';
  END IF;
  
  UPDATE price_offers SET status = 'rejected', decided_at = NOW() WHERE id = p_offer_id;
  
  -- إرسال إشعار للفني
  INSERT INTO notifications (recipient_id, type, title, body, data)
  SELECT 
    t.user_id,
    'offer_rejected',
    'تم رفض عرضك',
    'للأسف تم رفض عرضك على الطلب ' || v_job.job_number,
    jsonb_build_object('job_id', v_job.id, 'job_number', v_job.job_number)
  FROM technicians t WHERE t.id = v_offer.technician_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم رفض العرض');
END;
$$;

-- -----------------------------------------------------
-- 7.7 تأكيد الدفع
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_payment(
  p_payment_token TEXT,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_gateway_response JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_link payment_links%ROWTYPE;
  v_job jobs%ROWTYPE;
  v_batch company_batches%ROWTYPE;
  v_tech technicians%ROWTYPE;
  v_company_share NUMERIC(12,2);
BEGIN
  SELECT * INTO v_link FROM payment_links WHERE token = p_payment_token FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment link not found';
  END IF;
  
  IF v_link.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment already processed. Status: %', v_link.status;
  END IF;
  
  IF v_link.expires_at < NOW() THEN
    UPDATE payment_links SET status = 'expired' WHERE id = v_link.id;
    UPDATE jobs SET status = 'payment_expired' WHERE id = v_link.job_id;
    RAISE EXCEPTION 'Payment link has expired';
  END IF;
  
  -- تحديث رابط الدفع
  UPDATE payment_links
  SET 
    status = 'paid',
    payment_method = p_payment_method,
    payment_reference = p_payment_reference,
    gateway_response = p_gateway_response,
    paid_at = NOW()
  WHERE id = v_link.id;
  
  -- تحديث الطلب
  UPDATE jobs
  SET 
    status = 'in_progress',
    amount_paid = v_link.total,
    started_at = NOW()
  WHERE id = v_link.job_id
  RETURNING * INTO v_job;
  
  -- الحصول على الفني والـ batch
  SELECT * INTO v_tech FROM technicians WHERE id = v_link.technician_id;
  
  SELECT * INTO v_batch 
  FROM company_batches
  WHERE technician_id = v_link.technician_id AND status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active batch found';
  END IF;
  
  v_company_share := v_link.subtotal * 0.15;
  
  -- تحديث الـ batch
  UPDATE company_batches
  SET 
    jobs_completed = jobs_completed + 1,
    total_revenue = total_revenue + v_link.subtotal,
    company_share = company_share + v_company_share,
    status = CASE 
      WHEN jobs_completed + 1 >= target_jobs THEN 'ready'::batch_status
      ELSE 'active'::batch_status
    END
  WHERE id = v_batch.id;
  
  -- تحديث إحصائيات الفني
  UPDATE technicians SET total_earnings = total_earnings + v_link.subtotal WHERE id = v_link.technician_id;
  
  -- تحديث إحصائيات الشركة
  UPDATE companies
  SET total_jobs = total_jobs + 1, total_revenue = total_revenue + v_link.subtotal
  WHERE id = v_tech.company_id;
  
  -- إرسال إشعار للفني
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech.user_id,
    'payment_received',
    'تم استلام الدفع 💳',
    'تم الدفع للطلب ' || v_job.job_number || ' - يمكنك البدء الآن',
    jsonb_build_object('job_id', v_job.id, 'job_number', v_job.job_number, 'amount', v_link.total)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job.id,
    'job_number', v_job.job_number,
    'status', 'in_progress',
    'amount_paid', v_link.total,
    'message', 'تم الدفع بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 7.8 إكمال الطلب
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION complete_job(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_tech technicians%ROWTYPE;
  v_customer_user_id UUID;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Job is not in progress. Status: %', v_job.status;
  END IF;
  
  SELECT * INTO v_tech FROM technicians WHERE id = v_job.technician_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE jobs
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_job_id;
  
  UPDATE technicians SET jobs_done = jobs_done + 1 WHERE id = v_job.technician_id;
  UPDATE companies SET completed_jobs = completed_jobs + 1 WHERE id = v_tech.company_id;
  
  -- إرسال إشعار للعميل
  SELECT c.user_id INTO v_customer_user_id FROM customers c WHERE c.id = v_job.customer_id;
  
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_customer_user_id,
    'job_completed',
    'اكتمل طلبك ✅',
    'تم إكمال الطلب ' || v_job.job_number || ' بنجاح. قيّم الفني الآن!',
    jsonb_build_object('job_id', v_job.id, 'job_number', v_job.job_number, 'technician_id', v_job.technician_id)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job.id,
    'status', 'completed',
    'message', 'تم إكمال الطلب بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 7.9 إلغاء الطلب
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_job(
  p_user_id UUID,
  p_job_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_is_customer BOOLEAN;
  v_link payment_links%ROWTYPE;
  v_wallet_id UUID;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Job is already %', v_job.status;
  END IF;
  
  -- التحقق من الصلاحيات
  SELECT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = v_job.customer_id AND c.user_id = p_user_id
  ) INTO v_is_customer;
  
  IF NOT v_is_customer AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- إرجاع خصم المكافأة إذا كان قد تم خصمه
  IF v_job.reward_discount > 0 AND v_job.status = 'payment_pending' THEN
    SELECT id INTO v_wallet_id FROM wallets
    WHERE owner_type = 'customer' AND owner_id = v_job.customer_id;
    
    IF v_wallet_id IS NOT NULL THEN
      UPDATE wallets SET balance = balance + v_job.reward_discount WHERE id = v_wallet_id;
      
      INSERT INTO wallet_transactions (
        wallet_id, job_id, direction, amount, 
        balance_before, balance_after,
        tx_type, description, reference, created_by
      )
      SELECT 
        v_wallet_id, v_job.id, 'credit', v_job.reward_discount,
        w.balance - v_job.reward_discount, w.balance,
        'reward_refund', 'استرداد خصم المكافأة - إلغاء الطلب',
        generate_tx_reference(), p_user_id
      FROM wallets w WHERE w.id = v_wallet_id;
    END IF;
  END IF;
  
  -- إلغاء رابط الدفع
  UPDATE payment_links SET status = 'cancelled' WHERE job_id = p_job_id AND status = 'pending';
  
  -- إلغاء الطلب
  UPDATE jobs
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = p_reason,
    cancelled_by = p_user_id
  WHERE id = p_job_id;
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('job_cancelled', p_user_id, 'job', p_job_id, jsonb_build_object('reason', p_reason));
  
  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'cancelled',
    'message', 'تم إلغاء الطلب'
  );
END;
$$;

-- -----------------------------------------------------
-- 7.10 الحصول على تفاصيل الطلب
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_job_details(p_job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job JSONB;
  v_offers JSONB;
  v_photos JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', j.id,
    'job_number', j.job_number,
    'title', j.title,
    'description', j.description,
    'status', j.status,
    'urgency_level', j.urgency_level,
    'category', jsonb_build_object('id', sc.id, 'name', sc.name, 'icon', sc.icon),
    'address', jsonb_build_object(
      'label', ca.label,
      'address', j.job_address,
      'city', j.job_city,
      'latitude', ST_Y(j.job_location::geometry),
      'longitude', ST_X(j.job_location::geometry)
    ),
    'customer', jsonb_build_object(
      'id', c.id,
      'name', up_c.full_name,
      'avatar', up_c.avatar_url,
      'phone', up_c.phone,
      'rating', c.rating
    ),
    'technician', CASE WHEN t.id IS NOT NULL THEN jsonb_build_object(
      'id', t.id,
      'name', up_t.full_name,
      'avatar', up_t.avatar_url,
      'phone', up_t.phone,
      'rating', t.rating,
      'company_name', co.name
    ) ELSE NULL END,
    'pricing', jsonb_build_object(
      'final_price', j.final_price,
      'reward_discount', j.reward_discount,
      'amount_to_pay', j.amount_to_pay,
      'amount_paid', j.amount_paid
    ),
    'timing', jsonb_build_object(
      'preferred_date', j.preferred_date,
      'preferred_time_start', j.preferred_time_start,
      'preferred_time_end', j.preferred_time_end,
      'offer_window_expires_at', j.offer_window_expires_at,
      'payment_expires_at', j.payment_expires_at,
      'started_at', j.started_at,
      'completed_at', j.completed_at
    ),
    'offers_count', j.offers_count,
    'created_at', j.created_at
  )
  INTO v_job
  FROM jobs j
  JOIN service_categories sc ON j.category_id = sc.id
  JOIN customer_addresses ca ON j.address_id = ca.id
  JOIN customers c ON j.customer_id = c.id
  JOIN user_profiles up_c ON c.profile_id = up_c.id
  LEFT JOIN technicians t ON j.technician_id = t.id
  LEFT JOIN user_profiles up_t ON t.profile_id = up_t.id
  LEFT JOIN companies co ON t.company_id = co.id
  WHERE j.id = p_job_id;
  
  IF v_job IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found');
  END IF;
  
  -- الحصول على العروض
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', po.id,
      'amount', po.amount,
      'message', po.message,
      'estimated_duration', po.estimated_duration_minutes,
      'status', po.status,
      'technician', jsonb_build_object(
        'id', t.id,
        'name', up.full_name,
        'avatar', up.avatar_url,
        'rating', t.rating,
        'jobs_done', t.jobs_done,
        'company_name', co.name
      ),
      'created_at', po.created_at
    ) ORDER BY po.created_at DESC
  ), '[]'::jsonb)
  INTO v_offers
  FROM price_offers po
  JOIN technicians t ON po.technician_id = t.id
  JOIN user_profiles up ON t.profile_id = up.id
  JOIN companies co ON t.company_id = co.id
  WHERE po.job_id = p_job_id;
  
  -- الحصول على الصور
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', jp.id,
      'url', jp.url,
      'type', jp.photo_type,
      'caption', jp.caption
    ) ORDER BY jp.created_at
  ), '[]'::jsonb)
  INTO v_photos
  FROM job_photos jp WHERE jp.job_id = p_job_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'job', v_job,
    'offers', v_offers,
    'photos', v_photos
  );
END;
$$;
-- =====================================================
-- HMAPP v5.0 - PART 8: REVIEWS, NOTIFICATIONS & COMPANY
-- =====================================================

-- =====================================================
-- REVIEWS FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 8.1 تقييم الفني (من العميل)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION submit_technician_review(
  p_user_id UUID,
  p_job_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_quality_rating INTEGER DEFAULT NULL,
  p_timing_rating INTEGER DEFAULT NULL,
  p_behavior_rating INTEGER DEFAULT NULL,
  p_price_rating INTEGER DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_customer_id UUID;
  v_review_id UUID;
  v_tech_user_id UUID;
BEGIN
  -- الحصول على الطلب
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job.status <> 'completed' THEN
    RAISE EXCEPTION 'Can only review completed jobs';
  END IF;
  
  -- التحقق من العميل
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  IF v_customer_id <> v_job.customer_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- التحقق من عدم وجود تقييم سابق
  IF EXISTS (SELECT 1 FROM job_reviews WHERE job_id = p_job_id) THEN
    RAISE EXCEPTION 'Job already reviewed';
  END IF;
  
  -- إنشاء التقييم
  INSERT INTO job_reviews (
    job_id, customer_id, technician_id,
    rating, comment,
    quality_rating, timing_rating, behavior_rating, price_rating,
    photos
  )
  VALUES (
    p_job_id, v_customer_id, v_job.technician_id,
    p_rating, p_comment,
    p_quality_rating, p_timing_rating, p_behavior_rating, p_price_rating,
    p_photos
  )
  RETURNING id INTO v_review_id;
  
  -- إرسال إشعار للفني
  SELECT t.user_id INTO v_tech_user_id FROM technicians t WHERE t.id = v_job.technician_id;
  
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech_user_id,
    'new_review',
    'تقييم جديد ⭐',
    'حصلت على تقييم ' || p_rating || ' نجوم على طلب ' || v_job.job_number,
    jsonb_build_object('job_id', v_job.id, 'review_id', v_review_id, 'rating', p_rating)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'message', 'شكراً لتقييمك!'
  );
END;
$$;

-- -----------------------------------------------------
-- 8.2 تقييم العميل (من الفني) - النظام المتبادل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION submit_customer_review(
  p_user_id UUID,
  p_job_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_communication_rating INTEGER DEFAULT NULL,
  p_location_accuracy_rating INTEGER DEFAULT NULL,
  p_payment_rating INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_tech_id UUID;
  v_review_id UUID;
  v_customer_user_id UUID;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  IF v_job.status <> 'completed' THEN
    RAISE EXCEPTION 'Can only review completed jobs';
  END IF;
  
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  IF v_tech_id <> v_job.technician_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF EXISTS (SELECT 1 FROM customer_reviews WHERE job_id = p_job_id) THEN
    RAISE EXCEPTION 'Customer already reviewed for this job';
  END IF;
  
  INSERT INTO customer_reviews (
    job_id, technician_id, customer_id,
    rating, comment,
    communication_rating, location_accuracy_rating, payment_rating
  )
  VALUES (
    p_job_id, v_tech_id, v_job.customer_id,
    p_rating, p_comment,
    p_communication_rating, p_location_accuracy_rating, p_payment_rating
  )
  RETURNING id INTO v_review_id;
  
  SELECT c.user_id INTO v_customer_user_id FROM customers c WHERE c.id = v_job.customer_id;
  
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_customer_user_id,
    'new_review',
    'تقييم جديد من الفني ⭐',
    'حصلت على تقييم ' || p_rating || ' نجوم',
    jsonb_build_object('job_id', v_job.id, 'review_id', v_review_id, 'rating', p_rating)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'message', 'تم تسجيل تقييمك'
  );
END;
$$;

-- -----------------------------------------------------
-- 8.3 الرد على تقييم (للفني)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION respond_to_review(
  p_user_id UUID,
  p_review_id UUID,
  p_response TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_review job_reviews%ROWTYPE;
  v_tech_id UUID;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  SELECT * INTO v_review FROM job_reviews WHERE id = p_review_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
  
  IF v_review.technician_id <> v_tech_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_review.response IS NOT NULL THEN
    RAISE EXCEPTION 'Already responded to this review';
  END IF;
  
  UPDATE job_reviews
  SET response = p_response, response_at = NOW()
  WHERE id = p_review_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم إضافة ردك');
END;
$$;

-- -----------------------------------------------------
-- 8.4 الحصول على تقييمات الفني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_technician_reviews(
  p_technician_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviews JSONB;
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'average_rating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'total_reviews', COUNT(*),
    'rating_distribution', jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ),
    'average_quality', COALESCE(ROUND(AVG(quality_rating)::numeric, 2), 0),
    'average_timing', COALESCE(ROUND(AVG(timing_rating)::numeric, 2), 0),
    'average_behavior', COALESCE(ROUND(AVG(behavior_rating)::numeric, 2), 0),
    'average_price', COALESCE(ROUND(AVG(price_rating)::numeric, 2), 0)
  )
  INTO v_stats
  FROM job_reviews
  WHERE technician_id = p_technician_id AND is_visible = TRUE;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', jr.id,
      'rating', jr.rating,
      'comment', jr.comment,
      'response', jr.response,
      'customer_name', up.full_name,
      'customer_avatar', up.avatar_url,
      'job_title', j.title,
      'created_at', jr.created_at
    ) ORDER BY jr.created_at DESC
  ), '[]'::jsonb)
  INTO v_reviews
  FROM job_reviews jr
  JOIN jobs j ON jr.job_id = j.id
  JOIN customers c ON jr.customer_id = c.id
  JOIN user_profiles up ON c.profile_id = up.id
  WHERE jr.technician_id = p_technician_id AND jr.is_visible = TRUE
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true,
    'stats', v_stats,
    'reviews', v_reviews
  );
END;
$$;

-- =====================================================
-- NOTIFICATIONS FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 8.5 الحصول على الإشعارات
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notifications JSONB;
  v_unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_unread_count
  FROM notifications
  WHERE recipient_id = p_user_id AND is_read = FALSE;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'type', n.type,
      'title', n.title,
      'body', n.body,
      'data', n.data,
      'is_read', n.is_read,
      'created_at', n.created_at
    ) ORDER BY n.created_at DESC
  ), '[]'::jsonb)
  INTO v_notifications
  FROM notifications n
  WHERE n.recipient_id = p_user_id
    AND (NOT p_unread_only OR n.is_read = FALSE)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true,
    'unread_count', v_unread_count,
    'notifications', v_notifications
  );
END;
$$;

-- -----------------------------------------------------
-- 8.6 تحديد الإشعارات كمقروءة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE recipient_id = p_user_id AND is_read = FALSE;
  ELSE
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE recipient_id = p_user_id AND id = ANY(p_notification_ids) AND is_read = FALSE;
  END IF;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

-- =====================================================
-- COMPANY MANAGEMENT FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- 8.7 تفعيل فني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION activate_technician(
  p_user_id UUID,
  p_technician_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech technicians%ROWTYPE;
  v_company companies%ROWTYPE;
BEGIN
  SELECT * INTO v_tech FROM technicians WHERE id = p_technician_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  SELECT * INTO v_company FROM companies WHERE id = v_tech.company_id AND owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_tech.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Technician is not pending. Status: %', v_tech.status;
  END IF;
  
  UPDATE technicians
  SET 
    status = 'active',
    activated_at = NOW(),
    activated_by = p_user_id
  WHERE id = p_technician_id;
  
  -- إشعار الفني
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech.user_id,
    'system_alert',
    'تم تفعيل حسابك ✅',
    'تم تفعيل حسابك في شركة ' || v_company.name || '. يمكنك البدء في استقبال الطلبات',
    jsonb_build_object('company_id', v_company.id, 'company_name', v_company.name)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم تفعيل الفني بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 8.8 تعليق فني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION suspend_technician(
  p_user_id UUID,
  p_technician_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech technicians%ROWTYPE;
BEGIN
  SELECT * INTO v_tech FROM technicians WHERE id = p_technician_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  IF NOT is_company_manager(v_tech.company_id) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE technicians SET status = 'suspended' WHERE id = p_technician_id;
  
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('technician_suspended', p_user_id, 'technician', p_technician_id, 
    jsonb_build_object('reason', p_reason));
  
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech.user_id,
    'system_alert',
    'تم تعليق حسابك ⚠️',
    COALESCE('السبب: ' || p_reason, 'تم تعليق حسابك مؤقتاً'),
    jsonb_build_object('reason', p_reason)
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تعليق الفني');
END;
$$;

-- -----------------------------------------------------
-- 8.9 سحب batch
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION withdraw_batch(
  p_user_id UUID,
  p_batch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch company_batches%ROWTYPE;
  v_company companies%ROWTYPE;
  v_wallet_id UUID;
  v_new_batch_id UUID;
BEGIN
  SELECT * INTO v_batch FROM company_batches WHERE id = p_batch_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  
  IF v_batch.status <> 'ready' THEN
    RAISE EXCEPTION 'Batch is not ready. Status: %', v_batch.status;
  END IF;
  
  SELECT * INTO v_company FROM companies WHERE id = v_batch.company_id AND owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- تحديث الـ batch
  UPDATE company_batches
  SET 
    status = 'completed',
    withdrawn_at = NOW(),
    withdrawn_by = p_user_id,
    withdrawal_ref = 'WD-' || generate_tx_reference(),
    completed_at = NOW()
  WHERE id = p_batch_id;
  
  -- إضافة لمحفظة الشركة
  SELECT id INTO v_wallet_id FROM wallets WHERE owner_type = 'company' AND owner_id = v_company.id;
  
  UPDATE wallets
  SET 
    balance = balance + v_batch.company_share,
    total_earned = total_earned + v_batch.company_share
  WHERE id = v_wallet_id;
  
  INSERT INTO wallet_transactions (
    wallet_id, batch_id, direction, amount,
    balance_before, balance_after,
    tx_type, description, reference, created_by
  )
  SELECT 
    v_wallet_id, v_batch.id, 'credit', v_batch.company_share,
    w.balance - v_batch.company_share, w.balance,
    'batch_withdrawal', 'سحب Batch #' || v_batch.batch_number,
    generate_tx_reference(), p_user_id
  FROM wallets w WHERE w.id = v_wallet_id;
  
  -- إنشاء batch جديد
  INSERT INTO company_batches (
    company_id, technician_id, 
    jobs_completed, target_jobs, status
  )
  VALUES (
    v_batch.company_id, v_batch.technician_id,
    0, v_company.batch_size, 'active'
  )
  RETURNING id INTO v_new_batch_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'withdrawn_amount', v_batch.company_share,
    'jobs_completed', v_batch.jobs_completed,
    'new_batch_id', v_new_batch_id,
    'message', 'تم السحب بنجاح'
  );
END;
$$;

-- -----------------------------------------------------
-- 8.10 الحصول على فنيين الشركة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_company_technicians(
  p_user_id UUID,
  p_status technician_status DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_technicians JSONB;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'name', up.full_name,
      'avatar', up.avatar_url,
      'phone', up.phone,
      'status', t.status,
      'rating', t.rating,
      'total_reviews', t.total_reviews,
      'jobs_done', t.jobs_done,
      'is_online', t.is_online,
      'is_available', t.is_available,
      'activated_at', t.activated_at,
      'current_batch', (
        SELECT jsonb_build_object(
          'id', cb.id,
          'jobs_completed', cb.jobs_completed,
          'target_jobs', cb.target_jobs,
          'status', cb.status,
          'total_revenue', cb.total_revenue
        )
        FROM company_batches cb
        WHERE cb.technician_id = t.id AND cb.status IN ('active', 'ready')
        ORDER BY cb.created_at DESC LIMIT 1
      )
    ) ORDER BY t.status, t.rating DESC
  ), '[]'::jsonb)
  INTO v_technicians
  FROM technicians t
  JOIN user_profiles up ON t.profile_id = up.id
  WHERE t.company_id = v_company_id
    AND (p_status IS NULL OR t.status = p_status);
  
  RETURN jsonb_build_object('success', true, 'technicians', v_technicians);
END;
$$;

-- -----------------------------------------------------
-- 8.11 إحصائيات الشركة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_company_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company companies%ROWTYPE;
  v_wallet_balance NUMERIC;
  v_pending_batches JSONB;
BEGIN
  SELECT * INTO v_company FROM companies WHERE owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  SELECT balance INTO v_wallet_balance FROM wallets 
  WHERE owner_type = 'company' AND owner_id = v_company.id;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', cb.id,
      'batch_number', cb.batch_number,
      'technician_name', up.full_name,
      'jobs_completed', cb.jobs_completed,
      'target_jobs', cb.target_jobs,
      'company_share', cb.company_share,
      'status', cb.status
    )
  ), '[]'::jsonb)
  INTO v_pending_batches
  FROM company_batches cb
  JOIN technicians t ON cb.technician_id = t.id
  JOIN user_profiles up ON t.profile_id = up.id
  WHERE cb.company_id = v_company.id AND cb.status = 'ready';
  
  RETURN jsonb_build_object(
    'success', true,
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'status', v_company.status,
      'rating', v_company.rating
    ),
    'stats', jsonb_build_object(
      'total_technicians', v_company.total_technicians,
      'active_technicians', v_company.active_technicians,
      'total_jobs', v_company.total_jobs,
      'completed_jobs', v_company.completed_jobs,
      'total_revenue', v_company.total_revenue,
      'wallet_balance', COALESCE(v_wallet_balance, 0)
    ),
    'pending_withdrawals', v_pending_batches
  );
END;
$$;

-- -----------------------------------------------------
-- 8.12 الحصول على تقييمات العميل
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_reviews(
  p_customer_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reviews JSONB;
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'average_rating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'total_reviews', COUNT(*),
    'rating_distribution', jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ),
    'average_communication', COALESCE(ROUND(AVG(communication_rating)::numeric, 2), 0),
    'average_location_accuracy', COALESCE(ROUND(AVG(location_accuracy_rating)::numeric, 2), 0),
    'average_payment', COALESCE(ROUND(AVG(payment_rating)::numeric, 2), 0)
  )
  INTO v_stats
  FROM customer_reviews
  WHERE customer_id = p_customer_id AND is_visible = TRUE;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', cr.id,
      'rating', cr.rating,
      'comment', cr.comment,
      'technician_name', up.full_name,
      'technician_avatar', up.avatar_url,
      'job_title', j.title,
      'created_at', cr.created_at
    ) ORDER BY cr.created_at DESC
  ), '[]'::jsonb)
  INTO v_reviews
  FROM customer_reviews cr
  JOIN jobs j ON cr.job_id = j.id
  JOIN technicians t ON cr.technician_id = t.id
  JOIN user_profiles up ON t.profile_id = up.id
  WHERE cr.customer_id = p_customer_id AND cr.is_visible = TRUE
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true,
    'stats', v_stats,
    'reviews', v_reviews
  );
END;
$$;

-- -----------------------------------------------------
-- 8.13 حذف إشعار
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_notification(
  p_user_id UUID,
  p_notification_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE id = p_notification_id AND recipient_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found';
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم حذف الإشعار');
END;
$$;

-- -----------------------------------------------------
-- 8.14 حذف جميع الإشعارات
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_all_notifications(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM notifications WHERE recipient_id = p_user_id;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'deleted', v_deleted);
END;
$$;

-- -----------------------------------------------------
-- 8.15 إعادة تفعيل فني
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION reactivate_technician(
  p_user_id UUID,
  p_technician_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech technicians%ROWTYPE;
  v_company companies%ROWTYPE;
BEGIN
  SELECT * INTO v_tech FROM technicians WHERE id = p_technician_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  SELECT * INTO v_company FROM companies WHERE id = v_tech.company_id AND owner_id = p_user_id;
  
  IF NOT FOUND AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF v_tech.status NOT IN ('suspended', 'inactive') THEN
    RAISE EXCEPTION 'Technician is not suspended or inactive. Status: %', v_tech.status;
  END IF;
  
  UPDATE technicians
  SET status = 'active'
  WHERE id = p_technician_id;
  
  -- إشعار الفني
  INSERT INTO notifications (recipient_id, type, title, body, data)
  VALUES (
    v_tech.user_id,
    'system_alert',
    'تم إعادة تفعيل حسابك ✅',
    'تم إعادة تفعيل حسابك. يمكنك البدء في استقبال الطلبات',
    jsonb_build_object('company_id', v_tech.company_id)
  );
  
  -- تسجيل الحدث
  INSERT INTO event_logs (event_type, user_id, resource_type, resource_id, payload)
  VALUES ('technician_reactivated', p_user_id, 'technician', p_technician_id, '{}'::jsonb);
  
  RETURN jsonb_build_object('success', true, 'message', 'تم إعادة تفعيل الفني');
END;
$$;

-- -----------------------------------------------------
-- 8.16 الحصول على طلبات الشركة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_company_jobs(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_technician_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_jobs JSONB;
  v_total INTEGER;
BEGIN
  SELECT id INTO v_company_id FROM companies WHERE owner_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found';
  END IF;
  
  SELECT COUNT(*) INTO v_total
  FROM jobs j
  WHERE j.company_id = v_company_id
    AND (p_status IS NULL OR j.status = p_status)
    AND (p_technician_id IS NULL OR j.technician_id = p_technician_id);
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', j.id,
      'job_number', j.job_number,
      'title', j.title,
      'status', j.status,
      'final_price', j.final_price,
      'amount_paid', j.amount_paid,
      'technician', jsonb_build_object(
        'id', t.id,
        'name', up_t.full_name,
        'avatar', up_t.avatar_url
      ),
      'customer', jsonb_build_object(
        'id', c.id,
        'name', up_c.full_name
      ),
      'category', jsonb_build_object(
        'id', sc.id,
        'name', sc.name
      ),
      'created_at', j.created_at,
      'completed_at', j.completed_at
    ) ORDER BY j.created_at DESC
  ), '[]'::jsonb)
  INTO v_jobs
  FROM jobs j
  JOIN technicians t ON j.technician_id = t.id
  JOIN user_profiles up_t ON t.profile_id = up_t.id
  JOIN customers c ON j.customer_id = c.id
  JOIN user_profiles up_c ON c.profile_id = up_c.id
  JOIN service_categories sc ON j.category_id = sc.id
  WHERE j.company_id = v_company_id
    AND (p_status IS NULL OR j.status = p_status)
    AND (p_technician_id IS NULL OR j.technician_id = p_technician_id)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'jobs', v_jobs
  );
END;
$$;

-- -----------------------------------------------------
-- 8.17 الحصول على طلباتي (للعميل)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_jobs_as_customer(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_jobs JSONB;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', j.id,
      'job_number', j.job_number,
      'title', j.title,
      'description', j.description,
      'status', j.status,
      'category', jsonb_build_object('id', sc.id, 'name', sc.name, 'icon', sc.icon),
      'address', j.job_address,
      'final_price', j.final_price,
      'reward_discount', j.reward_discount,
      'amount_paid', j.amount_paid,
      'offers_count', j.offers_count,
      'technician', CASE WHEN t.id IS NOT NULL THEN jsonb_build_object(
        'id', t.id,
        'name', up_t.full_name,
        'avatar', up_t.avatar_url,
        'phone', up_t.phone,
        'rating', t.rating,
        'company_name', co.name
      ) ELSE NULL END,
      'offer_window_expires_at', j.offer_window_expires_at,
      'payment_expires_at', j.payment_expires_at,
      'created_at', j.created_at,
      'started_at', j.started_at,
      'completed_at', j.completed_at,
      'has_review', EXISTS(SELECT 1 FROM job_reviews jr WHERE jr.job_id = j.id)
    ) ORDER BY j.created_at DESC
  ), '[]'::jsonb)
  INTO v_jobs
  FROM jobs j
  JOIN service_categories sc ON j.category_id = sc.id
  LEFT JOIN technicians t ON j.technician_id = t.id
  LEFT JOIN user_profiles up_t ON t.profile_id = up_t.id
  LEFT JOIN companies co ON t.company_id = co.id
  WHERE j.customer_id = v_customer_id
    AND (p_status IS NULL OR j.status = p_status)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object('success', true, 'jobs', v_jobs);
END;
$$;

-- -----------------------------------------------------
-- 8.18 الحصول على طلباتي (للفني)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_jobs_as_technician(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech_id UUID;
  v_jobs JSONB;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', j.id,
      'job_number', j.job_number,
      'title', j.title,
      'description', j.description,
      'status', j.status,
      'category', jsonb_build_object('id', sc.id, 'name', sc.name, 'icon', sc.icon),
      'address', j.job_address,
      'city', j.job_city,
      'location', jsonb_build_object(
        'latitude', ST_Y(j.job_location::geometry),
        'longitude', ST_X(j.job_location::geometry)
      ),
      'final_price', j.final_price,
      'amount_paid', j.amount_paid,
      'customer', jsonb_build_object(
        'id', c.id,
        'name', up_c.full_name,
        'avatar', up_c.avatar_url,
        'phone', up_c.phone,
        'rating', c.rating
      ),
      'created_at', j.created_at,
      'started_at', j.started_at,
      'completed_at', j.completed_at,
      'has_customer_review', EXISTS(SELECT 1 FROM customer_reviews cr WHERE cr.job_id = j.id)
    ) ORDER BY j.created_at DESC
  ), '[]'::jsonb)
  INTO v_jobs
  FROM jobs j
  JOIN service_categories sc ON j.category_id = sc.id
  JOIN customers c ON j.customer_id = c.id
  JOIN user_profiles up_c ON c.profile_id = up_c.id
  WHERE j.technician_id = v_tech_id
    AND (p_status IS NULL OR j.status = p_status)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object('success', true, 'jobs', v_jobs);
END;
$$;

-- -----------------------------------------------------
-- 8.19 الحصول على الطلبات المتاحة (للفني)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_available_jobs(
  p_user_id UUID,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_radius_km NUMERIC DEFAULT 5,
  p_category_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech technicians%ROWTYPE;
  v_location GEOGRAPHY;
  v_jobs JSONB;
BEGIN
  SELECT * INTO v_tech FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  IF v_tech.status <> 'active' THEN
    RAISE EXCEPTION 'Technician is not active';
  END IF;
  
  -- استخدام الموقع المُمرر أو موقع الفني الحالي
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    v_location := make_point(p_latitude, p_longitude);
  ELSE
    v_location := v_tech.current_location;
  END IF;
  
  IF v_location IS NULL THEN
    RAISE EXCEPTION 'Location is required';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', j.id,
      'job_number', j.job_number,
      'title', j.title,
      'description', j.description,
      'urgency_level', j.urgency_level,
      'category', jsonb_build_object('id', sc.id, 'name', sc.name, 'icon', sc.icon),
      'address', j.job_address,
      'city', j.job_city,
      'distance_km', ROUND((ST_Distance(j.job_location, v_location) / 1000)::NUMERIC, 2),
      'offers_count', j.offers_count,
      'offer_window_expires_at', j.offer_window_expires_at,
      'preferred_date', j.preferred_date,
      'preferred_time_start', j.preferred_time_start,
      'preferred_time_end', j.preferred_time_end,
      'photos', (
        SELECT COALESCE(jsonb_agg(jp.url), '[]'::jsonb)
        FROM job_photos jp WHERE jp.job_id = j.id
      ),
      'customer', jsonb_build_object(
        'name', up.full_name,
        'rating', c.rating,
        'total_jobs', c.total_jobs
      ),
      'created_at', j.created_at,
      'has_my_offer', EXISTS(
        SELECT 1 FROM price_offers po 
        WHERE po.job_id = j.id AND po.technician_id = v_tech.id
      )
    ) ORDER BY ST_Distance(j.job_location, v_location)
  ), '[]'::jsonb)
  INTO v_jobs
  FROM jobs j
  JOIN service_categories sc ON j.category_id = sc.id
  JOIN customers c ON j.customer_id = c.id
  JOIN user_profiles up ON c.profile_id = up.id
  WHERE j.status = 'waiting_for_offers'
    AND j.offer_window_expires_at > NOW()
    AND j.job_location IS NOT NULL
    AND ST_DWithin(j.job_location, v_location, p_radius_km * 1000)
    AND (p_category_id IS NULL OR j.category_id = p_category_id)
    AND EXISTS (
      SELECT 1 FROM technician_skills ts
      WHERE ts.technician_id = v_tech.id AND ts.category_id = j.category_id
    )
  LIMIT p_limit;
  
  RETURN jsonb_build_object('success', true, 'jobs', v_jobs);
END;
$$;

-- -----------------------------------------------------
-- 8.20 الحصول على عروضي (للفني)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_offers(
  p_user_id UUID,
  p_status offer_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tech_id UUID;
  v_offers JSONB;
BEGIN
  SELECT id INTO v_tech_id FROM technicians WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician not found';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', po.id,
      'amount', po.amount,
      'message', po.message,
      'status', po.status,
      'created_at', po.created_at,
      'expires_at', po.expires_at,
      'job', jsonb_build_object(
        'id', j.id,
        'job_number', j.job_number,
        'title', j.title,
        'status', j.status,
        'category', sc.name,
        'address', j.job_address
      )
    ) ORDER BY po.created_at DESC
  ), '[]'::jsonb)
  INTO v_offers
  FROM price_offers po
  JOIN jobs j ON po.job_id = j.id
  JOIN service_categories sc ON j.category_id = sc.id
  WHERE po.technician_id = v_tech_id
    AND (p_status IS NULL OR po.status = p_status)
  LIMIT p_limit OFFSET p_offset;
  
  RETURN jsonb_build_object('success', true, 'offers', v_offers);
END;
$$;

-- -----------------------------------------------------
-- 8.21 إرسال رسالة
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION send_message(
  p_user_id UUID,
  p_job_id UUID,
  p_body TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_media_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_message_id UUID;
  v_recipient_id UUID;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  -- التحقق من أن المستخدم طرف في الطلب
  IF NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = v_job.customer_id AND c.user_id = p_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM technicians t WHERE t.id = v_job.technician_id AND t.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- التحقق من حالة الطلب
  IF v_job.status NOT IN ('assigned', 'payment_pending', 'in_progress') THEN
    RAISE EXCEPTION 'Cannot send messages for this job status';
  END IF;
  
  INSERT INTO messages (job_id, sender_id, message_type, body, media_url)
  VALUES (p_job_id, p_user_id, p_message_type, p_body, p_media_url)
  RETURNING id INTO v_message_id;
  
  -- تحديد المستلم
  IF EXISTS (SELECT 1 FROM customers c WHERE c.id = v_job.customer_id AND c.user_id = p_user_id) THEN
    SELECT t.user_id INTO v_recipient_id FROM technicians t WHERE t.id = v_job.technician_id;
  ELSE
    SELECT c.user_id INTO v_recipient_id FROM customers c WHERE c.id = v_job.customer_id;
  END IF;
  
  -- إرسال إشعار (اختياري - يمكن استخدام Realtime بدلاً)
  -- INSERT INTO notifications...
  
  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$;

-- -----------------------------------------------------
-- 8.22 الحصول على رسائل الطلب
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_job_messages(
  p_user_id UUID,
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_before_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_messages JSONB;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;
  
  -- التحقق من الصلاحيات
  IF NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.id = v_job.customer_id AND c.user_id = p_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM technicians t WHERE t.id = v_job.technician_id AND t.user_id = p_user_id
  ) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'sender_id', m.sender_id,
      'message_type', m.message_type,
      'body', m.body,
      'media_url', m.media_url,
      'is_read', m.is_read,
      'is_mine', m.sender_id = p_user_id,
      'created_at', m.created_at
    ) ORDER BY m.created_at DESC
  ), '[]'::jsonb)
  INTO v_messages
  FROM messages m
  WHERE m.job_id = p_job_id
    AND (p_before_id IS NULL OR m.id < p_before_id)
  LIMIT p_limit;
  
  -- تحديد الرسائل كمقروءة
  UPDATE messages
  SET is_read = TRUE, read_at = NOW()
  WHERE job_id = p_job_id AND sender_id <> p_user_id AND is_read = FALSE;
  
  RETURN jsonb_build_object('success', true, 'messages', v_messages);
END;
$$;
-- =====================================================
-- HMAPP v5.0 - PART 9: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PROFILES
-- =====================================================

-- المستخدم يرى ملفه الشخصي فقط
CREATE POLICY "users_view_own_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- المستخدم يعدل ملفه فقط
CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- الإدراج عبر الدوال فقط (SECURITY DEFINER)
CREATE POLICY "profiles_insert_via_functions" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CUSTOMERS
-- =====================================================

CREATE POLICY "customers_view_own" ON customers
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin()
    -- الفنيون يرون معلومات العملاء في طلباتهم
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN technicians t ON j.technician_id = t.id
      WHERE j.customer_id = customers.id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- COMPANIES
-- =====================================================

-- الجميع يرون الشركات النشطة
CREATE POLICY "companies_view_active" ON companies
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR is_admin());

CREATE POLICY "companies_update_own" ON companies
  FOR UPDATE USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "companies_insert" ON companies
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- TECHNICIANS
-- =====================================================

-- الفنيون النشطون مرئيون للجميع
CREATE POLICY "technicians_view" ON technicians
  FOR SELECT USING (
    status = 'active'
    OR user_id = auth.uid()
    OR is_company_manager(company_id)
    OR is_admin()
    -- العملاء يرون فنيي طلباتهم
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      WHERE j.technician_id = technicians.id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "technicians_update_own" ON technicians
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR is_company_manager(company_id) 
    OR is_admin()
  );

CREATE POLICY "technicians_insert" ON technicians
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- USER DEVICES
-- =====================================================

CREATE POLICY "devices_own_only" ON user_devices
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- VERIFICATION CODES
-- =====================================================

CREATE POLICY "verification_own_only" ON verification_codes
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "verification_insert" ON verification_codes
  FOR INSERT WITH CHECK (TRUE); -- يتم عبر الدوال

-- =====================================================
-- SERVICE CATEGORIES
-- =====================================================

-- الجميع يرون الفئات النشطة
CREATE POLICY "categories_view_active" ON service_categories
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "categories_admin_manage" ON service_categories
  FOR ALL USING (is_admin());

-- =====================================================
-- TECHNICIAN SKILLS
-- =====================================================

CREATE POLICY "skills_view" ON technician_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.status = 'active')
    OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "skills_manage_own" ON technician_skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    OR is_admin()
  );

-- =====================================================
-- TECHNICIAN AVAILABILITY
-- =====================================================

CREATE POLICY "availability_view" ON technician_availability
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.status = 'active')
    OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

CREATE POLICY "availability_manage_own" ON technician_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

-- =====================================================
-- SERVICE AREAS
-- =====================================================

CREATE POLICY "service_areas_view" ON service_areas
  FOR SELECT USING (
    is_active = TRUE
    OR (technician_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid()
    ))
    OR (company_id IS NOT NULL AND is_company_manager(company_id))
    OR is_admin()
  );

CREATE POLICY "service_areas_manage" ON service_areas
  FOR ALL USING (
    (technician_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid()
    ))
    OR (company_id IS NOT NULL AND is_company_manager(company_id))
    OR is_admin()
  );

-- =====================================================
-- CUSTOMER ADDRESSES
-- =====================================================

CREATE POLICY "addresses_own_only" ON customer_addresses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
    OR is_admin()
  );

-- الفنيون يرون عناوين طلباتهم
CREATE POLICY "addresses_view_for_jobs" ON customer_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN technicians t ON j.technician_id = t.id
      WHERE j.address_id = customer_addresses.id AND t.user_id = auth.uid()
    )
  );

-- =====================================================
-- JOBS
-- =====================================================

-- العملاء يرون طلباتهم
CREATE POLICY "jobs_customer_view" ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

-- الفنيون يرون الطلبات المتاحة والمسندة لهم
CREATE POLICY "jobs_technician_view" ON jobs
  FOR SELECT USING (
    -- طلباته المسندة له
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    -- أو الطلبات المتاحة في منطقته
    OR (
      status = 'waiting_for_offers'
      AND EXISTS (
        SELECT 1 FROM technicians t
        JOIN technician_skills ts ON t.id = ts.technician_id
        WHERE t.user_id = auth.uid()
          AND t.status = 'active'
          AND ts.category_id = jobs.category_id
      )
    )
  );

-- مدراء الشركات يرون طلبات فنييهم
CREATE POLICY "jobs_company_view" ON jobs
  FOR SELECT USING (
    company_id IS NOT NULL AND is_company_manager(company_id)
  );

-- المسؤولون
CREATE POLICY "jobs_admin_view" ON jobs
  FOR SELECT USING (is_admin());

-- العملاء يعدلون طلباتهم (المسودات فقط)
CREATE POLICY "jobs_customer_update" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
    AND status IN ('draft', 'waiting_for_offers')
  );

-- الفنيون يعدلون طلباتهم (in_progress)
CREATE POLICY "jobs_technician_update" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    AND status = 'in_progress'
  );

CREATE POLICY "jobs_insert" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

-- =====================================================
-- JOB PHOTOS
-- =====================================================

CREATE POLICY "job_photos_view" ON job_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id AND (
        EXISTS (SELECT 1 FROM customers c WHERE c.id = j.customer_id AND c.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = j.technician_id AND t.user_id = auth.uid())
        OR is_admin()
      )
    )
  );

CREATE POLICY "job_photos_insert" ON job_photos
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- =====================================================
-- PRICE OFFERS
-- =====================================================

-- العميل يرى عروض طلبه
CREATE POLICY "offers_customer_view" ON price_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN customers c ON j.customer_id = c.id
      WHERE j.id = job_id AND c.user_id = auth.uid()
    )
  );

-- الفني يرى عروضه
CREATE POLICY "offers_technician_view" ON price_offers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

CREATE POLICY "offers_admin_view" ON price_offers
  FOR SELECT USING (is_admin());

-- الفني يضيف عروضه
CREATE POLICY "offers_technician_insert" ON price_offers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

-- الفني يعدل عروضه (pending فقط)
CREATE POLICY "offers_technician_update" ON price_offers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    AND status = 'pending'
  );

-- =====================================================
-- PAYMENT LINKS
-- =====================================================

CREATE POLICY "payment_links_view" ON payment_links
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    OR is_admin()
  );

-- =====================================================
-- COMPANY BATCHES
-- =====================================================

CREATE POLICY "batches_company_view" ON company_batches
  FOR SELECT USING (
    is_company_manager(company_id)
    OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "batches_company_update" ON company_batches
  FOR UPDATE USING (is_company_manager(company_id) OR is_admin());

-- =====================================================
-- WALLETS
-- =====================================================

CREATE POLICY "wallets_view_own" ON wallets
  FOR SELECT USING (
    (owner_type = 'customer' AND EXISTS (
      SELECT 1 FROM customers c WHERE c.id = owner_id AND c.user_id = auth.uid()
    ))
    OR (owner_type = 'company' AND EXISTS (
      SELECT 1 FROM companies c WHERE c.id = owner_id AND c.owner_id = auth.uid()
    ))
    OR is_admin()
  );

-- =====================================================
-- WALLET TRANSACTIONS
-- =====================================================

CREATE POLICY "wallet_tx_view_own" ON wallet_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets w
      WHERE w.id = wallet_id AND (
        (w.owner_type = 'customer' AND EXISTS (
          SELECT 1 FROM customers c WHERE c.id = w.owner_id AND c.user_id = auth.uid()
        ))
        OR (w.owner_type = 'company' AND EXISTS (
          SELECT 1 FROM companies c WHERE c.id = w.owner_id AND c.owner_id = auth.uid()
        ))
      )
    )
    OR is_admin()
  );

-- =====================================================
-- JOB REVIEWS
-- =====================================================

-- التقييمات المرئية للجميع
CREATE POLICY "job_reviews_view" ON job_reviews
  FOR SELECT USING (is_visible = TRUE OR is_admin());

-- العميل يرى تقييماته
CREATE POLICY "job_reviews_customer_view" ON job_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

-- الفني يرى تقييماته
CREATE POLICY "job_reviews_tech_view" ON job_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

CREATE POLICY "job_reviews_insert" ON job_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
  );

-- الفني يعدل الرد فقط
CREATE POLICY "job_reviews_tech_respond" ON job_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

-- =====================================================
-- CUSTOMER REVIEWS
-- =====================================================

CREATE POLICY "customer_reviews_view" ON customer_reviews
  FOR SELECT USING (is_visible = TRUE OR is_admin());

CREATE POLICY "customer_reviews_own_view" ON customer_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM customers c WHERE c.id = customer_id AND c.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

CREATE POLICY "customer_reviews_insert" ON customer_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM technicians t WHERE t.id = technician_id AND t.user_id = auth.uid())
  );

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE POLICY "messages_job_participants" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id AND (
        EXISTS (SELECT 1 FROM customers c WHERE c.id = j.customer_id AND c.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM technicians t WHERE t.id = j.technician_id AND t.user_id = auth.uid())
      )
    )
    OR is_admin()
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE POLICY "notifications_own_only" ON notifications
  FOR ALL USING (recipient_id = auth.uid() OR is_admin());

-- =====================================================
-- ADMIN USERS
-- =====================================================

CREATE POLICY "admin_users_admin_only" ON admin_users
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_users_view_self" ON admin_users
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- EVENT LOGS
-- =====================================================

CREATE POLICY "event_logs_admin_only" ON event_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "event_logs_insert" ON event_logs
  FOR INSERT WITH CHECK (TRUE); -- عبر الدوال

-- =====================================================
-- ABUSE REPORTS
-- =====================================================

CREATE POLICY "abuse_reports_own" ON abuse_reports
  FOR SELECT USING (reporter_id = auth.uid() OR is_admin());

CREATE POLICY "abuse_reports_insert" ON abuse_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "abuse_reports_admin_manage" ON abuse_reports
  FOR UPDATE USING (is_admin());

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE POLICY "system_settings_public_view" ON system_settings
  FOR SELECT USING (is_public = TRUE OR is_admin());

CREATE POLICY "system_settings_admin_manage" ON system_settings
  FOR ALL USING (is_admin());

-- =====================================================
-- FAQS
-- =====================================================

CREATE POLICY "faqs_view_active" ON faqs
  FOR SELECT USING (is_active = TRUE OR is_admin());

CREATE POLICY "faqs_admin_manage" ON faqs
  FOR ALL USING (is_admin());

-- =====================================================
-- PROMOTIONS
-- =====================================================

CREATE POLICY "promotions_view_active" ON promotions
  FOR SELECT USING (
    is_active = TRUE 
    AND starts_at <= NOW() 
    AND ends_at >= NOW()
    OR is_admin()
  );

CREATE POLICY "promotions_admin_manage" ON promotions
  FOR ALL USING (is_admin());
-- =====================================================
-- HMAPP v5.0 - PART 10: SEED DATA
-- =====================================================

-- =====================================================
-- فئات الخدمات
-- =====================================================

INSERT INTO service_categories (id, name, name_en, icon, display_order, is_featured) VALUES
(1, 'السباكة', 'Plumbing', 'wrench', 1, true),
(2, 'الكهرباء', 'Electrical', 'zap', 2, true),
(3, 'التكييف والتبريد', 'AC & Cooling', 'thermometer', 3, true),
(4, 'النجارة', 'Carpentry', 'hammer', 4, true),
(5, 'الدهان', 'Painting', 'paintbrush', 5, true),
(6, 'التنظيف', 'Cleaning', 'sparkles', 6, true),
(7, 'نقل الأثاث', 'Moving', 'truck', 7, false),
(8, 'الحدادة', 'Welding', 'shield', 8, false),
(9, 'الألمنيوم', 'Aluminum', 'grid', 9, false),
(10, 'الجبس', 'Gypsum', 'layers', 10, false),
(11, 'السيراميك والبلاط', 'Tiles', 'square', 11, false),
(12, 'صيانة الأجهزة', 'Appliance Repair', 'settings', 12, false),
(13, 'مكافحة الحشرات', 'Pest Control', 'bug', 13, false),
(14, 'الزجاج والمرايا', 'Glass & Mirrors', 'maximize', 14, false),
(15, 'السقالات', 'Scaffolding', 'grid', 15, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  is_featured = EXCLUDED.is_featured;

-- فئات فرعية للسباكة
INSERT INTO service_categories (parent_id, name, name_en, display_order) VALUES
(1, 'تسليك مجاري', 'Drain Cleaning', 1),
(1, 'إصلاح تسربات', 'Leak Repair', 2),
(1, 'تركيب سخانات', 'Water Heater Installation', 3),
(1, 'صيانة خزانات', 'Tank Maintenance', 4)
ON CONFLICT (id) DO NOTHING;

-- فئات فرعية للكهرباء
INSERT INTO service_categories (parent_id, name, name_en, display_order) VALUES
(2, 'تمديدات كهربائية', 'Electrical Wiring', 1),
(2, 'إصلاح أعطال', 'Fault Repair', 2),
(2, 'تركيب إنارة', 'Lighting Installation', 3),
(2, 'صيانة لوحات', 'Panel Maintenance', 4)
ON CONFLICT (id) DO NOTHING;

-- فئات فرعية للتكييف
INSERT INTO service_categories (parent_id, name, name_en, display_order) VALUES
(3, 'تركيب مكيفات', 'AC Installation', 1),
(3, 'صيانة وتنظيف', 'AC Maintenance', 2),
(3, 'شحن فريون', 'Freon Refill', 3),
(3, 'إصلاح أعطال', 'AC Repair', 4)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- إعدادات النظام
-- =====================================================

INSERT INTO system_settings (key, value, description, is_public) VALUES
('app_name', '"HMAPP"', 'اسم التطبيق', true),
('app_version', '"5.0.0"', 'إصدار التطبيق', true),
('support_phone', '"+966500000000"', 'رقم الدعم الفني', true),
('support_email', '"support@hmapp.com"', 'بريد الدعم', true),
('offer_window_minutes', '5', 'مدة نافذة العروض بالدقائق', false),
('payment_window_minutes', '5', 'مدة نافذة الدفع بالدقائق', false),
('signup_bonus_amount', '100', 'مبلغ مكافأة التسجيل', false),
('discount_per_use', '25', 'الخصم لكل استخدام', false),
('max_discount_uses', '4', 'عدد مرات الخصم', false),
('company_commission_rate', '15', 'نسبة عمولة الشركة %', false),
('platform_fee_rate', '0', 'نسبة رسوم المنصة %', false),
('vat_rate', '15', 'نسبة ضريبة القيمة المضافة %', false),
('technician_search_radius_km', '2', 'نطاق البحث الافتراضي بالكيلومتر', false),
('max_offers_per_job', '10', 'أقصى عدد عروض للطلب', false),
('min_job_price', '50', 'أقل سعر للطلب', false),
('max_job_price', '100000', 'أعلى سعر للطلب', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;

-- =====================================================
-- الأسئلة الشائعة
-- =====================================================

INSERT INTO faqs (question, answer, category, display_order) VALUES
-- للعملاء
('كيف أطلب خدمة؟', 'افتح التطبيق > اختر الخدمة > حدد العنوان > اكتب وصف المشكلة > انتظر العروض > اختر العرض المناسب > ادفع', 'customers', 1),
('ما هي مدة استلام العروض؟', 'ستتلقى العروض خلال 5 دقائق من نشر الطلب', 'customers', 2),
('هل يمكنني إلغاء الطلب؟', 'نعم، يمكنك إلغاء الطلب قبل الدفع بدون أي رسوم', 'customers', 3),
('كيف أحصل على الخصم؟', 'عند التسجيل تحصل على 100 ريال (4 خصومات × 25 ريال) تُخصم تلقائياً من كل طلب', 'customers', 4),
('هل يمكنني تقييم الفني؟', 'نعم، بعد إكمال الطلب ستتمكن من تقييم الفني من 1 إلى 5 نجوم', 'customers', 5),

-- للفنيين
('كيف أنضم كفني؟', 'يجب أن تكون تابعاً لشركة مسجلة في التطبيق. تواصل مع الشركة للانضمام', 'technicians', 1),
('كيف أستقبل الطلبات؟', 'فعّل حالة "متصل" وحدّث موقعك. ستصلك إشعارات بالطلبات القريبة منك', 'technicians', 2),
('متى أحصل على أرباحي؟', 'الأرباح تُحول لحساب الشركة عند اكتمال الـ Batch (عدد محدد من الطلبات)', 'technicians', 3),
('هل يمكنني سحب عرضي؟', 'نعم، يمكنك سحب عرضك طالما لم يقبله العميل', 'technicians', 4),

-- للشركات
('كيف أسجل شركتي؟', 'اختر "تسجيل شركة" > أدخل بيانات الشركة والسجل التجاري > انتظر التحقق', 'companies', 1),
('كيف أضيف فنيين؟', 'الفنيون يسجلون بأنفسهم ويختارون شركتك، ثم توافق على انضمامهم من لوحة التحكم', 'companies', 2),
('ما هو نظام الـ Batch؟', 'كل فني له Batch (دورة) من عدد محدد من الطلبات. عند اكتمالها يمكنك سحب الأرباح', 'companies', 3),
('ما هي نسبة العمولة؟', 'تحصل الشركة على 15% من قيمة كل طلب يكمله فنيوها', 'companies', 4);

-- =====================================================
-- محفظة المنصة (للتتبع)
-- =====================================================

INSERT INTO wallets (owner_type, owner_id, balance, currency)
VALUES ('platform', '00000000-0000-0000-0000-000000000000', 0, 'SAR')
ON CONFLICT (owner_type, owner_id) DO NOTHING;

-- =====================================================
-- تحديث sequence للفئات
-- =====================================================

SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));