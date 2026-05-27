import { DBState, Product, Customer } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: 101, name: 'Hamburguesa Artesanal Lual', cost: 12000, price: 28000, stock: 45, min: 10, cat: 'Platos' },
  { id: 102, name: 'Pizza Pepperoni Premium', cost: 14000, price: 34000, stock: 30, min: 8, cat: 'Platos' },
  { id: 103, name: 'Corte Ribeye 400g', cost: 25000, price: 58000, stock: 15, min: 5, cat: 'Platos' },
  { id: 104, name: 'Alitas BBQ x12', cost: 10000, price: 24000, stock: 50, min: 10, cat: 'Entradas' },
  { id: 105, name: 'Nachos con Guacamole', cost: 7000, price: 18000, stock: 40, min: 5, cat: 'Entradas' },
  { id: 106, name: 'Cerveza Club Colombia', cost: 2200, price: 7000, stock: 120, min: 20, cat: 'Bebidas' },
  { id: 107, name: 'Coctel Margarita Especial', cost: 5000, price: 22000, stock: 60, min: 10, cat: 'Bebidas' },
  { id: 108, name: 'Limonada de Coco', cost: 3000, price: 9500, stock: 80, min: 15, cat: 'Bebidas' },
  { id: 109, name: 'Volcán de Chocolate', cost: 4500, price: 14000, stock: 25, min: 5, cat: 'Postres' },
  { id: 110, name: 'Cheesecake de Frutos Rojos', cost: 4000, price: 13500, stock: 18, min: 5, cat: 'Postres' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    nombre: 'Alejandro Sifra',
    nit: '1020304050',
    tel: '3157894512',
    mail: 'alejandrosifra@gmail.com',
    dir: 'Calle 85 # 12-45, Bogotá',
    cupo: 500000,
    deuda: 78000,
    status: 'Activo',
    obs: 'Cliente recurrente VIP. Autorizado para cuentas fiadas altas.',
    lastBuy: new Date(Date.now() - 3600000 * 4).toISOString(),
    fecha: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 2,
    nombre: 'Inversiones Sifras S.A.S.',
    nit: '901234567-3',
    tel: '6014561234',
    mail: 'facturacion@sifras.com',
    dir: 'Av. Chile # 7-22 Of. 501',
    cupo: 1500000,
    deuda: 240000,
    status: 'Activo',
    obs: 'Facturacón corporativa consolidada quincenal.',
    lastBuy: new Date(Date.now() - 3600000 * 24).toISOString(),
    fecha: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 3,
    nombre: 'Adriana Ortiz',
    nit: '52674991',
    tel: '3104567890',
    mail: 'adriana.ortiz@outlook.com',
    dir: 'Calle 100 # 19-80 Apt 304',
    cupo: 200000,
    deuda: 0,
    status: 'Activo',
    obs: 'Prefiere mesas de la barra o mesa 4.',
    lastBuy: null,
    fecha: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 4,
    nombre: 'Carlos Restrepo',
    nit: '71665443',
    tel: '3128904561',
    mail: 'carlosrestre@hotmail.com',
    cupo: 100000,
    deuda: 45000,
    status: 'Inactivo',
    obs: 'Mala conducta hace meses. Despachar solo efectivo.',
    lastBuy: null,
    fecha: new Date(Date.now() - 86400000 * 40).toISOString()
  }
];

