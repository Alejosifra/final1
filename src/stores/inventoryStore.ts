import { create } from 'zustand';
import { Product } from '../types';

interface InventoryStoreState {
  searchTerm: string;
  selectedCategory: string;
  lowStockOnly: boolean;

  setSearchTerm: (term: string) => void;
  setSelectedCategory: (cat: string) => void;
  setLowStockOnly: (toggle: boolean) => void;
  
  getLowStockAlerts: (products: Product[]) => Product[];
}

export const useInventoryStore = create<InventoryStoreState>((set) => ({
  searchTerm: '',
  selectedCategory: 'TODOS',
  lowStockOnly: false,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setLowStockOnly: (toggle) => set({ lowStockOnly: toggle }),

  getLowStockAlerts: (products) => {
    return products.filter((p) => p.stock <= p.min);
  }
}));
