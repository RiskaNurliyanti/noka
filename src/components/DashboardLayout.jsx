import { useState } from 'react'
import Sidebar from './Sidebar'

// Layout dashboard: Sidebar tetap di desktop, jadi Drawer (slide-in) di mobile.
export default function DashboardLayout({ children }) {
  const [drawerBuka, setDrawerBuka] = useState(false)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Tombol buka drawer - cuma muncul di mobile */}
      <button
        onClick={() => setDrawerBuka(true)}
        className="md:hidden mb-4 flex items-center gap-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
      >
        <span>☰</span> Menu
      </button>

      <div className="flex gap-8">
        {/* Sidebar desktop */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>

        {/* Drawer mobile */}
        {drawerBuka && (
          <div className="fixed inset-0 z-[1200] md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerBuka(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-brand-500">Menu</p>
                <button onClick={() => setDrawerBuka(false)} className="text-gray-400 text-lg">✕</button>
              </div>
              <Sidebar onNavigate={() => setDrawerBuka(false)} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
