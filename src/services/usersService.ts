import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { EnterpriseUser, SYSTEM_USERS, UserRole } from '../stores/authStore';
import { OfflineSyncEngine } from './dbQueue';

export interface ExtendedUser extends EnterpriseUser {
  username: string;
  isActive: boolean;
  pin: string; // Supervisor security PIN
}

const LOCAL_STORAGE_KEY = 'lual_settings_users';

export class UsersService {
  /**
   * Loads custom system users list with static SYSTEM_USERS defaults as safety net.
   */
  static getUsers(): ExtendedUser[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading custom user array:', e);
    }

    // Default seed
    const seeded: ExtendedUser[] = SYSTEM_USERS.map((u, index) => ({
      ...u,
      username: u.email.split('@')[0],
      isActive: true,
      pin: index === 0 ? '1234' : '0000' + index
    }));
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  static saveUsers(users: ExtendedUser[]) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
  }

  static async createUser(user: Omit<ExtendedUser, 'id'>): Promise<ExtendedUser> {
    const list = this.getUsers();
    const newUser: ExtendedUser = {
      ...user,
      id: `usr-${Date.now()}`
    };
    
    const updated = [...list, newUser];
    this.saveUsers(updated);

    const payload = {
      id: newUser.id,
      email: newUser.email,
      fullname: newUser.fullname,
      role: newUser.role,
      is_active: newUser.isActive,
      username: newUser.username
    };

    await OfflineSyncEngine.enqueueOp('user_profiles', 'CREATE', payload, newUser.id);

    return newUser;
  }

  static updateUser(id: string, updates: Partial<ExtendedUser>) {
    const list = this.getUsers();
    const updated = list.map(u => {
      if (u.id === id) {
        return { ...u, ...updates };
      }
      return u;
    });
    this.saveUsers(updated);
  }

  static toggleStatus(id: string): boolean {
    const list = this.getUsers();
    let currentStatus = true;
    const updated = list.map(u => {
      if (u.id === id) {
        currentStatus = !u.isActive;
        return { ...u, isActive: currentStatus };
      }
      return u;
    });
    this.saveUsers(updated);
    return currentStatus;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const list = this.getUsers();
    const updated = list.filter(u => u.id !== id);
    this.saveUsers(updated);

    // Queue real multi-tenant Firestore delete op
    await OfflineSyncEngine.enqueueOp('user_profiles', 'DELETE', {}, id);
    return true;
  }
}
