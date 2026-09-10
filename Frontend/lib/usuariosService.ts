import { usuariosApi } from './api';

// manejo de tipos de Usuario según el Backend
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  puesto: string;
  rol: 'ADMIN' | 'USER' | 'SUPERADMIN';
  activo: boolean;
  createdAt?: string;
}

export const usuariosService = {
  // GET /api/usuarios
  listarTodos: async (): Promise<Usuario[]> => {
    const response = await usuariosApi.list();
    // Si es paginado extrae .items, si no, lo fuerza como arreglo de Usuarios
    return (response as any).items || (response as unknown as Usuario[]);
  },

  // POST /api/usuarios - nuevo usuario
  crear: async (usuarioData: Omit<Usuario, 'id' | 'activo'>): Promise<Usuario> => {
    // Forzamos el tipado a any al enviarlo para saltar la validación estricta de la API central
    const response = await usuariosApi.create(usuarioData as any); 
    return response as unknown as Usuario;
  },

  // GET /api/usuarios/:id
  obtenerPorId: async (id: string): Promise<Usuario> => {
    const response = await usuariosApi.get(id);
    return response as unknown as Usuario;
  },

  // PATCH /api/usuarios/:id
  actualizar: async (id: string, usuarioData: Partial<Omit<Usuario, 'id'>>): Promise<Usuario> => {
    const response = await usuariosApi.update(id, usuarioData);
    return response as unknown as Usuario;
  },

  // POST /api/usuarios/:id/reset-password
  resetPassword: async (id: string): Promise<{ message: string }> => {
    const response = await usuariosApi.resetPassword(id);
    return response as { message: string };
  },

  desactivar: async (id: string): Promise<Usuario> => {
    const response = await usuariosApi.deactivate(id);
    return response as unknown as Usuario;
  },
  deactivate: async (id: string): Promise<Usuario> => {
    const response = await usuariosApi.deactivate(id);
    return response as unknown as Usuario;
  },

  // 2. POST /api/usuarios/:id/activate - Dar de alta
  activar: async (id: string): Promise<Usuario> => {
    const response = await usuariosApi.activate(id);
    return response as unknown as Usuario;
  },
  activate: async (id: string): Promise<Usuario> => {
    const response = await usuariosApi.activate(id);
    return response as unknown as Usuario;
  }
};