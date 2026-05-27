import { usePermissionsStore } from '../stores/permissionsStore';
import { UserRole } from '../stores/authStore';

export class PermissionsService {
  /**
   * Helper utility to quickly enforce RBAC rules inside any view.
   */
  static isAllowed(role: UserRole, permissionKey: string): boolean {
    const store = usePermissionsStore.getState();
    return store.hasPermission(role, permissionKey);
  }

  static getPermissionsByCategory() {
    const list = usePermissionsStore.getState().rolePermissions;
    return list;
  }
}
