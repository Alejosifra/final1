import { create } from 'zustand';
import { TableState, CartItem } from '../types';

interface POSState {
  activeId: string | null;
  checkoutPayMethod: 'Efectivo' | 'Tarjeta' | 'Transf' | 'Credito';
  checkoutCreditCliId: number | null;
  checkoutCashReceived: string;
  checkoutChange: number;

  setActiveId: (id: string | null) => void;
  setCheckoutPayMethod: (method: 'Efectivo' | 'Tarjeta' | 'Transf' | 'Credito') => void;
  setCheckoutCreditCliId: (id: number | null) => void;
  setCheckoutCashReceived: (val: string) => void;
  setCheckoutChange: (change: number) => void;
  resetCheckoutState: () => void;
}

export const usePOSStore = create<POSState>((set) => ({
  activeId: null,
  checkoutPayMethod: 'Efectivo',
  checkoutCreditCliId: null,
  checkoutCashReceived: '',
  checkoutChange: 0,

  setActiveId: (id) => set({ activeId: id }),
  setCheckoutPayMethod: (method) => set({ checkoutPayMethod: method }),
  setCheckoutCreditCliId: (id) => set({ checkoutCreditCliId: id }),
  setCheckoutCashReceived: (val) => set({ checkoutCashReceived: val }),
  setCheckoutChange: (change) => set({ checkoutChange: change }),
  
  resetCheckoutState: () => set({
    checkoutPayMethod: 'Efectivo',
    checkoutCreditCliId: null,
    checkoutCashReceived: '',
    checkoutChange: 0
  })
}));
