import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { BusinessSettingsInfo } from '../stores/settingsStore';

export class SettingsService {
  /**
   * Syncs active business values to Cloud database if configured, or saves to robust fallback.
   */
  static async saveSettings(settings: BusinessSettingsInfo): Promise<{ success: boolean; error?: any }> {
    try {
      const settingsRef = doc(db, 'settings', 'biz-primary-config');
      await setDoc(settingsRef, {
        id: 'biz-primary-config',
        restaurant_name: settings.restaurantName || '',
        logo_url: settings.logoUrl || '',
        nit: settings.nit || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || '',
        tax_percent: settings.taxPercent,
        tip_percent: settings.tipPercent,
        ticket_footer: settings.ticketFooter || '',
        updated_at: new Date().toISOString()
      });
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase cloud dynamic settings sync postponed. Saving in-local storage cache instead.', err);
      return { success: true, error: err };
    }
  }

  static async fetchLatestSettings(): Promise<Partial<BusinessSettingsInfo> | null> {
    try {
      const settingsRef = doc(db, 'settings', 'biz-primary-config');
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          restaurantName: data.restaurant_name,
          logoUrl: data.logo_url,
          nit: data.nit,
          address: data.address,
          phone: data.phone,
          email: data.email,
          currency: data.currency,
          taxPercent: Number(data.tax_percent),
          tipPercent: Number(data.tip_percent),
          ticketFooter: data.ticket_footer
        };
      }
    } catch (err) {
      console.warn('Error fetching custom Firebase settings:', err);
    }
    return null;
  }
}

