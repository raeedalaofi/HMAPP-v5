import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">HMAPP</h1>
          <div className="flex gap-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              تسجيل الدخول
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            منصة الصيانة المنزلية
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            تربط العملاء بالفنيين المهرة لجميع خدمات الصيانة المنزلية
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">للعملاء</h3>
            <p className="text-gray-600">
              اطلب خدمة صيانة واستلم عروض أسعار من فنيين متخصصين في منطقتك
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">للفنيين</h3>
            <p className="text-gray-600">
              انضم لشركة صيانة واحصل على طلبات عمل في منطقتك
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏢</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">للشركات</h3>
            <p className="text-gray-600">
              أدر فريق الفنيين لديك وتابع الإيرادات والدفعات
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            href="/register" 
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            ابدأ الآن
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 HMAPP - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}
