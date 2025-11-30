import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Mail, Phone, MapPin, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ملف الشركة | HMAPP',
  description: 'إدارة بيانات الشركة',
}

export default async function CompanyProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Company Details
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (error || !company) {
    console.error('Error fetching company:', error)
    return <div>فشل في تحميل بيانات الشركة</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">ملف الشركة</h1>
        <Button variant="outline">تعديل البيانات</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم الشركة</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span>{company.name}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>رقم السجل التجاري</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-mono">{company.commercial_register || 'غير متوفر'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span dir="ltr">{company.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span dir="ltr">{company.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>المدينة</Label>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{company.city || 'غير محدد'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
              <p className="text-sm text-blue-600 mb-1">الحالة الحالية</p>
              <p className="text-xl font-bold text-blue-700">
                {company.status === 'active' ? 'نشط' : 
                 company.status === 'pending_verification' ? 'قيد المراجعة' : 
                 company.status === 'suspended' ? 'موقوف' : company.status}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">تاريخ التسجيل:</span>
                <span>{new Date(company.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">نسبة العمولة:</span>
                <span>{company.commission_rate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
