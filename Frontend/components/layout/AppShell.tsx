import Sidebar from './Sidebar'
import Header from './Header'
import RequireAuth from '../auth/RequireAuth'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen" style={{ background: '#f4f4f7' }}>
        <Sidebar />
        <Header />
        <main
          style={{
            marginLeft: 'var(--sidebar-width)',
            paddingTop: '60px',
            minHeight: '100vh',
          }}
        >
          <div className="p-6 max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}