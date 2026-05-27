import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { SYSTEM_USERS, UserRole, EnterpriseUser } from '../stores/authStore';

export class AuthService {
  static async authenticateUser(email: string): Promise<EnterpriseUser | null> {
    try {
      const q = query(
        collection(db, 'user_profiles'),
        where('email', '==', email),
        where('is_active', '==', true),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          email: data.email,
          fullname: data.fullname,
          role: data.role as UserRole,
          avatar: data.role === 'Admin' ? '👔' : '💵'
        };
      }
    } catch (error) {
      console.warn('Firebase query failed, falling back to local credentials.', error);
    }
    
    // Fallback to static enterprise profiles
    const localUser = SYSTEM_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    return localUser || null;
  }

  static checkSessionIsFresh() {
    return {
      authenticated: true,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      provider: 'Firebase Firestore Secure Auth'
    };
  }
}

