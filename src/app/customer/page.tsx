export default function CustomerHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">مرحباً بك في HMAPP</h1>
      <p className="text-gray-600 mb-8">ابحث عن فني متخصص لخدمات الصيانة المنزلية</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">فئات الخدمات - قيد التطوير</p>
        </div>
      </div>
    </div>
  )
}
