'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { loginAction, forgotPasswordAction } from '@/lib/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormData) => {
    startTransition(async () => {
      const result = await loginAction(data)
      
      if (result.success) {
        toast.success(result.message)
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleForgotPassword = () => {
    const email = form.getValues('email')
    if (!email) {
      toast.error('أدخل بريدك الإلكتروني أولاً')
      return
    }

    startTransition(async () => {
      const result = await forgotPasswordAction(email)
      
      if (result.success) {
        toast.success(result.message)
        setShowForgotPassword(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">HMAPP</span>
          </Link>
          <p className="text-gray-500">منصة خدمات الصيانة</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بياناتك للوصول لحسابك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-blue-600 hover:underline"
                    disabled={isPending}
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">أو</span>
              </div>
            </div>

            <p className="text-center text-gray-600 text-sm">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                إنشاء حساب جديد
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
