# HMAPP v5.0 - Copilot Reference Guide
# دليل مرجعي شامل للمشروع

---

## 🎯 Project Overview

**HMAPP** is a handyman marketplace application connecting customers with skilled technicians employed by maintenance companies. Built with Next.js and Supabase.

### Business Model: Employee Model
- Technicians MUST belong to a company (company_id required)
- Company receives 15% commission from each job
- Batch system: X jobs completed = withdrawal available
- 5-minute timers for offers and payments

---

## 🗄️ Database Schema Reference

### Core Tables

```sql
-- User Profiles (unified for all users)
user_profiles (
  id UUID PK,
  user_id UUID -> auth.users,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role (customer|technician|company_owner|admin),
  verification verification_status,
  phone_verified BOOLEAN,
  email_verified BOOLEAN,
  default_location GEOGRAPHY(POINT),
  city TEXT,
  language TEXT DEFAULT 'ar',
  notification_settings JSONB
)

-- Customers
customers (
  id UUID PK,
  user_id UUID -> auth.users,
  profile_id UUID -> user_profiles,
  total_jobs INTEGER,
  completed_jobs INTEGER,
  total_spent NUMERIC,
  rating NUMERIC(3,2),
  total_reviews INTEGER,
  is_blocked BOOLEAN
)

-- Companies
companies (
  id UUID PK,
  owner_id UUID -> auth.users,
  name TEXT,
  logo_url TEXT,
  commercial_register TEXT,
  cr_verified BOOLEAN,
  batch_size INTEGER DEFAULT 5,
  commission_rate NUMERIC DEFAULT 15.00,
  total_technicians INTEGER,
  active_technicians INTEGER,
  total_revenue NUMERIC,
  rating NUMERIC,
  status company_status
)

-- Technicians
technicians (
  id UUID PK,
  user_id UUID -> auth.users,
  profile_id UUID -> user_profiles,
  company_id UUID -> companies (REQUIRED),
  specialization TEXT,
  rating NUMERIC(3,2),
  total_reviews INTEGER,
  jobs_done INTEGER,
  total_earnings NUMERIC,
  current_location GEOGRAPHY(POINT),
  is_online BOOLEAN,
  is_available BOOLEAN,
  service_radius_km INTEGER DEFAULT 10,
  status technician_status
)

-- Jobs
jobs (
  id UUID PK,
  job_number TEXT UNIQUE,
  customer_id UUID -> customers,
  technician_id UUID -> technicians,
  company_id UUID -> companies,
  address_id UUID -> customer_addresses,
  category_id BIGINT -> service_categories,
  title TEXT,
  description TEXT,
  status job_status,
  job_location GEOGRAPHY(POINT),
  offer_window_expires_at TIMESTAMPTZ,
  payment_expires_at TIMESTAMPTZ,
  final_price NUMERIC,
  reward_discount NUMERIC,
  amount_to_pay NUMERIC,
  amount_paid NUMERIC,
  offers_count INTEGER
)

-- Price Offers
price_offers (
  id UUID PK,
  job_id UUID -> jobs,
  technician_id UUID -> technicians,
  amount NUMERIC,
  status offer_status,
  message TEXT,
  estimated_duration_minutes INTEGER,
  expires_at TIMESTAMPTZ
)

-- Payment Links
payment_links (
  id UUID PK,
  job_id UUID -> jobs,
  customer_id UUID -> customers,
  technician_id UUID -> technicians,
  subtotal NUMERIC,
  reward_discount NUMERIC,
  total NUMERIC,
  payment_url TEXT,
  token TEXT UNIQUE,
  status payment_link_status,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
)

-- Company Batches
company_batches (
  id UUID PK,
  batch_number TEXT UNIQUE,
  company_id UUID -> companies,
  technician_id UUID -> technicians,
  jobs_completed INTEGER,
  target_jobs INTEGER,
  status batch_status,
  total_revenue NUMERIC,
  company_share NUMERIC,
  can_withdraw BOOLEAN (GENERATED),
  withdrawn_at TIMESTAMPTZ
)

-- Wallets
wallets (
  id UUID PK,
  owner_type TEXT (customer|company|platform),
  owner_id UUID,
  balance NUMERIC,
  total_earned NUMERIC,
  total_spent NUMERIC
)

-- Job Reviews (Customer reviews Technician)
job_reviews (
  id UUID PK,
  job_id UUID -> jobs,
  customer_id UUID -> customers,
  technician_id UUID -> technicians,
  rating INTEGER 1-5,
  quality_rating INTEGER,
  timing_rating INTEGER,
  behavior_rating INTEGER,
  price_rating INTEGER,
  comment TEXT,
  response TEXT (technician's reply)
)

-- Customer Reviews (Technician reviews Customer) - MUTUAL RATING
customer_reviews (
  id UUID PK,
  job_id UUID -> jobs,
  technician_id UUID -> technicians,
  customer_id UUID -> customers,
  rating INTEGER 1-5,
  communication_rating INTEGER,
  location_accuracy_rating INTEGER,
  payment_rating INTEGER,
  comment TEXT
)
```

