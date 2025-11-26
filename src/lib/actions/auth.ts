'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  loginSchema, 
  customerRegisterSchema, 
  companyRegisterSchema, 
  technicianRegisterSchema,
  type LoginFormData,
  type CustomerRegisterFormData,
  type CompanyRegisterFormData,
  type TechnicianRegisterFormData
} from '@/lib/validations/auth'

export type AuthResult = {
  success: boolean
  message: string
  redirectTo?: string
  data?: Record<string, unknown>
}

// ============================================
// Login Action
// ============================================
export async function loginAction(formData: LoginFormData): Promise<AuthResult> {
  try {
    // Validate input
    const validated = loginSchema.safeParse(formData)
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message || 'بيانات غير صحيحة'
      }
    }

    const supabase = await createClient()
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    })

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
      }
      if (authError.message.includes('Email not confirmed')) {
        return { success: false, message: 'يرجى تأكيد بريدك الإلكتروني أولاً' }
      }
      return { success: false, message: authError.message }
    }

    if (!authData.user) {
      return { success: false, message: 'فشل في تسجيل الدخول' }
    }

    // Get user role from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, message: 'لم يتم العثور على الملف الشخصي' }
    }

    // Determine redirect based on role
    let redirectTo = '/'
    switch (profile.role) {
      case 'customer':
        redirectTo = '/customer/home'
        break
      case 'technician':
        redirectTo = '/technician/dashboard'
        break
      case 'company_owner':
        redirectTo = '/company/dashboard'
        break
      case 'admin':
      case 'super_admin':
        redirectTo = '/admin/dashboard'
        break
    }

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      redirectTo,
      data: { role: profile.role }
    }

  } catch (error) {
    console.error('Login error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}

// ============================================
// Customer Registration Action
// ============================================
export async function registerCustomerAction(formData: CustomerRegisterFormData): Promise<AuthResult> {
  try {
    // Validate input
    const validated = customerRegisterSchema.safeParse(formData)
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message || 'بيانات غير صحيحة'
      }
    }

    const supabase = await createClient()
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify`,
        data: {
          full_name: validated.data.fullName,
          user_type: 'customer'
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' }
      }
      return { success: false, message: authError.message }
    }

    if (!authData.user) {
      return { success: false, message: 'فشل في إنشاء الحساب' }
    }

    // 2. Call register_customer RPC
    const { data: registerData, error: registerError } = await supabase.rpc('register_customer', {
      p_user_id: authData.user.id,
      p_full_name: validated.data.fullName,
      p_phone: validated.data.phone || undefined,
      p_email: validated.data.email
    })

    if (registerError) {
      console.error('Register customer error:', registerError)
      // Try to clean up auth user if profile creation fails
      return { success: false, message: registerError.message }
    }

    return {
      success: true,
      message: 'تم التسجيل بنجاح! تحقق من بريدك الإلكتروني لتأكيد الحساب',
      data: registerData as Record<string, unknown>
    }

  } catch (error) {
    console.error('Customer registration error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}

// ============================================
// Company Registration Action
// ============================================
export async function registerCompanyAction(formData: CompanyRegisterFormData): Promise<AuthResult> {
  try {
    // Validate input
    const validated = companyRegisterSchema.safeParse(formData)
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message || 'بيانات غير صحيحة'
      }
    }

    const supabase = await createClient()
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify`,
        data: {
          full_name: validated.data.ownerName,
          user_type: 'company_owner'
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' }
      }
      return { success: false, message: authError.message }
    }

    if (!authData.user) {
      return { success: false, message: 'فشل في إنشاء الحساب' }
    }

    // 2. Call register_company RPC
    const { data: registerData, error: registerError } = await supabase.rpc('register_company', {
      p_user_id: authData.user.id,
      p_owner_name: validated.data.ownerName,
      p_company_name: validated.data.companyName,
      p_phone: validated.data.phone,
      p_email: validated.data.email,
      p_commercial_register: validated.data.commercialRegister || undefined,
      p_city: validated.data.city || undefined
    })

    if (registerError) {
      console.error('Register company error:', registerError)
      return { success: false, message: registerError.message }
    }

    return {
      success: true,
      message: 'تم تسجيل الشركة بنجاح! سيتم مراجعة طلبك خلال 24 ساعة',
      data: registerData as Record<string, unknown>
    }

  } catch (error) {
    console.error('Company registration error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}

// ============================================
// Technician Registration Action
// ============================================
export async function registerTechnicianAction(formData: TechnicianRegisterFormData): Promise<AuthResult> {
  try {
    // Validate input
    const validated = technicianRegisterSchema.safeParse(formData)
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message || 'بيانات غير صحيحة'
      }
    }

    const supabase = await createClient()
    
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify`,
        data: {
          full_name: validated.data.fullName,
          user_type: 'technician'
        }
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' }
      }
      return { success: false, message: authError.message }
    }

    if (!authData.user) {
      return { success: false, message: 'فشل في إنشاء الحساب' }
    }

    // 2. Call register_technician RPC
    const { data: registerData, error: registerError } = await supabase.rpc('register_technician', {
      p_user_id: authData.user.id,
      p_full_name: validated.data.fullName,
      p_phone: validated.data.phone,
      p_company_id: validated.data.companyId,
      p_email: validated.data.email,
      p_specialization: validated.data.specialization || undefined
    })

    if (registerError) {
      console.error('Register technician error:', registerError)
      if (registerError.message.includes('Company not found')) {
        return { success: false, message: 'الشركة غير موجودة أو غير نشطة' }
      }
      return { success: false, message: registerError.message }
    }

    return {
      success: true,
      message: 'تم التسجيل بنجاح! في انتظار موافقة الشركة',
      data: registerData as Record<string, unknown>
    }

  } catch (error) {
    console.error('Technician registration error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}

// ============================================
// Logout Action
// ============================================
export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ============================================
// Forgot Password Action
// ============================================
export async function forgotPasswordAction(email: string): Promise<AuthResult> {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'أدخل بريد إلكتروني صحيح' }
    }

    const supabase = await createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return {
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}

// ============================================
// Reset Password Action (after email link)
// ============================================
export async function resetPasswordAction(newPassword: string): Promise<AuthResult> {
  try {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
    }

    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    }

  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, message: 'حدث خطأ غير متوقع' }
  }
}
