import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Wallet, Plus, Settings, CreditCard, FileText, UserCog } from 'lucide-react'

export const metadata: Metadata = {
  title: 'لوحة تحكم الشركة | HMAPP',
  description: 'ملخص أداء الشركة وإدارة الفنيين',
}

export default async function CompanyDashboardPage() {
  const supabase = await createClient()

  // 1. Get Current User
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Company Stats
  const { data: statsData, error } = await supabase.rpc('get_company_stats', {
    p_user_id: user.id,
  })

  if (error) {
    console.error('Error fetching company stats:', error)
  }

  // 3. Parse Data (Safe Defaults)
  const stats = statsData as any
  const ownerName = user.user_metadata?.full_name || 'المالك'
  const companyName = stats?.company?.name || ''
  
  const totalTechnicians = stats?.stats?.total_technicians || 0
  const activeTechnicians = stats?.stats?.active_technicians || 0
  const totalRevenue = stats?.stats?.total_revenue || 0
  const completedJobs = stats?.stats?.completed_jobs || 0
  const totalJobs = stats?.stats?.total_jobs || 0
  const activeJobs = totalJobs - completedJobs // Approximate active jobs

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مرحباً، {ownerName} 👋</h1>
          <p className="text-gray-500 mt-1">
            {companyName ? `لوحة تحكم ${companyName}` : 'إليك ملخص لأداء شركتك اليوم'}
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          <Link href="/company/technicians/new">
            <Plus className="w-4 h-4 ml-2" />
            إضافة فني جديد
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Technicians Card */}
        <Card className="border-t-4 border-t-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              إجمالي الفنيين
            </CardTitle>
            <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTechnicians}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">{activeTechnicians}</span> نشط حالياً
            </p>
          </CardContent>
        </Card>

        {/* Jobs Card */}
        <Card className="border-t-4 border-t-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              الطلبات النشطة
            </CardTitle>
            <div className="h-8 w-8 bg-orange-50 rounded-full flex items-center justify-center">
              <Briefcase className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-gray-500 mt-1">
              {completedJobs} طلب مكتمل
            </p>
          </CardContent>
        </Card>

        {/* Earnings Card */}
        <Card className="border-t-4 border-t-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              إجمالي الأرباح
            </CardTitle>
            <div className="h-8 w-8 bg-green-50 rounded-full flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dir="ltr">
              {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              يتم تحديث الأرباح بعد اكتمال الدفعات
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">روابط سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/company/technicians" className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                  <UserCog className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">إدارة الفنيين</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/company/batches" className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-colors">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">الدفعات المالية</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/company/wallet" className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">المحفظة</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/company/profile" className="block group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">ملف الشركة</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