### Enum Types

```sql
user_role: customer, technician, company_owner, admin, super_admin

verification_status: unverified, email_verified, phone_verified, fully_verified, identity_verified

job_status: draft, waiting_for_offers, offers_expired, assigned, payment_pending, payment_expired, in_progress, completed, cancelled, disputed

offer_status: pending, accepted, rejected, expired, withdrawn

payment_link_status: pending, paid, expired, cancelled, refunded

batch_status: active, ready, processing, completed

technician_status: pending_approval, active, suspended, inactive, banned

company_status: pending_verification, active, suspended, inactive

notification_type: new_job_nearby, offer_received, offer_accepted, offer_rejected, payment_received, job_started, job_completed, new_review, review_response, system_alert, promotion
```

---

## 🔧 Key Functions Reference

### Registration Functions

```sql
-- Register a new customer
register_customer(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
) RETURNS JSONB
-- Creates: user_profile + customer + wallet (100 SAR bonus)

-- Register a new company
register_company(
  p_user_id UUID,
  p_owner_name TEXT,
  p_company_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_commercial_register TEXT DEFAULT NULL
) RETURNS JSONB
-- Creates: user_profile + company + wallet

-- Register a new technician
register_technician(
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_company_id UUID,  -- REQUIRED!
  p_email TEXT DEFAULT NULL,
  p_specialization TEXT DEFAULT NULL
) RETURNS JSONB
-- Creates: user_profile + technician (pending_approval)
-- Sends notification to company owner
```

### Verification Functions

```sql
-- Send OTP code
send_verification_code(
  p_target TEXT,           -- phone or email
  p_target_type TEXT,      -- 'phone' or 'email'
  p_user_id UUID DEFAULT NULL,
  p_purpose TEXT DEFAULT 'verification'
) RETURNS JSONB

-- Verify OTP code
verify_code(
  p_target TEXT,
  p_code TEXT,
  p_purpose TEXT DEFAULT 'verification'
) RETURNS JSONB
```

### Location Functions

```sql
-- Update technician location
update_technician_location(
  p_user_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_is_online BOOLEAN DEFAULT TRUE,
  p_is_available BOOLEAN DEFAULT TRUE
) RETURNS JSONB

-- Find nearby technicians
find_nearby_technicians(
  p_latitude NUMERIC,
  p_longitude NUMERIC,
  p_radius_km NUMERIC DEFAULT 2,
  p_category_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  technician_id, user_id, full_name, avatar_url, phone,
  company_id, company_name, company_logo, specialization,
  rating, total_reviews, jobs_done, distance_km, is_available
)

-- Helper: Create point from coordinates
make_point(p_latitude NUMERIC, p_longitude NUMERIC) RETURNS GEOGRAPHY
```

### Job Functions

```sql
-- Create a new job
create_job(
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
) RETURNS JSONB
-- Auto-publishes by default (starts 5-min offer window)
-- Triggers notification to nearby technicians

-- Submit a price offer
submit_offer(
  p_user_id UUID,           -- technician's user_id
  p_job_id UUID,
  p_amount NUMERIC(12,2),
  p_message TEXT DEFAULT NULL,
  p_estimated_duration_minutes INTEGER DEFAULT NULL
) RETURNS JSONB

-- Accept an offer (creates payment link)
accept_offer(
  p_user_id UUID,           -- customer's user_id
  p_offer_id UUID
) RETURNS JSONB
-- Returns: payment_url, token, total, expires_at
-- Deducts 25 SAR reward if available

-- Confirm payment (called by payment gateway webhook)
confirm_payment(
  p_payment_token TEXT,
  p_payment_method TEXT,
  p_payment_reference TEXT,
  p_gateway_response JSONB DEFAULT NULL
) RETURNS JSONB
-- Updates job to in_progress
-- Updates batch progress

-- Complete a job
complete_job(
  p_user_id UUID,           -- technician's user_id
  p_job_id UUID
) RETURNS JSONB

-- Cancel a job
cancel_job(
  p_user_id UUID,
  p_job_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
-- Refunds reward discount if applicable
```

