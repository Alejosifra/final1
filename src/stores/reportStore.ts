import { create } from 'zustand';

interface ReportStoreState {
  reportsTimeframe: 'TODAY' | 'MONTH' | 'ALL';
  selectedProductFilter: string;

  setReportsTimeframe: (time: 'TODAY' | 'MONTH' | 'ALL') => void;
  setSelectedProductFilter: (prod: string) => void;
}

export const useReportStore = create<ReportStoreState>((set) => ({
  reportsTimeframe: 'ALL',
  selectedProductFilter: 'TODOS',

  setReportsTimeframe: (time) => set({ reportsTimeframe: time }),
  setSelectedProductFilter: (prod) => set({ selectedProductFilter: prod })
}));
