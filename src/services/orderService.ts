import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Sale, TableState, CartItem } from '../types';
import { OfflineSyncEngine } from './dbQueue';

export class OrderService {
  static async syncSaleToCloud(sale: Sale): Promise<boolean> {
    const payload = {
      id: sale.id,
      table_id: sale.table || '',
      subtotal_amount: sale.total - sale.tax,
      tax_amount: sale.tax,
      discount_amount: 0.00,
      tip_amount: 0.00,
      total_amount: sale.total,
      total_cost_amount: sale.cost,
      net_profit_amount: sale.profit,
      payment_method_selected: sale.method,
      created_at: sale.timestamp
    };

    // Sync main order securely matching state queue
    await OfflineSyncEngine.enqueueOp('orders', 'CREATE', payload, sale.id);

    // Save order items inside flat/nested elements or individual collections
    for (let i = 0; i < sale.items.length; i++) {
      const item = sale.items[i];
      const itemPayload = {
        order_id: sale.id,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price
      };
      await OfflineSyncEngine.enqueueOp('order_items', 'CREATE', itemPayload, `${sale.id}_item_${i}`);
    }

    return true;
  }

  static async syncTableStatus(tableId: string, status: 'Libre' | 'Ocupada' | 'Cuenta_Lista', waiterId?: string): Promise<boolean> {
    const payload = {
      id: tableId,
      status: status,
      order_started_at: status !== 'Libre' ? new Date().toISOString() : ''
    };
    await OfflineSyncEngine.enqueueOp('restaurant_tables', 'CREATE', payload, tableId);
    return true;
  }
}

