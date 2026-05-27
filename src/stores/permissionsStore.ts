import { create } from 'zustand';
import { UserRole } from './authStore';

export interface SystemPermission {
  key: string;
  name: string;
  category: 'Caja' | 'Ventas' | 'Inventario' | 'Reportes' | 'Sistema';
  description: string;
}

export const LIST_OF_PERMISSIONS: SystemPermission[] = [
  { key: 'OPEN_CLOSE_CASH', name: 'Apertura y Cierre de Jornada', category: 'Caja', description: 'Permite abrir caja inicial y autorizar el retiro neto diario.' },
  { key: 'APPLIAR_DESCUENTO', name: 'Aplicar Descuentos Comerciales', category: 'Ventas', description: 'Autorizar reducciones porcentuales sobre la comanda de mesa.' },
  { key: 'VOID_ORDER', name: 'Anular u Modificar Cuentas Activas', category: 'Ventas', description: 'Permite revocar ítems o tickets confirmados por auditoría.' },
  { key: 'MANAGE_INVENTORY', name: 'Modificar Catálogo e Inventario', category: 'Inventario', description: 'Creación de platos, modificación de precios y ajustes de Kardex de stock mínimo.' },
  { key: 'VIEW_REPORTS', name: 'Acceso a Reportes Financieros', category: 'Reportes', description: 'Visualizar ventas del día/mes, ticket promedio, KPI de utilidad y márgenes de ganancia.' },
  { key: 'VIEW_AUDIT', name: 'Monitorear Bitácora de Auditoría Inmutable', category: 'Sistema', description: 'Leer logs críticos del sistema con estampas de cambio.' },
  { key: 'MANAGE_SETTINGS', name: 'Modificar Ajustes de Empresa e Impresoras', category: 'Sistema', description: 'Editar NIT, dirección, IVA, propinas sugeridas y sockets de impresión.' },
  { key: 'RESET_SYSTEM', name: 'Efectuar Reinicios Especiales del Core', category: 'Sistema', description: 'Permitir purgar base de datos de transacciones o inventario con llave supervisor.' },
  { key: 'EXPORT_DATA', name: 'Exportar Informes Administrativos', category: 'Reportes', description: 'Descargar datos de caja, movimientos de Kardex y clientes en formatos Excel/XLSX/JSON.' },
];

// Default roles permissions map
const DEFAULT_ROLE_MAP: Record<UserRole, string[]> = {
  Admin: LIST_OF_PERMISSIONS.map(p => p.key), // Everything
  Supervisor: [
    'OPEN_CLOSE_CASH',
    'APPLIAR_DESCUENTO',
    'VOID_ORDER',
    'MANAGE_INVENTORY',
    'VIEW_REPORTS',
    'VIEW_AUDIT',
    'EXPORT_DATA'
  ],
  Cajero: [
    'OPEN_CLOSE_CASH',
    'EXPORT_DATA',
    'VIEW_REPORTS'
  ],
  Mesero: [],
  Cocina: []
};

interface PermissionsState {
  rolePermissions: Record<UserRole, string[]>;
  togglePermission: (role: UserRole, permissionKey: string) => void;
  hasPermission: (role: UserRole, permissionKey: string) => boolean;
  loadFromLocal: () => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  rolePermissions: DEFAULT_ROLE_MAP,

  togglePermission: (role, permissionKey) => set((state) => {
    const list = state.rolePermissions[role] || [];
    const isPresent = list.includes(permissionKey);
    const updatedList = isPresent 
      ? list.filter(k => k !== permissionKey)
      : [...list, permissionKey];
    
    // Admin is completely immutable and always owns all permissions
    if (role === 'Admin') return {};

    const updatedMap = {
      ...state.rolePermissions,
      [role]: updatedList
    };

    localStorage.setItem('lual_role_permissions', JSON.stringify(updatedMap));
    return { rolePermissions: updatedMap };
  }),

  hasPermission: (role, permissionKey) => {
    if (role === 'Admin') return true;
    const list = get().rolePermissions[role] || [];
    return list.includes(permissionKey);
  },

  loadFromLocal: () => {
    try {
      const stored = localStorage.getItem('lual_role_permissions');
      if (stored) {
        set({ rolePermissions: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to parse cached permissions table:', e);
    }
  }
}));
