// Database Types for HMAPP

export type UserRole = 'customer' | 'technician' | 'company_owner' | 'admin' | 'super_admin'

export type VerificationStatus = 'unverified' | 'email_verified' | 'phone_verified' | 'fully_verified' | 'identity_verified'

export type JobStatus = 
  | 'draft' 
  | 'waiting_for_offers' 
  | 'offers_expired' 
  | 'assigned' 
  | 'payment_pending' 
  | 'payment_expired' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'

export type PaymentLinkStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'

export type BatchStatus = 'active' | 'ready' | 'processing' | 'completed'

export type TechnicianStatus = 'pending_approval' | 'active' | 'suspended' | 'inactive' | 'banned'

export type CompanyStatus = 'pending_verification' | 'active' | 'suspended' | 'inactive'

export type NotificationType = 
  | 'new_job_nearby' 
  | 'offer_received' 
  | 'offer_accepted' 
  | 'offer_rejected' 
  | 'payment_received' 
  | 'job_started' 
  | 'job_completed' 
  | 'new_review' 
  | 'review_response' 
  | 'system_alert' 
  | 'promotion'

// Entity Interfaces
export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  verification: VerificationStatus
  phone_verified: boolean
  email_verified: boolean
  default_location: { lat: number; lng: number } | null
  city: string | null
  language: string
  notification_settings: Record<string, boolean>
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  profile_id: string
  total_jobs: number
  completed_jobs: number
  total_spent: number
  rating: number | null
  total_reviews: number
  is_blocked: boolean
}

export interface Company {
  id: string
  owner_id: string
  name: string
  logo_url: string | null
  commercial_register: string | null
  cr_verified: boolean
  batch_size: number
  commission_rate: number
  total_technicians: number
  active_technicians: number
  total_revenue: number
  rating: number | null
  status: CompanyStatus
}

export interface Technician {
  id: string
  user_id: string
  profile_id: string
  company_id: string
  specialization: string | null
  rating: number | null
  total_reviews: number
  jobs_done: number
  total_earnings: number
  current_location: { lat: number; lng: number } | null
  is_online: boolean
  is_available: boolean
  service_radius_km: number
  status: TechnicianStatus
}

export interface Job {
  id: string
  job_number: string
  customer_id: string
  technician_id: string | null
  company_id: string | null
  address_id: string
  category_id: number
  title: string
  description: string | null
  status: JobStatus
  job_location: { lat: number; lng: number }
  offer_window_expires_at: string | null
  payment_expires_at: string | null
  final_price: number | null
  reward_discount: number
  amount_to_pay: number | null
  amount_paid: number | null
  offers_count: number
  created_at: string
  updated_at: string
}

export interface PriceOffer {
  id: string
  job_id: string
  technician_id: string
  amount: number
  status: OfferStatus
  message: string | null
  estimated_duration_minutes: number | null
  expires_at: string
  created_at: string
}

export interface PaymentLink {
  id: string
  job_id: string
  customer_id: string
  technician_id: string
  subtotal: number
  reward_discount: number
  total: number
  payment_url: string
  token: string
  status: PaymentLinkStatus
  expires_at: string
  paid_at: string | null
}

export interface CompanyBatch {
  id: string
  batch_number: string
  company_id: string
  technician_id: string
  jobs_completed: number
  target_jobs: number
  status: BatchStatus
  total_revenue: number
  company_share: number
  can_withdraw: boolean
  withdrawn_at: string | null
}

export interface Wallet {
  id: string
  owner_type: 'customer' | 'company' | 'platform'
  owner_id: string
  balance: number
  total_earned: number
  total_spent: number
}

export interface JobReview {
  id: string
  job_id: string
  customer_id: string
  technician_id: string
  rating: number
  quality_rating: number | null
  timing_rating: number | null
  behavior_rating: number | null
  price_rating: number | null
  comment: string | null
  response: string | null
  created_at: string
}

export interface CustomerReview {
  id: string
  job_id: string
  technician_id: string
  customer_id: string
  rating: number
  communication_rating: number | null
  location_accuracy_rating: number | null
  payment_rating: number | null
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  recipient_id: string
  type: NotificationType
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface CreateJobForm {
  address_id: string
  category_id: number
  title: string
  description?: string
  preferred_date?: string
  preferred_time_start?: string
  preferred_time_end?: string
  urgency_level?: number
  photo_urls?: string[]
}

export interface SubmitOfferForm {
  job_id: string
  amount: number
  message?: string
  estimated_duration_minutes?: number
}

export interface SubmitReviewForm {
  job_id: string
  rating: number
  comment?: string
  quality_rating?: number
  timing_rating?: number
  behavior_rating?: number
  price_rating?: number
}
