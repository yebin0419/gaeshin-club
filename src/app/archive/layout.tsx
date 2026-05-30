import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
