import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Product } from '../types';
import { OfflineSyncEngine } from './dbQueue';

export class InventoryService {
  /**
   * Prevents sales of unavailable inventory pieces.
   */
  static validateStockAvailability(p: Product, requestedQty: number): { state: boolean; message?: string } {
    if (p.stock < requestedQty) {
      return {
        state: false,
        message: `¡Stock insuficiente para ${p.name}! Disponible actual: ${p.stock} unidades, intentaste añadir ${requestedQty}.`
      };
    }
    return { state: true };
  }

  static async logKardexMovement(prodId: number, delta: number, type: string, justification: string, userId?: string) {
    const payload = {
      product_id: prodId,
      quantity_delta: delta,
      movement_type: type,
      justification: justification || '',
      user_id: userId || ''
    };

    await OfflineSyncEngine.enqueueOp('inventory_movements', 'ADD', payload);
  }

  static getStockStatusTag(stock: number, minStock: number): { label: string; color: string } {
    if (stock <= 0) return { label: 'Agotado (0)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25' };
    if (stock <= minStock) return { label: 'Bajo Mínimo', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25' };
    return { label: 'Disponible', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' };
  }
}

