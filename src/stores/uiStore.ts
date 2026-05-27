import { create } from 'zustand';
import { TabType } from '../types';

interface ToastItem {
  id: number;
  msg: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface UIState {
  activeTab: TabType;
  soundEnabled: boolean;
  toasts: ToastItem[];
  
  // Modals
  showOpenCashModal: boolean;
  showClientModal: boolean;
  showAbonoModal: boolean;
  showAccountStatementModal: boolean;
  showCheckoutModal: boolean;

  setActiveTab: (tab: TabType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  addToast: (msg: string, type?: ToastItem['type']) => void;
  removeToast: (id: number) => void;
  
  setShowOpenCashModal: (show: boolean) => void;
  setShowClientModal: (show: boolean) => void;
  setShowAbonoModal: (show: boolean) => void;
  setShowAccountStatementModal: (show: boolean) => void;
  setShowCheckoutModal: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dash',
  soundEnabled: true,
  toasts: [],
  
  showOpenCashModal: false,
  showClientModal: false,
  showAbonoModal: false,
  showAccountStatementModal: false,
  showCheckoutModal: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  
  addToast: (msg, type = 'info') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, msg, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 3200);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  setShowOpenCashModal: (show) => set({ showOpenCashModal: show }),
  setShowClientModal: (show) => set({ showClientModal: show }),
  setShowAbonoModal: (show) => set({ showAbonoModal: show }),
  setShowAccountStatementModal: (show) => set({ showAccountStatementModal: show }),
  setShowCheckoutModal: (show) => set({ showCheckoutModal: show })
}));
