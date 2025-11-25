export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <span className="font-bold text-lg">HMAPP - لوحة الشركة</span>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
