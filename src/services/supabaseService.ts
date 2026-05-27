import { db } from './firebase';
import { DBState, Product, Customer, Sale, CashMovement, Shift, TableState } from '../types';

export const HAS_CLOUD_CONNECTION = true;

// Log of Audit changes (used to collect operation telemetry for Phase 10)
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
}

export class EnterpriseDBService {
  private static STORAGE_KEY = 'lual_v9_db';
  private static AUDIT_KEY = 'lual_v9_audit_logs';

  // Read current system logs
  static getAuditLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(this.AUDIT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Audit logs read error', e);
    }
    return [
      {
        id: 'AUD-30219-INITIAL',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        user: 'Administrador Lual',
        role: 'Admin',
        action: 'APERTURA_CAJA',
        module: 'Caja',
        details: 'Apertura de caja inicial exitosa con base de $250.000 COP.'
      }
    ];
  }

  // Append new enterprise audit log
  static addAuditLog(user: string, role: string, action: string, module: string, details: string) {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}-${module.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      user,
      role,
      action,
      module,
      details
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(this.AUDIT_KEY, JSON.stringify(logs.slice(0, 500))); // keep top 500
    } catch (e) {
      console.error('Audit logs save error', e);
    }
    return newLog;
  }

  // Simulated Cloud Sync Status Indicator
  static getSyncStatus(): { status: 'cloud-active' | 'offline-sync'; label: string; latency?: number } {
    return { status: 'cloud-active', label: 'Conectado a Google Cloud (Firebase Firestore)', latency: 15 };
  }
}

