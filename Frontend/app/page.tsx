import { redirect } from 'next/navigation'

export default function RootPage() {
  // Cambiamos temporalmente '/login' por '/usuarios' para probar tu módulo directamente
  redirect('/usuarios')
}