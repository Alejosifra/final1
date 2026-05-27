import { create } from 'zustand';

export type UserRole = 'Admin' | 'Cajero' | 'Mesero' | 'Cocina' | 'Supervisor';

export interface EnterpriseUser {
  id: string;
  email: string;
  fullname: string;
  role: UserRole;
  avatar: string;
}

// Preset profiles for instant testing in the preview environment
export const SYSTEM_USERS: EnterpriseUser[] = [
  { id: 'usr-101', email: 'admin@lualgastro.com', fullname: 'Santiago Mendoza', role: 'Admin', avatar: '👔' },
  { id: 'usr-102', email: 'carlos.caja@lualgastro.com', fullname: 'Carlos Restrepo', role: 'Cajero', avatar: '💵' },
  { id: 'usr-103', email: 'adriana.waiter@lualgastro.com', fullname: 'Adriana Ortiz', role: 'Mesero', avatar: '🏃' },
  { id: 'usr-104', email: 'marcos.cocina@lualgastro.com', fullname: 'Chef Marcos G.', role: 'Cocina', avatar: '🍳' },
  { id: 'usr-105', email: 'supervisor@lualgastro.com', fullname: 'Patricia Pérez', role: 'Supervisor', avatar: '🕵️' },
];

interface AuthState {
  currentUser: EnterpriseUser;
  lastLoginTime: string;
  isUnlocked: boolean; // For temporary supervisor action override
  login: (email: string) => boolean;
  switchUser: (role: UserRole) => void;
  logout: () => void;
  checkPermission: (action: string) => { allowed: boolean; reason?: string };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: SYSTEM_USERS[0], // Default as Admin for easy initial access
  lastLoginTime: new Date().toISOString(),
  isUnlocked: false,

  login: (email: string) => {
    const found = SYSTEM_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      set({ currentUser: found, lastLoginTime: new Date().toISOString(), isUnlocked: false });
      return true;
    }
    return false;
  },

  switchUser: (role: UserRole) => {
    const userMatched = SYSTEM_USERS.find(u => u.role === role);
    if (userMatched) {
      set({ currentUser: userMatched, isUnlocked: false });
    }
  },

  logout: () => {
    // Reset to Waiter level or first test-user
    set({ currentUser: SYSTEM_USERS[2], isUnlocked: false });
  },

  checkPermission: (action: string) => {
    const role = get().currentUser.role;
    
    // Admin has total override
    if (role === 'Admin') {
      return { allowed: true };
    }

    switch (action) {
      case 'EDIT_CATALOG':
        if (role === 'Supervisor') return { allowed: true };
        return { allowed: false, reason: 'Solo Administradores o Supervisores pueden editar el catálogo de productos.' };
      
      case 'DELETE_HISTORY':
      case 'VOID_ORDER':
        if (role === 'Supervisor') return { allowed: true };
        return { allowed: false, reason: 'La reversión de cuentas requiere autorización de un Supervisor.' };
      
      case 'VIEW_REPORTS':
        if (role === 'Supervisor' || role === 'Cajero') return { allowed: true };
        return { allowed: false, reason: 'El acceso a estados financieros está reservado para directores.' };
      
      case 'MANAGE_INVENTORY':
        if (role === 'Supervisor') return { allowed: true };
        return { allowed: false, reason: 'Solo el Supervisor o Admin controla el Kardex de inventarios.' };

      case 'OPEN_CLOSE_CASH':
        if (role === 'Cajero' || role === 'Supervisor') return { allowed: true };
        return { allowed: false, reason: 'La gestión monetaria del turno de caja requiere nivel de Cajero.' };

      case 'SERVICE_ORDERS':
        if (role === 'Cocina') {
          return { allowed: false, reason: 'Personal de Cocina solo tiene privilegios de lectura de comandas.' };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }
}));
