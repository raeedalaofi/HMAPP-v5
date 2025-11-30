import Link from 'next/link'
import { LayoutDashboard, Users, FileText, Wallet, Settings } from 'lucide-react'

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl text-green-600">HMAPP</span>
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">شركات</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:space-x-reverse">
                <Link 
                  href="/company/dashboard" 
                  className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                  الرئيسية
                </Link>
                <Link 
                  href="/company/technicians" 
                  className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <Users className="w-4 h-4 ml-2" />
                  الفنيين
                </Link>
                <Link 
                  href="/company/batches" 
                  className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <FileText className="w-4 h-4 ml-2" />
                  الدفعات
                </Link>
                <Link 
                  href="/company/wallet" 
                  className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <Wallet className="w-4 h-4 ml-2" />
                  المحفظة
                </Link>
                <Link 
                  href="/company/profile" 
                  className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  <Settings className="w-4 h-4 ml-2" />
                  الإعدادات
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {/* User Menu could go here */}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
