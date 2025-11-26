import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">HMAPP</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">تسجيل الدخول</Button>
            </Link>
            <Link href="/register">
              <Button>إنشاء حساب</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
          🚀 منصة خدمات الصيانة الأولى في المملكة
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          صيانة منزلك <span className="text-blue-600">بضغطة زر</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          منصة تربط العملاء بأفضل الفنيين المعتمدين من شركات موثوقة.
          سباكة، كهرباء، تكييف، وأكثر - في أي وقت وأي مكان.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register?type=customer">
            <Button size="lg" className="text-lg px-8">
              أطلب خدمة الآن
            </Button>
          </Link>
          <Link href="/register?type=company">
            <Button size="lg" variant="outline" className="text-lg px-8">
              سجّل شركتك
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">لماذا HMAPP؟</h2>
          <p className="text-gray-600">مميزات تجعل تجربتك أفضل</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">سرعة الاستجابة</h3>
            <p className="text-gray-600">احصل على عروض من الفنيين خلال 5 دقائق فقط</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">فنيون معتمدون</h3>
            <p className="text-gray-600">جميع الفنيين تابعون لشركات موثقة ومعتمدة</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">أسعار تنافسية</h3>
            <p className="text-gray-600">قارن العروض واختر الأنسب لميزانيتك</p>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-3xl my-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">انضم إلينا</h2>
          <p className="text-gray-600">اختر الطريقة المناسبة للانضمام</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Customer Card */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-500">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👤</span>
              </div>
              <CardTitle className="text-2xl">عميل</CardTitle>
              <CardDescription>أحتاج خدمة صيانة لمنزلي</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-right">
                <li>✓ أنشر طلبك واستقبل عروض الفنيين</li>
                <li>✓ اختر العرض المناسب والوقت المناسب</li>
                <li>✓ ادفع إلكترونياً بأمان</li>
                <li>✓ قيّم الخدمة بعد الانتهاء</li>
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-green-700 font-medium text-sm">
                  🎁 سجّل الآن واحصل على 100 ريال رصيد!
                </p>
              </div>
              <Link href="/register?type=customer" className="block">
                <Button className="w-full" size="lg">
                  تسجيل كعميل
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Technician Card */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-orange-500">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔧</span>
              </div>
              <CardTitle className="text-2xl">فني</CardTitle>
              <CardDescription>أريد العمل وتقديم خدماتي</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-right">
                <li>✓ استقبل طلبات قريبة من موقعك</li>
                <li>✓ قدم عروضك واربح العمل</li>
                <li>✓ اعمل بمرونة في أوقاتك</li>
                <li>✓ احصل على تقييمات وبناء سمعتك</li>
              </ul>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-orange-700 font-medium text-sm">
                  ⚠️ يجب أن تكون تابعاً لشركة مسجلة
                </p>
              </div>
              <Link href="/register?type=technician" className="block">
                <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                  تسجيل كفني
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-purple-500">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏢</span>
              </div>
              <CardTitle className="text-2xl">شركة</CardTitle>
              <CardDescription>أريد تسجيل شركتي وفنييها</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-gray-600 space-y-2 mb-6 text-right">
                <li>✓ سجّل شركتك وأضف فنييك</li>
                <li>✓ تابع أداء الفنيين والطلبات</li>
                <li>✓ احصل على 15% عمولة من كل طلب</li>
                <li>✓ اسحب أرباحك عند اكتمال الدورة</li>
              </ul>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <p className="text-purple-700 font-medium text-sm">
                  📋 يتطلب سجل تجاري للتفعيل
                </p>
              </div>
              <Link href="/register?type=company" className="block">
                <Button className="w-full bg-purple-500 hover:bg-purple-600" size="lg">
                  تسجيل شركة
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">كيف يعمل؟</h2>
          <p className="text-gray-600">خطوات بسيطة للحصول على الخدمة</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h3 className="font-semibold mb-2">اختر الخدمة</h3>
            <p className="text-sm text-gray-600">حدد نوع الخدمة ووصف المشكلة</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h3 className="font-semibold mb-2">استقبل العروض</h3>
            <p className="text-sm text-gray-600">انتظر 5 دقائق لاستلام عروض الفنيين</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h3 className="font-semibold mb-2">اختر وادفع</h3>
            <p className="text-sm text-gray-600">اختر العرض المناسب وأكمل الدفع</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
            <h3 className="font-semibold mb-2">استقبل الفني</h3>
            <p className="text-sm text-gray-600">الفني في طريقه إليك!</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">+1000</div>
              <div className="text-blue-200">فني معتمد</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">+50</div>
              <div className="text-blue-200">شركة شريكة</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">+10,000</div>
              <div className="text-blue-200">طلب مكتمل</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.8</div>
              <div className="text-blue-200">متوسط التقييم</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">H</span>
                </div>
                <span className="text-xl font-bold text-white">HMAPP</span>
              </div>
              <p className="text-sm">منصة خدمات الصيانة المنزلية الأولى في المملكة العربية السعودية</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">من نحن</Link></li>
                <li><Link href="/services" className="hover:text-white">خدماتنا</Link></li>
                <li><Link href="/contact" className="hover:text-white">اتصل بنا</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">الدعم</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="hover:text-white">الأسئلة الشائعة</Link></li>
                <li><Link href="/privacy" className="hover:text-white">سياسة الخصوصية</Link></li>
                <li><Link href="/terms" className="hover:text-white">الشروط والأحكام</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">تواصل معنا</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 support@hmapp.com</li>
                <li>📱 +966 50 000 0000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2025 HMAPP. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  )
}