### Review Functions

```sql
-- Customer reviews technician
submit_technician_review(
  p_user_id UUID,
  p_job_id UUID,
  p_rating INTEGER,          -- 1-5 required
  p_comment TEXT DEFAULT NULL,
  p_quality_rating INTEGER DEFAULT NULL,
  p_timing_rating INTEGER DEFAULT NULL,
  p_behavior_rating INTEGER DEFAULT NULL,
  p_price_rating INTEGER DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL
) RETURNS JSONB

-- Technician reviews customer (MUTUAL RATING)
submit_customer_review(
  p_user_id UUID,
  p_job_id UUID,
  p_rating INTEGER,          -- 1-5 required
  p_comment TEXT DEFAULT NULL,
  p_communication_rating INTEGER DEFAULT NULL,
  p_location_accuracy_rating INTEGER DEFAULT NULL,
  p_payment_rating INTEGER DEFAULT NULL
) RETURNS JSONB

-- Technician responds to review
respond_to_review(
  p_user_id UUID,
  p_review_id UUID,
  p_response TEXT
) RETURNS JSONB
```

### Company Management Functions

```sql
-- Activate a technician
activate_technician(
  p_user_id UUID,           -- company owner's user_id
  p_technician_id UUID
) RETURNS JSONB
-- Creates first batch for technician

-- Suspend a technician
suspend_technician(
  p_user_id UUID,
  p_technician_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB

-- Reactivate a suspended technician
reactivate_technician(
  p_user_id UUID,
  p_technician_id UUID
) RETURNS JSONB

-- Withdraw batch earnings
withdraw_batch(
  p_user_id UUID,
  p_batch_id UUID
) RETURNS JSONB
-- Transfers company_share to company wallet
-- Creates new active batch

-- Get company technicians
get_company_technicians(
  p_user_id UUID,
  p_status technician_status DEFAULT NULL
) RETURNS JSONB

-- Get company jobs
get_company_jobs(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_technician_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS JSONB

-- Get company stats
get_company_stats(p_user_id UUID) RETURNS JSONB
```

### Jobs & Offers Retrieval Functions

```sql
-- Get my jobs as customer
get_my_jobs_as_customer(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS JSONB

-- Get my jobs as technician
get_my_jobs_as_technician(
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS JSONB

-- Get available jobs for technician (nearby + matching skills)
get_available_jobs(
  p_user_id UUID,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_radius_km NUMERIC DEFAULT 5,
  p_category_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
) RETURNS JSONB

-- Get my offers as technician
get_my_offers(
  p_user_id UUID,
  p_status offer_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS JSONB
```

### Messaging Functions

```sql
-- Send a message in job chat
send_message(
  p_user_id UUID,
  p_job_id UUID,
  p_body TEXT,
  p_message_type TEXT DEFAULT 'text',
  p_media_url TEXT DEFAULT NULL
) RETURNS JSONB

-- Get job messages
get_job_messages(
  p_user_id UUID,
  p_job_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_before_id UUID DEFAULT NULL
) RETURNS JSONB
-- Also marks messages as read
```

### Notification Functions

```sql
-- Get notifications
get_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_unread_only BOOLEAN DEFAULT FALSE
) RETURNS JSONB

-- Mark notifications as read
mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL  -- NULL = mark all
) RETURNS JSONB

-- Delete a notification
delete_notification(
  p_user_id UUID,
  p_notification_id UUID
) RETURNS JSONB

-- Delete all notifications
delete_all_notifications(p_user_id UUID) RETURNS JSONB
```

### Additional Review Functions

```sql
-- Get customer reviews (mutual rating system)
get_customer_reviews(
  p_customer_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS JSONB
```

### Helper Functions

