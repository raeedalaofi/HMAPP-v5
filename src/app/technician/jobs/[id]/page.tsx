export default function TechnicianJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">تفاصيل الطلب</h1>
      <p className="text-gray-600">تفاصيل الطلب - قيد التطوير</p>
    </div>
  )
}
