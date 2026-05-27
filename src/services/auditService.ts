import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { EnterpriseDBService, AuditLog } from './supabaseService';
import { OfflineSyncEngine } from './dbQueue';

export class AuditService {
  /**
   * Logs a critical administrative POS action.
   */
  static async logAdminAction(
    operatorName: string,
    operatorRole: string,
    action: string,
    module: string,
    details: string
  ): Promise<AuditLog> {
    
    // Save to LocalStorage audit log first for offline resiliency
    const savedLog = EnterpriseDBService.addAuditLog(operatorName, operatorRole, action, module, details);

    // Enqueue for secure multi-tenant synchronisation
    const payload = {
      action_type: action,
      module: module,
      action_details: {
        details,
        roleCountCheck: operatorRole,
        timestamp_client: new Date().toISOString()
      }
    };

    await OfflineSyncEngine.enqueueOp('audit_logs', 'ADD', payload);

    return savedLog;
  }
}

