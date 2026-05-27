export interface Product {
  id: number;
  name: string;
  cost: number;
  price: number;
  stock: number;
  min: number;
  cat: string;
}

export interface CartItem {
  id: number;
  name: string;
  cost: number;
  price: number;
  qty: number;
  note: string;
}

export interface TableState {
  items: CartItem[];
  discount: number;
  startTime: string | null;
}

export interface Customer {
  id: number;
  nombre: string;
  nit: string;
  tel: string;
  mail?: string;
  dir?: string;
  cupo: number;
  deuda: number;
  status: 'Activo' | 'Inactivo';
  obs?: string;
  lastBuy?: string | null;
  fecha: string;
}

export interface SaleItem {
  name: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  table: string;
  total: number;
  tax: number;
  cost: number;
  profit: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transf' | 'Credito';
  cliente: string;
  items: SaleItem[];
}

export interface CashMovement {
  id: number;
  desc: string;
  val: number;
  tipo: 'Entrada' | 'Salida';
  time: string;
}

export interface Shift {
  end: string;
  total: number;
  cash: number;
  profit: number;
}

export interface Settings {
  isCashOpen: boolean;
  baseCash: number;
  shiftStart: string | null;
}

export interface DBState {
  settings: Settings;
  products: Product[];
  history: Sale[];
  shifts: Shift[];
  tables: Record<string, TableState>;
  expenses: CashMovement[];
  clientes: Customer[];
  abonos: Abono[];
}

export interface Abono {
  id: number;
  cliId: number;
  cliName: string;
  val: number;
  fecha: string;
  obs: string;
}

export type TabType = 'dash' | 'pos' | 'clientes' | 'inventory' | 'history' | 'audit' | 'reports' | 'settings';