```sql
is_admin() RETURNS BOOLEAN
is_super_admin() RETURNS BOOLEAN
is_company_manager(p_company_id UUID) RETURNS BOOLEAN
get_customer_id(p_user_id UUID) RETURNS UUID
get_technician_id(p_user_id UUID) RETURNS UUID
get_company_id(p_user_id UUID) RETURNS UUID
get_user_role(p_user_id UUID) RETURNS user_role
get_active_batch(p_technician_id UUID) RETURNS UUID
generate_job_number() RETURNS TEXT
generate_batch_number() RETURNS TEXT
generate_tx_reference() RETURNS TEXT
distance_km(p_point1 GEOGRAPHY, p_point2 GEOGRAPHY) RETURNS NUMERIC
```

---

## 🔒 RLS (Row Level Security) Summary

All tables have RLS enabled. Key policies:

```
user_profiles: Users see/edit own profile only
customers: Own data + technicians see job-related data
companies: Public view for active, owner manages
technicians: Public view for active, owner/company manages
jobs: Customer sees own, technician sees assigned + nearby
price_offers: Customer sees job offers, technician sees own
payment_links: Participants only
wallets: Owner only
reviews: Public read, participants write
notifications: Recipient only
```

---

## 🔄 Business Logic Flow

### Job Lifecycle

```
1. Customer creates job (auto-publish)
   └→ Job status: waiting_for_offers
   └→ offer_window_expires_at = NOW() + 5 minutes
   └→ Trigger: notify_nearby_technicians (2km radius)

2. Technicians submit offers
   └→ Offer status: pending
   └→ Customer receives notification

3. Customer accepts offer
   └→ Job status: payment_pending
   └→ payment_expires_at = NOW() + 5 minutes
   └→ Payment link created (token-based)
   └→ 25 SAR reward deducted if available
   └→ Other offers rejected

4. Payment confirmed (webhook)
   └→ Job status: in_progress
   └→ Payment link status: paid
   └→ Batch progress updated

5. Technician completes job
   └→ Job status: completed
   └→ Technician jobs_done++
   └→ Customer can review technician
   └→ Technician can review customer
```

### Batch System Flow

```
1. Technician activated
   └→ First batch created (target = company.batch_size)
   └→ Batch status: active

2. Job completed
   └→ batch.jobs_completed++
   └→ batch.total_revenue += job amount
   └→ batch.company_share += amount * 0.15

3. Batch target reached
   └→ Batch status: ready
   └→ can_withdraw = true

4. Company withdraws
   └→ Batch status: completed
   └→ Company wallet credited
   └→ New batch created (active)
```

### Reward System

```
New customer signup:
└→ Wallet created with 100 SAR balance
└→ Transaction: signup_bonus

Job payment:
└→ If wallet.balance >= 25:
   └→ Deduct 25 SAR
   └→ Apply as discount
   └→ Transaction: reward_discount

Job cancelled (before payment):
└→ If reward was deducted:
   └→ Refund 25 SAR
   └→ Transaction: reward_refund
```

---

## 📱 Frontend Integration Guide

### Supabase Client Setup (Next.js)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Calling RPC Functions

```typescript
// Register customer
const { data, error } = await supabase.rpc('register_customer', {
  p_user_id: userId,
  p_full_name: 'أحمد محمد',
  p_phone: '+966501234567'
})

// Create job
const { data, error } = await supabase.rpc('create_job', {
  p_user_id: userId,
  p_address_id: addressId,
  p_category_id: 1,
  p_title: 'إصلاح تسريب ماء',
  p_description: 'تسريب في الحمام',
  p_auto_publish: true
})

// Submit offer (technician)
const { data, error } = await supabase.rpc('submit_offer', {
  p_user_id: techUserId,
  p_job_id: jobId,
  p_amount: 150.00,
  p_message: 'يمكنني الوصول خلال 30 دقيقة'
})

// Accept offer (customer)
const { data, error } = await supabase.rpc('accept_offer', {
  p_user_id: customerUserId,
  p_offer_id: offerId
})
// Returns: { payment_url, token, total, expires_at }
```

### Realtime Subscriptions

```typescript
// Subscribe to new offers on a job
const channel = supabase
  .channel('job-offers')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'price_offers',
      filter: `job_id=eq.${jobId}`
    },
    (payload) => {
      console.log('New offer:', payload.new)
    }
  )
  .subscribe()

// Subscribe to job status changes
const channel = supabase
  .channel('job-status')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'jobs',
      filter: `id=eq.${jobId}`
    },
    (payload) => {
      console.log('Job updated:', payload.new.status)
    }
  )
  .subscribe()

// Subscribe to notifications
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      showNotification(payload.new)
    }
  )
  .subscribe()
```

