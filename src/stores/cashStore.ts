import { create } from 'zustand';
import { CashMovement } from '../types';

interface CashStoreState {
  baseCashInput: string;
  pettyExpenseDesc: string;
  pettyExpenseAmount: string;
  pettyExpenseType: 'Entrada' | 'Salida';

  setBaseCashInput: (val: string) => void;
  setPettyExpenseDesc: (desc: string) => void;
  setPettyExpenseAmount: (amount: string) => void;
  setPettyExpenseType: (type: 'Entrada' | 'Salida') => void;
  resetPettyFields: () => void;
}

export const useCashStore = create<CashStoreState>((set) => ({
  baseCashInput: '250000',
  pettyExpenseDesc: '',
  pettyExpenseAmount: '',
  pettyExpenseType: 'Salida',

  setBaseCashInput: (val) => set({ baseCashInput: val }),
  setPettyExpenseDesc: (desc) => set({ pettyExpenseDesc: desc }),
  setPettyExpenseAmount: (amount) => set({ pettyExpenseAmount: amount }),
  setPettyExpenseType: (type) => set({ pettyExpenseType: type }),
  resetPettyFields: () => set({ pettyExpenseDesc: '', pettyExpenseAmount: '', pettyExpenseType: 'Salida' })
}));
