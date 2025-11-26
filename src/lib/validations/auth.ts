import { z } from 'zod'

// Common validation patterns
const phoneRegex = /^(\+966|0)?5\d{8}$/
const saudiPhoneMessage = 'رقم الجوال غير صحيح (مثال: 0501234567 أو +966501234567)'

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Customer Registration Schema
export const customerRegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, 'الاسم الكامل مطلوب')
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || phoneRegex.test(val), saudiPhoneMessage),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z
    .string()
    .min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export type CustomerRegisterFormData = z.infer<typeof customerRegisterSchema>

// Company Registration Schema
export const companyRegisterSchema = z.object({
  ownerName: z
    .string()
    .min(1, 'اسم المالك مطلوب')
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  companyName: z
    .string()
    .min(1, 'اسم الشركة مطلوب')
    .min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
  phone: z
    .string()
    .min(1, 'رقم الجوال مطلوب')
    .regex(phoneRegex, saudiPhoneMessage),
  commercialRegister: z
    .string()
    .optional(),
  city: z
    .string()
    .optional(),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z
    .string()
    .min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>

// Technician Registration Schema
export const technicianRegisterSchema = z.object({
  fullName: z
    .string()
    .min(1, 'الاسم الكامل مطلوب')
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email('البريد الإلكتروني غير صحيح'),
  phone: z
    .string()
    .min(1, 'رقم الجوال مطلوب')
    .regex(phoneRegex, saudiPhoneMessage),
  companyId: z
    .string()
    .min(1, 'معرف الشركة مطلوب')
    .uuid('معرف الشركة غير صحيح'),
  specialization: z
    .string()
    .optional(),
  password: z
    .string()
    .min(1, 'كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z
    .string()
    .min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
})

export type TechnicianRegisterFormData = z.infer<typeof technicianRegisterSchema>