### Fetching Data

```typescript
// Get customer profile
const { data: profile } = await supabase.rpc('get_full_profile', {
  p_user_id: userId
})

// Get nearby technicians
const { data: technicians } = await supabase.rpc('find_nearby_technicians', {
  p_latitude: 24.7136,
  p_longitude: 46.6753,
  p_radius_km: 2,
  p_category_id: 1
})

// Get job details
const { data: job } = await supabase.rpc('get_job_details', {
  p_job_id: jobId
})

// Get technician reviews
const { data: reviews } = await supabase.rpc('get_technician_reviews', {
  p_technician_id: techId,
  p_limit: 20
})

// Get notifications
const { data: notifications } = await supabase.rpc('get_notifications', {
  p_user_id: userId,
  p_unread_only: true
})
```

---

## 🗂️ File Structure (Recommended)

```
hmapp/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── (customer)/
│   │   ├── home/
│   │   ├── jobs/
│   │   ├── job/[id]/
│   │   ├── profile/
│   │   └── wallet/
│   ├── (technician)/
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── job/[id]/
│   │   └── profile/
│   ├── (company)/
│   │   ├── dashboard/
│   │   ├── technicians/
│   │   ├── batches/
│   │   └── wallet/
│   ├── api/
│   │   └── webhooks/
│   │       └── payment/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── forms/
│   ├── maps/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/
│   ├── utils/
│   └── types/
├── public/
├── styles/
└── supabase/
    ├── migrations/
    │   ├── 01_schema_core.sql
    │   ├── 02_schema_jobs_payments.sql
    │   ├── 03_indexes.sql
    │   ├── 04_functions_triggers.sql
    │   ├── 05_auth_functions.sql
    │   ├── 06_location_functions.sql
    │   ├── 07_job_functions.sql
    │   ├── 08_review_notification_functions.sql
    │   ├── 09_rls_policies.sql
    │   └── 10_seed_data.sql
    └── functions/
        ├── send-otp/
        ├── send-notification/
        └── payment-webhook/
```

---

## 🚀 Deployment Checklist

### Supabase Setup
- [ ] Create Supabase project
- [ ] Enable required extensions (postgis, pgcrypto, pg_trgm)
- [ ] Run all migration files in order
- [ ] Configure Auth providers
- [ ] Set up Storage buckets (avatars, job-photos, documents)
- [ ] Configure Edge Functions

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
PAYMENT_GATEWAY_KEY=
SMS_API_KEY=
FIREBASE_CONFIG=
```

### Third-Party Services
- [ ] Payment Gateway (Moyasar/Tap)
- [ ] SMS Provider (Unifonic)
- [ ] Firebase (Push Notifications)
- [ ] Google Maps Platform

---

## 📝 Common Patterns

### Error Handling

```typescript
const { data, error } = await supabase.rpc('function_name', params)

if (error) {
  if (error.message.includes('not found')) {
    // Handle not found
  } else if (error.message.includes('Unauthorized')) {
    // Handle unauthorized
  } else if (error.message.includes('expired')) {
    // Handle expiration
  } else {
    // Generic error
  }
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(false)
const [data, setData] = useState(null)

const fetchData = async () => {
  setLoading(true)
  try {
    const { data, error } = await supabase.rpc('...')
    if (error) throw error
    setData(data)
  } catch (error) {
    toast.error(error.message)
  } finally {
    setLoading(false)
  }
}
```

### Optimistic Updates

```typescript
// When accepting offer
setJobStatus('payment_pending') // Optimistic
const { error } = await supabase.rpc('accept_offer', {...})
if (error) {
  setJobStatus('waiting_for_offers') // Revert
  toast.error(error.message)
}
```

---

## ⚠️ Important Notes

1. **Timer Constraints**: 5-minute windows are enforced at database level
2. **Location Required**: Technician location must be updated for job matching
3. **Company Required**: Technicians MUST have company_id
4. **Batch System**: Batches are auto-managed via triggers
5. **RLS Active**: All queries go through RLS policies
6. **Arabic First**: Default language is Arabic ('ar')
7. **SAR Currency**: All amounts in Saudi Riyals

---

## 🆘 Support

For questions about:
- **Database**: Check migration files
- **Business Logic**: Check function files
- **Security**: Check RLS policies
- **Frontend**: Check this reference guide

---

*Last Updated: 2025*
*Version: 5.0*