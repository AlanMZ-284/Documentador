'use client'

import { useEffect, useState } from 'react'
import { usuariosService, Usuario } from '../../lib/usuariosService'
import { UserPlus, Shield, Power, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 1. GET /api/usuarios - Cargar el personal al montar la vista
  const cargarCatálogo = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await usuariosService.listarTodos()
      setUsuarios(data)
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el catálogo de usuarios del backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCatálogo()
  }, [])

  // 2. POST /api/usuarios/:id/deactivate - Dar de baja
  const handleDesactivar = async (id: string) => {
    if (confirm('¿Estás segura de que deseas inactivar a este usuario?')) {
      try {
        await usuariosService.desactivar(id)
        alert('Usuario desactivado correctamente.')
        cargarCatálogo() // Recarga inmediata de la tabla
      } catch (err) {
        alert('Error al desactivar el usuario.')
      }
    }
  }

  // 3. POST /api/usuarios/:id/activate - Dar de alta
  const handleActivar = async (id: string) => {
    try {
      await usuariosService.activar(id)
      alert('Usuario reactivado con éxito.')
      cargarCatálogo()
    } catch (err) {
      alert('Error al activar el usuario.')
    }
  }

  // 4. POST /api/usuarios/:id/reset-password - Resetear contraseña
  const handleResetPassword = async (id: string) => {
    if (confirm('¿Deseas restablecer la contraseña de este usuario a los valores de fábrica?')) {
      try {
        const res = await usuariosService.resetPassword(id)
        alert(res.message || 'Contraseña restablecida con éxito.')
      } catch (err) {
        alert('Error al restablecer la contraseña.')
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Control de Personal</h1>
          <p className="text-xs text-gray-500 mt-1">Administra accesos, roles, estados y contraseñas de la plataforma.</p>
        </div>
        <button 
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          onClick={() => alert('Aquí abriremos el formulario de registro de usuario')}
        >
          <UserPlus size={16} />
          Registrar Usuario
        </button>
      </div>

      {/* Manejo de Alertas */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabla de Administración */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-red-700 rounded-full animate-spin" />
            Sincronizando con base de datos en Docker...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No hay usuarios registrados en el sistema actualmente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-gray-50/70">
                  <th className="p-4">Nombre Completo</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Puesto</th>
                  <th className="p-4">Rol de Sistema</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {usuarios.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="p-4 font-medium text-gray-900">{usr.nombre}</td>
                    <td className="p-4 text-gray-500">{usr.email}</td>
                    <td className="p-4 text-gray-500">{usr.puesto}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                        <Shield size={12} />
                        {usr.rol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        usr.activo ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {usr.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {usr.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-3">
                      <button
                        onClick={() => handleResetPassword(usr.id)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors inline-flex items-center gap-1"
                        title="Restablecer Contraseña"
                      >
                        <RefreshCw size={13} />
                        Reset
                      </button>
                      <button
                        onClick={() => usr.activo ? handleDesactivar(usr.id) : handleActivar(usr.id)}
                        className={`text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                          usr.activo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        <Power size={13} />
                        {usr.activo ? 'Dar de baja' : 'Dar de alta'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}