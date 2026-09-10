export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#f4f4f7' }}
    >
      {children}
    </div>
  )
}
