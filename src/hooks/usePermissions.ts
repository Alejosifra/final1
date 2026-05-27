import { useAuthStore } from '../stores/authStore';
import { usePermissionsStore } from '../stores/permissionsStore';

export function usePermissions() {
  const { currentUser } = useAuthStore();
  const { hasPermission } = usePermissionsStore();

  const can = (permissionKey: string): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role, permissionKey);
  };

  const isAdminOrSupervisor = (): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'Admin' || 
           currentUser.role === 'Supervisor' || 
           hasPermission(currentUser.role, 'RESET_SYSTEM') || 
           hasPermission(currentUser.role, 'VOID_ORDER');
  };

  return {
    can,
    isAdminOrSupervisor,
    role: currentUser?.role || null,
    user: currentUser
  };
}
