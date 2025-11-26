'use client'

import { useState, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {
  customerRegisterSchema,
  companyRegisterSchema,
  technicianRegisterSchema,
  type CustomerRegisterFormData,
  type CompanyRegisterFormData,
  type TechnicianRegisterFormData,
} from '@/lib/validations/auth'

import {
  registerCustomerAction,
  registerCompanyAction,
  registerTechnicianAction,
} from '@/lib/actions/auth'

// ============================================
// Customer Registration Form
// ============================================
function CustomerRegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CustomerRegisterFormData>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: CustomerRegisterFormData) => {
    startTransition(async () => {
      const result = await registerCustomerAction(data)
      
      if (result.success) {
        toast.success(result.message)
        router.push('/verify?registered=true')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسمك الكامل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="example@email.com" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الجوال (اختياري)</FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="+966501234567" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-700 text-sm">
            🎁 سجّل الآن واحصل على <strong>100 ريال</strong> رصيد ترحيبي!
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isPending}>
          {isPending ? 'جاري التسجيل...' : 'إنشاء حساب عميل'}
        </Button>
      </form>
    </Form>
  )
}

// ============================================
// Company Registration Form
// ============================================
function CompanyRegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CompanyRegisterFormData>({
    resolver: zodResolver(companyRegisterSchema),
    defaultValues: {
      ownerName: '',
      companyName: '',
      email: '',
      phone: '',
      commercialRegister: '',
      city: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: CompanyRegisterFormData) => {
    startTransition(async () => {
      const result = await registerCompanyAction(data)
      
      if (result.success) {
        toast.success(result.message)
        router.push('/verify?registered=true&type=company')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ownerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم المالك *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل اسم المالك" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم الشركة *</FormLabel>
                <FormControl>
                  <Input placeholder="اسم الشركة" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="company@email.com" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الجوال *</FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="+966501234567" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="commercialRegister"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم السجل التجاري</FormLabel>
                <FormControl>
                  <Input placeholder="1010XXXXXX" dir="ltr" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المدينة</FormLabel>
                <FormControl>
                  <Input placeholder="الرياض" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-purple-700 text-sm">
            📋 سيتم مراجعة طلبك خلال <strong>24 ساعة</strong>
          </p>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" disabled={isPending}>
          {isPending ? 'جاري التسجيل...' : 'تسجيل الشركة'}
        </Button>
      </form>
    </Form>
  )
}

// ============================================
// Technician Registration Form
// ============================================
function TechnicianRegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<TechnicianRegisterFormData>({
    resolver: zodResolver(technicianRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      companyId: '',
      specialization: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: TechnicianRegisterFormData) => {
    startTransition(async () => {
      const result = await registerTechnicianAction(data)
      
      if (result.success) {
        toast.success(result.message)
        router.push('/verify?registered=true&type=technician')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم الكامل *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل اسمك الكامل" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الإلكتروني *</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="example@email.com" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الجوال *</FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="+966501234567" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>معرف الشركة *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="أدخل معرف الشركة (UUID)" 
                  dir="ltr"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-gray-500">احصل على معرف الشركة من مدير الشركة</p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التخصص</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="سباكة">سباكة</SelectItem>
                  <SelectItem value="كهرباء">كهرباء</SelectItem>
                  <SelectItem value="تكييف">تكييف</SelectItem>
                  <SelectItem value="نجارة">نجارة</SelectItem>
                  <SelectItem value="دهان">دهان</SelectItem>
                  <SelectItem value="تنظيف">تنظيف</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تأكيد كلمة المرور *</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-orange-700 text-sm">
            ⏳ سيتم إشعارك عند موافقة الشركة على انضمامك
          </p>
        </div>

        <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" size="lg" disabled={isPending}>
          {isPending ? 'جاري التسجيل...' : 'تسجيل كفني'}
        </Button>
      </form>
    </Form>
  )
}

// ============================================
// Register Page Content (with useSearchParams)
// ============================================
function RegisterContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('type') || 'customer'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8" dir="rtl">
      <div className="w-full max-w-lg px-4">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">HMAPP</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardDescription className="text-center">
              اختر نوع الحساب المناسب لك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="customer">عميل</TabsTrigger>
                <TabsTrigger value="technician">فني</TabsTrigger>
                <TabsTrigger value="company">شركة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customer">
                <CustomerRegisterForm />
              </TabsContent>
              
              <TabsContent value="technician">
                <TechnicianRegisterForm />
              </TabsContent>
              
              <TabsContent value="company">
                <CompanyRegisterForm />
              </TabsContent>
            </Tabs>

            <p className="text-center text-gray-600 mt-6 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                تسجيل الدخول
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================
// Main Register Page (wrapped in Suspense)
// ============================================
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
