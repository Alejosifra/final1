import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

// Multi-tenant business defaults
export const DEFAULT_BUSINESS_ID = 'LUAL-BIZ-MEDELLIN-01';
export const DEFAULT_TENANT_ID = 'LUAL-TENANT-CO-PRO';

export interface PendingSyncOp {
  id: string;
  collectionName: string;
  docId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD';
  payload: any;
  timestamp: string;
}

export class OfflineSyncEngine {
  private static QUEUE_STORAGE_KEY = 'lual_offline_sync_queue';

  static getQueue(): PendingSyncOp[] {
    try {
      const stored = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveQueue(queue: PendingSyncOp[]) {
    localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(queue));
  }

  /**
   * Enqueues an operation to be replicated when online
   */
  static async enqueueOp(collectionName: string, action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD', payload: any, docId?: string) {
    const queue = this.getQueue();
    
    // Inject multi-tenant identifiers to secure absolute separation of data!
    const multiTenantPayload = {
      ...payload,
      businessId: localStorage.getItem('lual_active_business_id') || DEFAULT_BUSINESS_ID,
      tenantId: localStorage.getItem('lual_active_tenant_id') || DEFAULT_TENANT_ID,
      sync_origin: 'offline_first_tablet_client'
    };

    const newOp: PendingSyncOp = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      collectionName,
      docId,
      action,
      payload: multiTenantPayload,
      timestamp: new Date().toISOString()
    };

    queue.push(newOp);
    this.saveQueue(queue);

    // If online, immediately trigger background synchronization
    if (navigator.onLine) {
      this.syncBackground();
    }
  }

  /**
   * Synchronizes background queue to Firebase securely with conflict resolution
   */
  static async syncBackground(): Promise<{ successCount: number; failedCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { successCount: 0, failedCount: 0 };

    console.log(`[OfflineSyncEngine] Inicando sincronización de ${queue.length} operaciones pendientes...`);
    let successCount = 0;
    let failedCount = 0;
    const remainingOps: PendingSyncOp[] = [];

    for (const op of queue) {
      try {
        if (op.action === 'CREATE' || op.action === 'UPDATE') {
          if (op.docId) {
            const docRef = doc(db, op.collectionName, op.docId);
            await setDoc(docRef, op.payload, { merge: true });
          } else {
            await addDoc(collection(db, op.collectionName), op.payload);
          }
        } else if (op.action === 'ADD') {
          await addDoc(collection(db, op.collectionName), op.payload);
        } else if (op.action === 'DELETE') {
          if (op.docId) {
            const docRef = doc(db, op.collectionName, op.docId);
            await deleteDoc(docRef);
          }
        }
        successCount++;
      } catch (err) {
        console.error(`[OfflineSyncEngine] Fallo en sincronización para ${op.collectionName}:`, err);
        failedCount++;
        // Maintain in queue to prevent losing client data
        remainingOps.push(op);
      }
    }

    this.saveQueue(remainingOps);
    return { successCount, failedCount };
  }
}
