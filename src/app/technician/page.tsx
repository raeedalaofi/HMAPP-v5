export default function TechnicianDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">الطلبات المتاحة</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">الطلبات الجارية</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">الأرباح اليوم</p>
          <p className="text-3xl font-bold">0 ر.س</p>
        </div>
      </div>
    </div>
  )
}