export function getInitialState(): DBState {
  const now = new Date();
  const shiftStart = new Date(now.getTime() - 3600000 * 6); // Shift started 6 hours ago
  const shiftISO = shiftStart.toISOString();

  // Preset tables structure
  const tables: Record<string, any> = {};
  for (let i = 1; i <= 8; i++) {
    tables[`Mesa ${i}`] = { items: [], discount: 0, startTime: null };
  }
  for (let i = 1; i <= 4; i++) {
    tables[`Barra ${i}`] = { items: [], discount: 0, startTime: null };
  }

  // Pre-occupy a couple of tables so the POS looks alive!
  tables['Mesa 3'] = {
    items: [
      { id: 101, name: 'Hamburguesa Artesanal Lual', cost: 12000, price: 28000, qty: 2, note: 'Término medio, sin cebolla' },
      { id: 106, name: 'Cerveza Club Colombia', cost: 2200, price: 7000, qty: 3, note: 'Bien frías' }
    ],
    discount: 0,
    startTime: new Date(now.getTime() - 3600000 * 1.5).toISOString() // 1.5 hours ago
  };

  tables['Barra 2'] = {
    items: [
      { id: 107, name: 'Coctel Margarita Especial', cost: 5000, price: 22000, qty: 2, note: 'Escarchado con sal marina' },
      { id: 105, name: 'Nachos con Guacamole', cost: 7000, price: 18000, qty: 1, note: '' }
    ],
    discount: 10, // 10% discount on Barra 2
    startTime: new Date(now.getTime() - 1800000).toISOString() // 30 mins ago
  };

  // Preset sales to make dashboard charts/stats look awesome instantly
  const history = [
    {
      id: 'FAC-M7X2H1S-MESA5',
      timestamp: new Date(now.getTime() - 3600000 * 4).toISOString(),
      table: 'Mesa 5',
      total: 91500,
      tax: 6777,
      cost: 32500,
      profit: 52195,
      method: 'Efectivo',
      cliente: 'Venta Mostrador',
      items: [
        { name: 'Hamburguesa Artesanal Lual', qty: 2, price: 28000 },
        { name: 'Alitas BBQ x12', qty: 1, price: 24000 },
        { name: 'Limonada de Coco', qty: 1, price: 9500 }
      ]
    },
    {
      id: 'FAC-Y9Q3M9K-BARRA1',
      timestamp: new Date(now.getTime() - 3600000 * 3).toISOString(),
      table: 'Barra 1',
      total: 66000,
      tax: 4888,
      cost: 15600,
      profit: 45511,
      method: 'Tarjeta',
      cliente: 'Alejandro Sifra',
      items: [
        { name: 'Corte Ribeye 400g', qty: 1, price: 58000 },
        { name: 'Cerveza Club Colombia', qty: 2, price: 7000 }
      ]
    },
    {
      id: 'FAC-E2O9S3R-MESA2',
      timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
      table: 'Mesa 2',
      total: 102000,
      tax: 7555,
      cost: 41000,
      profit: 53416,
      method: 'Transf',
      cliente: 'Venta Mostrador',
      items: [
        { name: 'Pizza Pepperoni Premium', qty: 2, price: 34000 },
        { name: 'Nachos con Guacamole', qty: 1, price: 18000 },
        { name: 'Limonada de Coco', qty: 2, price: 9500 }
      ]
    },
    {
      id: 'FAC-Z5P1A4L-MESA1',
      timestamp: new Date(now.getTime() - 3600000 * 1).toISOString(),
      table: 'Mesa 1',
      total: 116000,
      tax: 8592,
      cost: 36000,
      profit: 71370,
      method: 'Credito',
      cliente: 'Inversiones Sifras S.A.S.',
      items: [
        { name: 'Corte Ribeye 400g', qty: 2, price: 58000 }
      ]
    }
  ];

  const expenses = [
    { id: 1, desc: 'Abono Base Caja Inicial', val: 150000, tipo: 'Entrada' as const, time: shiftISO },
    { id: 2, desc: 'Compra de 2 Litros de Leche para Postres', val: 9600, tipo: 'Salida' as const, time: new Date(now.getTime() - 3600000 * 4).toISOString() },
    { id: 3, desc: 'Propina Extra en Efectivo de Mesa 5', val: 15000, tipo: 'Entrada' as const, time: new Date(now.getTime() - 3600000 * 3).toISOString() }
  ];

  const abonos = [
    {
      id: 501,
      cliId: 1,
      cliName: 'Alejandro Sifra',
      val: 50000,
      fecha: new Date(now.getTime() - 3600000 * 2).toISOString(),
      obs: 'Abono en efectivo a cuenta pendiente'
    }
  ];

  return {
    settings: {
      isCashOpen: true,
      baseCash: 250000,
      shiftStart: shiftISO
    },
    products: INITIAL_PRODUCTS,
    history: history as any,
    shifts: [
      {
        end: new Date(now.getTime() - 86400000).toISOString(),
        total: 512000,
        cash: 340000,
        profit: 310500
      },
      {
        end: new Date(now.getTime() - 86400000 * 2).toISOString(),
        total: 489000,
        cash: 290000,
        profit: 294000
      }
    ],
    tables,
    expenses,
    clientes: INITIAL_CUSTOMERS,
    abonos
  };
}
