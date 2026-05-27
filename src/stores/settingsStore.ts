import { create } from 'zustand';

export interface BusinessSettingsInfo {
  restaurantName: string;
  logoUrl: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxPercent: number;
  tipPercent: number;
  ticketFooter: string;
}

export interface PrinterConfig {
  ip: string;
  port: number;
  kitchenPrinterIp: string;
  barPrinterIp: string;
  ticketSize: '58mm' | '80mm';
  autoPrintReceipts: boolean;
}

interface SettingsStoreState {
  business: BusinessSettingsInfo;
  printer: PrinterConfig;
  updateBusiness: (updates: Partial<BusinessSettingsInfo>) => void;
  updatePrinter: (updates: Partial<PrinterConfig>) => void;
  loadFromLocal: () => void;
}

const DEFAULT_BUSINESS: BusinessSettingsInfo = {
  restaurantName: 'LUAL GASTRO BAR',
  logoUrl: '🍽️',
  nit: '901.342.887-5',
  address: 'Calle 10a #9-44, Medellín, CO',
  phone: '+57 (315) 880-9944',
  email: 'contacto@lualgastro.com',
  currency: 'COP',
  taxPercent: 8, // 8% de Impuesto al Consumo nacional
  tipPercent: 10, // Propina sugerida estándar
  ticketFooter: '¡Gracias por visitarnos! Factura de Venta POS de Régimen Común. Desarrollado por LUAL Gastro Enterprise.'
};

const DEFAULT_PRINTER: PrinterConfig = {
  ip: '192.168.1.99',
  port: 9100,
  kitchenPrinterIp: '192.168.1.101',
  barPrinterIp: '192.168.1.102',
  ticketSize: '80mm',
  autoPrintReceipts: true
};

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  business: DEFAULT_BUSINESS,
  printer: DEFAULT_PRINTER,

  updateBusiness: (updates) => set((state) => {
    const updated = { ...state.business, ...updates };
    localStorage.setItem('lual_business_settings', JSON.stringify(updated));
    return { business: updated };
  }),

  updatePrinter: (updates) => set((state) => {
    const updated = { ...state.printer, ...updates };
    localStorage.setItem('lual_printer_settings', JSON.stringify(updated));
    return { printer: updated };
  }),

  loadFromLocal: () => {
    try {
      const storedBiz = localStorage.getItem('lual_business_settings');
      const storedPrn = localStorage.getItem('lual_printer_settings');
      if (storedBiz) set({ business: JSON.parse(storedBiz) });
      if (storedPrn) set({ printer: JSON.parse(storedPrn) });
    } catch (e) {
      console.error('Failed to parse cached configuration items:', e);
    }
  }
}));
