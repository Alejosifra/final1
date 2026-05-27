import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Customer } from '../types';
import { OfflineSyncEngine } from './dbQueue';

export class ClientService {
  static async validateCreditLimit(client: Customer, requestedCreditAmount: number): Promise<{ allowed: boolean; reason?: string }> {
    const totalPotentialDebt = client.deuda + requestedCreditAmount;
    if (totalPotentialDebt > client.cupo) {
      return {
        allowed: false,
        reason: `Excede el cupo asignado. Límite de crédito: $${client.cupo.toLocaleString('es-CO')}. Deuda actual: $${client.deuda.toLocaleString('es-CO')}.`
      };
    }
    return { allowed: true };
  }

  static async syncCustomerToCloud(c: Customer): Promise<boolean> {
    const payload = {
      id: c.id,
      nit_cc: c.nit,
      fullname: c.nombre,
      telephone: c.tel || '',
      email: c.mail || '',
      address: c.dir || '',
      credit_limit: c.cupo,
      current_debt: c.deuda,
      notes: c.obs || ''
    };

    // Queue for reliable transaction delivery
    await OfflineSyncEngine.enqueueOp('clients', 'CREATE', payload, String(c.id));
    return true;
  }
}

