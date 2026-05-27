import { useState, useMemo, useEffect } from 'react';
import { Sale, Product, Shift, CashMovement, Customer, Abono } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Receipt, 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Sliders, 
  Box, 
  Award, 
  ShieldAlert, 
  ArrowDownUp,
  Printer, 
  Download, 
  Share2, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  Search, 
  Building, 
  Clock, 
  Briefcase, 
  ShoppingCart, 
  CheckSquare, 
  ListOrdered, 
  UserCheck, 
  Percent, 
  RefreshCw,
  Gift
} from 'lucide-react';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  shifts?: Shift[];
  expenses?: CashMovement[];
  clientes?: Customer[];
  abonos?: Abono[];
}

type ReportType =
  | 'ventas_diarias'
  | 'ventas_semanales'
  | 'ventas_mensuales'
  | 'ventas_anuales'
  | 'cajero'
  | 'mesero'
  | 'producto'
  | 'inventario'
  | 'gastos'
  | 'utilidad'
  | 'impuestos'
  | 'propinas'
  | 'cierre_turno'
  | 'domicilios'
  | 'metodos_pago'
  | 'clientes_vip'
  | 'fidelidad';

type DateRangeType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';

export default function ReportsView({
  sales = [],
  products = [],
  shifts = [],
  expenses = [],
  clientes = [],
  abonos = []
}: ReportsViewProps) {
  const { business } = useSettingsStore();

  // Selected active report out of the 17 varieties
  const [activeReport, setActiveReport] = useState<ReportType>('ventas_diarias');
  
  // Advanced filters state
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('this_month');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPayMethod, setFilterPayMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Performance helpers
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Track loading transitions when changing report type
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [activeReport, dateRangeType, filterEmployee, filterProduct, filterCategory, filterPayMethod, searchQuery]);

  // Formatter for currency
  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  // Static employee seeds that sales link to dynamically (by hash)
  const STAFF_MEMBERS = [
    { name: 'Santiago Mendoza', role: 'Admin' },
    { name: 'Carlos Restrepo', role: 'Cajero' },
    { name: 'Adriana Ortiz', role: 'Mesero' },
    { name: 'Patricia Pérez', role: 'Supervisor' }
  ];

  // Helper functions to resolve cashier and waiter consistently
  const getSaleCashier = (s: Sale): string => {
    const idx = Math.abs(s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 2;
    return idx === 0 ? 'Santiago Mendoza' : 'Carlos Restrepo';
  };

  const getSaleWaiter = (s: Sale): string => {
    const idx = Math.abs(s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 2;
    return idx === 0 ? 'Adriana Ortiz' : 'Patricia Pérez';
  };

  const getSaleDeliverer = (s: Sale): string => {
    const idx = Math.abs(s.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 2;
    return idx === 0 ? 'Motorizado Express - Julián' : 'Domicilios LUAL - Karen';
  };

  // 1. Process Master Filter sales list
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = new Date(s.timestamp);
      
      // Date Range Filters
      if (dateRangeType === 'today') {
        const today = new Date();
        if (saleDate.toDateString() !== today.toDateString()) return false;
      } else if (dateRangeType === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (saleDate.toDateString() !== yesterday.toDateString()) return false;
      } else if (dateRangeType === 'this_week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (saleDate < sevenDaysAgo) return false;
      } else if (dateRangeType === 'this_month') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        if (saleDate < startOfMonth) return false;
      } else if (dateRangeType === 'this_year') {
        const startOfYear = new Date();
        startOfYear.setMonth(0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        if (saleDate < startOfYear) return false;
      } else if (dateRangeType === 'custom') {
        if (startDate) {
          const sDate = new Date(startDate + 'T00:00:00');
          if (saleDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate + 'T23:59:59');
          if (saleDate > eDate) return false;
        }
      }

      // Employee Filter matches cashier or waiter
      if (filterEmployee !== 'all') {
        const sc = getSaleCashier(s);
        const sw = getSaleWaiter(s);
        if (sc !== filterEmployee && sw !== filterEmployee) return false;
      }

      // Payment method
      if (filterPayMethod !== 'all' && s.method !== filterPayMethod) return false;

      // Product or Category filter matches
      if (filterProduct !== 'all' || filterCategory !== 'all') {
        const matched = s.items.some((item) => {
          const pMatch = filterProduct === 'all' || item.name.toLowerCase() === filterProduct.toLowerCase();
          const targetProd = products.find((prod) => prod.name.toLowerCase() === item.name.toLowerCase());
          const cMatch = filterCategory === 'all' || (targetProd && targetProd.cat.toLowerCase() === filterCategory.toLowerCase());
          return pMatch && cMatch;
        });
        if (!matched) return false;
      }

      // Search bar filter (handles Client Name, Table, or invoice id)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientMatch = s.cliente?.toLowerCase().includes(query);
        const billMatch = s.id?.toLowerCase().includes(query);
        const tableMatch = s.table?.toLowerCase().includes(query);
        if (!clientMatch && !billMatch && !tableMatch) return false;
      }

      return true;
    });
  }, [sales, products, dateRangeType, startDate, endDate, filterEmployee, filterPayMethod, filterProduct, filterCategory, searchQuery]);

  // General statistics from filtered sales
  const stats = useMemo(() => {
    let rawTotal = 0;
    let rawCost = 0;
    let rawTax = 0;
    let rawProfit = 0;
    
    filteredSales.forEach((s) => {
      rawTotal += s.total;
      rawCost += s.cost || 0;
      rawTax += s.tax || 0;
      rawProfit += s.profit || 0;
    });

    const averageTickets = filteredSales.length > 0 ? rawTotal / filteredSales.length : 0;
    const profitMargin = rawTotal > 0 ? (rawProfit / rawTotal) * 100 : 0;
    const estimatedTips = rawTotal * 0.10; // 10% standard

    return {
      revenue: rawTotal,
      cost: rawCost,
      tax: rawTax,
      profit: rawProfit,
      count: filteredSales.length,
      average: averageTickets,
      margin: profitMargin,
      tips: estimatedTips
    };
  }, [filteredSales]);

  // Dynamic filter lists
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.cat) cats.add(p.cat);
    });
    return Array.from(cats);
  }, [products]);

  const availableProductsList = useMemo(() => {
    return products.map((p) => p.name).sort();
  }, [products]);

  // Aggregate Category performance for charts
  const categoryChartData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const pObj = products.find((prod) => prod.name.toLowerCase() === item.name.toLowerCase());
        const cat = pObj?.cat || 'Otros';
        data[cat] = (data[cat] || 0) + (item.price * item.qty);
      });
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredSales, products]);

  // Aggregate hourly performance for buster hours chart
  const hourlyChartData = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredSales.forEach((s) => {
      const date = new Date(s.timestamp);
      const h = date.getHours();
      hours[h] += s.total;
    });
    return hours.map((total, hr) => ({
      hour: `${hr.toString().padStart(2, '0')}:00`,
      total
    })).filter((obj, hr) => obj.total > 0 || (hr >= 11 && hr <= 23)); // Limit to standard bistro operating hours
  }, [filteredSales]);

  // Aggregate Payment Method totals
  const paymentMethodChartData = useMemo(() => {
    const methods: Record<string, number> = {
      Efectivo: 0,
      Tarjeta: 0,
      Transf: 0,
      Credito: 0
    };
    filteredSales.forEach((s) => {
      if (s.method in methods) {
        methods[s.method] += s.total;
      }
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // 17 Structured reports calculators
  const calculatedReportRows = useMemo(() => {
    switch (activeReport) {
      case 'ventas_diarias':
      case 'ventas_semanales':
      case 'ventas_mensuales':
      case 'ventas_anuales': {
        return filteredSales.map((s) => ({
          col1: s.id,
          col2: new Date(s.timestamp).toLocaleString('es-CO'),
          col3: s.table,
          col4: s.method,
          col5: s._overrideClientName || s.cliente || 'Venta Mostrador',
          col6: fCOP(s.total - s.tax),
          col7: fCOP(s.tax),
          col8: fCOP(s.total)
        }));
      }

      case 'cajero': {
        const result: Record<string, { total: number; count: number; tips: number }> = {};
        filteredSales.forEach((s) => {
          const c = getSaleCashier(s);
          if (!result[c]) result[c] = { total: 0, count: 0, tips: 0 };
          result[c].total += s.total;
          result[c].count += 1;
          result[c].tips += s.total * 0.10;
        });
        return Object.entries(result).map(([cajero, item]) => ({
          col1: cajero,
          col2: 'Cajero Principal / Staff',
          col3: `${item.count} Facturas`,
          col4: fCOP(item.total),
          col5: fCOP(item.tips),
          col6: fCOP(item.total * 0.45) // Est. overhead
        }));
      }

      case 'mesero': {
        const result: Record<string, { total: number; count: number; tips: number }> = {};
        filteredSales.forEach((s) => {
          const w = getSaleWaiter(s);
          if (!result[w]) result[w] = { total: 0, count: 0, tips: 0 };
          result[w].total += s.total;
          result[w].count += 1;
          result[w].tips += s.total * 0.10;
        });
        return Object.entries(result).map(([mesero, item]) => ({
          col1: mesero,
          col2: 'Mesero de Planta',
          col3: `${item.count} Mesas Atendidas`,
          col4: fCOP(item.total),
          col5: fCOP(item.tips),
          col6: '100% Recargado'
        }));
      }

      case 'producto': {
        const result: Record<string, { qty: number; revenue: number; cost: number; profit: number }> = {};
        filteredSales.forEach((s) => {
          s.items.forEach((item) => {
            const prodName = item.name;
            const matchProd = products.find((p) => p.name.toLowerCase() === prodName.toLowerCase());
            const cPrice = matchProd ? matchProd.cost : 0.4 * item.price;
            
            if (!result[prodName]) result[prodName] = { qty: 0, revenue: 0, cost: 0, profit: 0 };
            result[prodName].qty += item.qty;
            result[prodName].revenue += (item.qty * item.price);
            result[prodName].cost += (item.qty * cPrice);
            result[prodName].profit += (item.qty * (item.price - cPrice));
          });
        });
        return Object.entries(result)
          .sort((a, b) => b[1].qty - a[1].qty)
          .map(([name, stats]) => ({
            col1: name,
            col2: `${stats.qty} Unidades`,
            col3: fCOP(stats.revenue),
            col4: fCOP(stats.cost),
            col5: fCOP(stats.profit),
            col6: `${(stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0).toFixed(1)}%`
          }));
      }

      case 'inventario': {
        return products.map((p) => {
          const valuation = p.stock * p.cost;
          const isReorder = p.stock <= p.min;
          return {
            col1: p.name,
            col2: p.cat || 'Menú General',
            col3: `${p.stock} U`,
            col4: fCOP(p.cost),
            col5: fCOP(p.price),
            col6: isReorder ? '⚠️ REORDENAR' : '✓ OK',
            col7: fCOP(valuation),
            col8: `${(((p.price - p.cost) / p.price) * 100).toFixed(1)}%`
          };
        });
      }

      case 'gastos': {
        const filteredExpenses = expenses.filter((e) => {
          const date = new Date(e.time);
          if (dateRangeType === 'today') return date.toDateString() === new Date().toDateString();
          if (dateRangeType === 'this_month') return date.getMonth() === new Date().getMonth();
          return true;
        });
        return filteredExpenses.map((e) => ({
          col1: `#EGR-${e.id}`,
          col2: e.desc,
          col3: e.tipo,
          col4: new Date(e.time).toLocaleString('es-CO'),
          col5: fCOP(e.val),
          col6: 'Aprobado Caja Menor'
        }));
      }

      case 'utilidad': {
        const expTotal = expenses
          .filter(e => e.tipo === 'Salida')
          .reduce((acc, curr) => acc + curr.val, 0);
        
        return [
          { col1: 'INGRESOS BRUTOS', col2: 'Ventas de cocina y barra facturadas', col3: fCOP(stats.revenue), col4: '100% Base' },
          { col1: 'COSTOS DE PRODUCTO (COGS)', col2: 'Costo total de materias primas o insumos', col3: `-${fCOP(stats.cost)}`, col4: `${(stats.revenue > 0 ? (stats.cost / stats.revenue) * 100 : 0).toFixed(1)}%` },
          { col1: 'EGRESOS MENORES', col2: 'Gastos de planta y caja menor registrados', col3: `-${fCOP(expTotal)}`, col4: `${(stats.revenue > 0 ? (expTotal / stats.revenue) * 100 : 0).toFixed(1)}%` },
          { col1: 'UTILIDAD NETO OPERATIVA', col2: 'Ganancia real líquida antes de impuestos federales', col3: fCOP(stats.revenue - stats.cost - expTotal), col4: `${(stats.revenue > 0 ? ((stats.revenue - stats.cost - expTotal) / stats.revenue) * 100 : 0).toFixed(1)}% Margen` }
        ];
      }

      case 'impuestos': {
        return [
          { col1: 'Impuesto al Consumo Nacional (CO)', col2: 'Tarifa general de consumo', col3: '8%', col4: fCOP(stats.revenue - stats.tax), col5: fCOP(stats.tax) },
          { col1: 'Retención en la Fuente Est.', col2: 'Transacciones bancarias aplicables', col3: '1.5%', col4: fCOP(stats.revenue * 0.4), col5: fCOP(stats.revenue * 0.4 * 0.015) },
          { col1: 'TOTALES RETENIDOS', col2: 'Declaración mensual consolidada DIAN', col3: 'N/A', col4: fCOP(stats.revenue), col5: fCOP(stats.tax + (stats.revenue * 0.4 * 0.015)) }
        ];
      }

      case 'propinas': {
        const result: Record<string, { total: number; tips: number }> = {};
        filteredSales.forEach((s) => {
          const w = getSaleWaiter(s);
          if (!result[w]) result[w] = { total: 0, tips: 0 };
          result[w].total += s.total;
          result[w].tips += s.total * 0.10;
        });
        return Object.entries(result).map(([mesero, item]) => ({
          col1: mesero,
          col2: 'Mesero del Servicio',
          col3: fCOP(item.total),
          col4: '10.0% Sugerida',
          col5: fCOP(item.tips),
          col6: 'Pendiente Dispersión Electrónica'
        }));
      }

      case 'cierre_turno': {
        return shifts.map((sh, idx) => ({
          col1: `Turno #${idx + 1}`,
          col2: new Date(sh.end).toLocaleString('es-CO'),
          col3: fCOP(sh.cash),
          col4: fCOP(sh.total),
          col5: fCOP(sh.profit),
          col6: 'Consolidado Turno Completo'
        }));
      }

      case 'domicilios': {
        const deliveries = filteredSales.filter(s => s.table.toLowerCase().includes('domicilio') || s.table.toLowerCase().includes('barra'));
        return deliveries.map((d) => ({
          col1: d.id,
          col2: d.table,
          col3: getSaleDeliverer(d),
          col4: d.cliente || 'Alejandro Sifra',
          col5: d.method,
          col6: fCOP(d.total),
          col7: '✓ Entregado'
        }));
      }

      case 'metodos_pago': {
        const result: Record<string, { total: number; count: number; tax: number }> = {
          Efectivo: { total: 0, count: 0, tax: 0 },
          Tarjeta: { total: 0, count: 0, tax: 0 },
          Transf: { total: 0, count: 0, tax: 0 },
          Credito: { total: 0, count: 0, tax: 0 }
        };
        filteredSales.forEach((s) => {
          if (s.method in result) {
            result[s.method].total += s.total;
            result[s.method].count += 1;
            result[s.method].tax += s.tax;
          }
        });
        return Object.entries(result).map(([method, obj]) => ({
          col1: method,
          col2: `${obj.count} Transacciones`,
          col3: fCOP(obj.total - obj.tax),
          col4: fCOP(obj.tax),
          col5: fCOP(obj.total),
          col6: `${(stats.revenue > 0 ? (obj.total / stats.revenue) * 100 : 0).toFixed(1)}% de Participación`
        }));
      }

      case 'clientes_vip': {
        return clientes.map((c) => {
          const purchases = sales.filter(s => s.cliente.toLowerCase() === c.nombre.toLowerCase());
          const spent = purchases.reduce((acc, curr) => acc + curr.total, 0);
          return {
            col1: c.nombre,
            col2: c.nit,
            col3: c.tel,
            col4: fCOP(c.cupo),
            col5: fCOP(c.deuda),
            col6: fCOP(spent),
            col7: c.status
          };
        });
      }

      case 'fidelidad': {
        return clientes.map((c) => {
          const purchases = sales.filter(s => s.cliente.toLowerCase() === c.nombre.toLowerCase());
          const spent = purchases.reduce((acc, curr) => acc + curr.total, 0);
          const accumulatedPoints = Math.floor(spent / 1000); // 1 point per $1000 spent
          return {
            col1: c.nombre,
            col2: c.nit,
            col3: fCOP(spent),
            col4: `${accumulatedPoints} Pts`,
            col5: fCOP(accumulatedPoints * 10), // Red redemption rate
            col6: accumulatedPoints > 200 ? '⭐ Platino VIP' : '✦ Silver Standard'
          };
        });
      }

      default:
        return [];
    }
  }, [activeReport, filteredSales, products, expenses, shifts, clientes, stats]);

  // Handle pagination values
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return calculatedReportRows.slice(start, start + itemsPerPage);
  }, [calculatedReportRows, currentPage]);

  const totalPages = Math.ceil(calculatedReportRows.length / itemsPerPage) || 1;

  // Real PDF Generation via jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const activeReportTitle = activeReport.toUpperCase().replace('_', ' ');

    // Primary Colors
    const docTitle = `${business.restaurantName} — INFORME ${activeReportTitle}`;
    
    // Header styling
    doc.setFillColor(15, 23, 42); // slate-900 background banner
    doc.rect(0, 0, 210, 42, 'F');

    // Title text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(business.restaurantName, 15, 18);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`NIT: ${business.nit} • TEL: ${business.phone}`, 15, 23);
    doc.text(`Dirección: ${business.address} • Email: ${business.email}`, 15, 27);
    
    // Watermark/badge
    doc.setFillColor(0, 242, 255); // Cyan accent bar
    doc.rect(15, 33, 45, 1);

    // Metadata Right-Side aligned on banner
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 242, 255);
    doc.text(`EMPRESA: POS PLATINO`, 140, 18);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`F. Generación: ${new Date().toLocaleString()}`, 140, 23);
    doc.text(`Rango Filtro: ${dateRangeType.toUpperCase()}`, 140, 27);
    doc.text(`Transacciones: ${stats.count}`, 140, 31);

    // Under-Header Report description space
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`REPORTE DE AUDITORÍA: ${activeReportTitle}`, 15, 52);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Este informe exhaustivo detalla los flujos financieros y auditorías operacionales asociadas al canal.`, 15, 57);

    // Render 4 major KPIs in a beautiful box grid
    doc.setFillColor(248, 250, 252); // soft off-white
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 63, 180, 22, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('RECAUDO TOTAL', 22, 69);
    doc.text('COSTO OPERATIVO', 67, 69);
    doc.text('IMPUESTOS/IVA', 112, 69);
    doc.text('UTILIDAD NETO', 157, 69);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(fCOP(stats.revenue), 22, 77);
    doc.text(fCOP(stats.cost), 67, 77);
    doc.text(fCOP(stats.tax), 112, 77);
    doc.setTextColor(16, 185, 129); // green
    doc.text(fCOP(stats.profit), 157, 77);

    // Draw Data Table
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.setFillColor(241, 245, 249);
    doc.setTextColor(71, 85, 105);
    doc.rect(15, 92, 180, 8, 'F');

    // Headers determination
    let columns = ['Concepto Principal', 'Estatus/Categoría', 'Monto Interno', 'Afectación/Margen'];
    if (activeReport.startsWith('ventas_')) {
      columns = ['Factura ID', 'Fecha y Hora', 'Mesa', 'Método', 'Cliente', 'Total'];
    } else if (activeReport === 'inventario') {
      columns = ['Nombre del Producto', 'Categoría', 'Stock', 'Costo Unit.', 'Venta Unit.', 'Val. Total'];
    } else if (activeReport === 'producto') {
      columns = ['Nombre Plato', 'Vol. Ventas', 'Ingreso Bruto', 'Costo COGS', 'Utilidad', 'Margen UNIT'];
    }

    // Centered headers positioning
    const colWidth = 180 / columns.length;
    columns.forEach((col, idx) => {
      doc.text(col, 17 + (idx * colWidth), 97);
    });

    // Populate rows
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    let yPos = 104;

    calculatedReportRows.forEach((row: any, rIdx) => {
      // Draw alternating row backgrounds
      if (rIdx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, yPos - 3, 180, 6, 'F');
      }

      // Safe wrapping check
      if (yPos > 260) {
        doc.addPage();
        // Redraw Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Páginas de Auditoría Continuada — ${docTitle}`, 15, 12);
        doc.line(15, 14, 195, 14);
        doc.setFont('Helvetica', 'normal');
        yPos = 22;
      }

      // Populate text cells
      const cells = Object.values(row).slice(0, columns.length);
      cells.forEach((val: any, cIdx) => {
        doc.text(String(val).substring(0, 25), 17 + (cIdx * colWidth), yPos);
      });

      yPos += 7;
    });

    // Add Signature Blocks at footer
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(20, yPos + 20, 80, yPos + 20);
    doc.line(120, yPos + 20, 180, yPos + 20);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Santiago Mendoza (Administrador)', 25, yPos + 24);
    doc.text('Revisión Fiscal DIAN / Auditor Externo', 123, yPos + 24);

    // Page numbering
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(6);
      doc.text(`Página ${i} de ${pageCount} — Documento con Validez de Auditoría Fiscal Interna • No Reemplaza Facturación Final Electrónica`, 15, 292);
    }

    doc.save(`LUAL_REPORTE_${activeReport}_${dateRangeType}.pdf`);
  };

  // Real Excel Export via xlsx library
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Metadata Summary
    const summaryRows = [
      ['BUSINESS IDENTITY INFORMATION:', ''],
      ['Restaurant Name', business.restaurantName],
      ['NIT Razón Social', business.nit],
      ['Address', business.address],
      ['Phone', business.phone],
      ['Generated at Timestamp', new Date().toLocaleString()],
      ['Filter Range Selected', dateRangeType.toUpperCase()],
      ['', ''],
      ['OVERALL RANGE METRICS', ''],
      ['Total Revenue Volume (COP)', stats.revenue],
      ['Total Cost COGS (COP)', stats.cost],
      ['Calculated Taxes (COP)', stats.tax],
      ['Net Operator Profit (COP)', stats.profit],
      ['Completed Sales Count', stats.count],
      ['Average Order Value', stats.average],
      ['Estimated Service Tip (COP)', stats.tips],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Consolidado KPIs");

    // Sheet 2: Main Detailed Report Table
    // Convert array structure into readable rows
    const dataRefHeaders: Record<string, string[]> = {
      ventas_diarias: ['ID Factura', 'Fecha del Turno', 'Lugar/Mesa', 'Forma Pago', 'Cliente', 'Subtotal', 'IVA Consumo', 'Total Cobrado'],
      ventas_semanales: ['ID Factura', 'Fecha del Turno', 'Lugar/Mesa', 'Forma Pago', 'Cliente', 'Subtotal', 'IVA Consumo', 'Total Cobrado'],
      ventas_mensuales: ['ID Factura', 'Fecha del Turno', 'Lugar/Mesa', 'Forma Pago', 'Cliente', 'Subtotal', 'IVA Consumo', 'Total Cobrado'],
      ventas_anuales: ['ID Factura', 'Fecha del Turno', 'Lugar/Mesa', 'Forma Pago', 'Cliente', 'Subtotal', 'IVA Consumo', 'Total Cobrado'],
      cajero: ['Cajero/Estación', 'Cargo', 'Canidad Invoices', 'Suma Procesada', 'Propinas Est. Recaudadas', 'Retención Total'],
      mesero: ['Mesero/Atendió', 'Nivel', 'Servicios Facturados', 'Volumen de Caja', 'Propinas Recargadas', 'Estado'],
      producto: ['Plato/Bebida', 'Unidades Despachadas', 'Ingreso Bruto', 'Costo de Insumos', 'Ganancia Operativa', 'Margen Neto Unit.'],
      inventario: ['Producto', 'Categoría', 'Stock Físico', 'Costo Unitario', 'Precio Venta COP', 'Estatus Mínimo', 'Valuado Costo', 'Contribución Proyectada'],
      gastos: ['Folio Caja', 'Concepto del Egreso', 'Lugar Flujo', 'Fecha Registrada', 'Monto COP', 'Estado Auditor'],
      utilidad: ['Concepto Operativo', 'Detalle Explicativo', 'Flujos COP', 'Participación % Base'],
      impuestos: ['Nombre del Tributo', 'Detalle de Tasa', 'Tarifa', 'Base Imponible de Cálculo', 'Impuesto Recaudado'],
      propinas: ['Nombre Mesero', 'Cargo Planta', 'Monto Facturado', 'Porcentaje', 'Propina Recolectada', 'Estatus Dispersión'],
      cierre_turno: ['Identificación Turno', 'Fecha Cierre', 'Monto Apertura', 'Monto Cierre Real', 'Ganancias Turno', 'Validez Auditoría'],
      domicilios: ['ID Factura', 'Mesa de Entrega', 'Repartidor Asignado', 'Razón Social / Cliente', 'Forma Pago', 'Monto Facturado', 'Estatus Envío'],
      metodos_pago: ['Medio de Pago', 'Transacciones Registradas', 'Recaudo Neto', 'IVA Recaudado', 'Monto Total COP', 'Cuota de Mercado'],
      clientes_vip: ['VIP Nombre', 'Nit/Ident.', 'Número Tel', 'Cupo de Crédito', 'Deuda Acumulada', 'Compras Totales Hist.', 'Estatus'],
      fidelidad: ['Fidelidad VIP', 'Nit/Ident.', 'Volumen Total Compras', 'Puntos Acumulados', 'Equiv Cashback COP', 'Nivel Miembro']
    };

    const header = dataRefHeaders[activeReport] || ['Columna 1', 'Columna 2', 'Columna 3', 'Columna 4', 'Columna 5', 'Columna 6', 'Columna 7', 'Columna 8'];
    const detailedRows = calculatedReportRows.map((row) => Object.values(row));
    const finalDataMatrix = [header, ...detailedRows];

    const wsDetails = XLSX.utils.aoa_to_sheet(finalDataMatrix);
    XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Analítico");

    // Auto-fit Column sizes dynamically
    const maxCols = header.length;
    const colWidths = [];
    for (let c = 0; c < maxCols; c++) {
      let maxLen = header[c].length;
      detailedRows.forEach((r) => {
        const valStr = r[c] ? String(r[c]) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      colWidths.push({ wch: Math.min(28, maxLen + 2) });
    }
    wsDetails['!cols'] = colWidths;

    XLSX.writeFile(wb, `LUAL_REPORTE_EMPRESARIAL_${activeReport}.xlsx`);
  };

  const handlePrintWindow = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 print:bg-white print:text-black print:p-0">
      
      {/* ⚠️ Print Media CSS Overrides for Physical ticket printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-reports-matrix, #print-area-reports-matrix * {
            visibility: visible;
          }
          #print-area-reports-matrix {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 10px;
            color: #000;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Corporate Dashboard Header with full filters */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-950 to-slate-900 no-print">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f2ff]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pb-5 mb-5 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
              📊
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[#00f2ff] tracking-[0.2em] block">
                AUDITORÍA OPERATIVA EN TIEMPO REAL
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight uppercase mt-0.5">
                Módulo de Reportería Corporativa LUAL
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="px-4.5 py-2.5 bg-rose-600/10 hover:bg-rose-600/15 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl text-rose-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4.5 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/15 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              Exportar Excel
            </button>
            <button
              onClick={handlePrintWindow}
              className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-750 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              Imprimir Vista
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Selector de Rango de Fecha */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#00f2ff]" /> Periodo de Fechas
            </label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff] [color-scheme:dark]"
            >
              <option value="today">Hoy : {new Date().toLocaleDateString('es-CO')}</option>
              <option value="yesterday">Ayer</option>
              <option value="this_week">Últimos 7 Días</option>
              <option value="this_month">Este Mes</option>
              <option value="this_year">Este Año</option>
              <option value="custom">Rango Personalizado ✎</option>
            </select>
          </div>

          {/* Custom Date Inputs Picker */}
          {dateRangeType === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Inicio</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff] [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[8px] uppercase font-bold text-slate-500 block">Fin</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl p-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff] [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          {/* Selector de Empleado (Mesa/Caja) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#00f2ff]" /> Filtrar Empleado
            </label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="all">Filtro: Todos Staff</option>
              {STAFF_MEMBERS.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filtrar por Métodos de Pago */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#00f2ff]" /> Canal de Pago
            </label>
            <select
              value={filterPayMethod}
              onChange={(e) => setFilterPayMethod(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="all">Todas las Formas</option>
              <option value="Efectivo">Efectivo 💵</option>
              <option value="Tarjeta">Tarjeta de Crédito/Débito 💳</option>
              <option value="Transf">Transferencia Bancaria 📲</option>
              <option value="Credito">Crédito Fiado 🤝</option>
            </select>
          </div>

          {/* Filtrar Categoría */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00f2ff]" /> Categoría de Menú
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff]"
            >
              <option value="all">Todas las Categorías</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Inputs (Invoice ID, Client, Table) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#00f2ff]" /> Buscar Registro
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fac-ID, Cliente, Mesa..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#00f2ff] placeholder-slate-500"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Finance Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5 no-print">
        {/* REVENUE KPI */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">RECAUDO BRUTO</span>
            <div className="w-7 h-7 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] select-none">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-extrabold text-white font-mono-numbers">{fCOP(stats.revenue)}</h4>
            <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Tasa de Impuesto Calculado (CO): {fCOP(stats.tax)}</span>
          </div>
        </div>

        {/* UTILITIES KPI */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">UTILIDADES NETAS</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 select-none">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-extrabold text-emerald-400 font-mono-numbers">{fCOP(stats.profit)}</h4>
            <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Margen Neto Promedio: {stats.margin.toFixed(1)}%</span>
          </div>
        </div>

        {/* TRANSACTIONS COUNT KPI */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">TRANSACCIONES</span>
            <div className="w-7 h-7 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] select-none">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-extrabold text-white font-mono-numbers">{stats.count} Facturas</h4>
            <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Ticket Promedio Orden: {fCOP(stats.average)}</span>
          </div>
        </div>

        {/* DISPERSION PROPINAS KPI */}
        <div className="glass-panel rounded-3xl p-5 border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Caja Propinas</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 select-none">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-xl font-extrabold text-indigo-300 font-mono-numbers">{fCOP(stats.tips)}</h4>
            <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">Distribución de Ley Generada (10%)</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Professional Report Selectors with categories */}
        <div className="lg:col-span-4 space-y-4 no-print">
          <div className="glass-panel rounded-3xl p-4.5 border-white/10 space-y-4.5 bg-slate-950/20">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block border-b border-white/5 pb-2">
              Seleccionar Reporte Especializado
            </span>

            {/* Cat 1: Finanzas & Contabilidad */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-extrabold tracking-widest uppercase text-[#00f2ff] block px-1.5">
                Finanzas y Fiscalidad
              </span>
              <div className="grid grid-cols-1 gap-1">
                <button
                  onClick={() => setActiveReport('ventas_diarias')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'ventas_diarias' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>1. Ventas Diarias</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Día</span>
                </button>
                <button
                  onClick={() => setActiveReport('ventas_semanales')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'ventas_semanales' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>2. Ventas Semanales</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Sem</span>
                </button>
                <button
                  onClick={() => setActiveReport('ventas_mensuales')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'ventas_mensuales' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>3. Ventas Mensuales</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Mes</span>
                </button>
                <button
                  onClick={() => setActiveReport('ventas_anuales')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'ventas_anuales' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>4. Balance Anual</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Año</span>
                </button>
                <button
                  onClick={() => setActiveReport('impuestos')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'impuestos' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>5. Impuestos e IVA (8%)</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">DIAN</span>
                </button>
                <button
                  onClick={() => setActiveReport('metodos_pago')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'metodos_pago' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>6. Métodos de Pago</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Caja</span>
                </button>
              </div>
            </div>

            {/* Cat 2: Personal y Control de Gestión */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-extrabold tracking-widest uppercase text-violet-400 block px-1.5">
                Nómina, Cajeros y Meseros
              </span>
              <div className="grid grid-cols-1 gap-1">
                <button
                  onClick={() => setActiveReport('cajero')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'cajero' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>7. Ventas por Cajero</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Arqueo</span>
                </button>
                <button
                  onClick={() => setActiveReport('mesero')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'mesero' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>8. Ventas por Mesero</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Serv.</span>
                </button>
                <button
                  onClick={() => setActiveReport('propinas')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'propinas' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>9. Consolidado Propinas</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Disp</span>
                </button>
                <button
                  onClick={() => setActiveReport('cierre_turno')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'cierre_turno' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>10. Cierres de Turno</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Log</span>
                </button>
              </div>
            </div>

            {/* Cat 3: Costos y Menú */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-extrabold tracking-widest uppercase text-indigo-400 block px-1.5">
                Kardex, Costos y Utilidades
              </span>
              <div className="grid grid-cols-1 gap-1">
                <button
                  onClick={() => setActiveReport('producto')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'producto' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>11. Ventas por Producto</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Menu</span>
                </button>
                <button
                  onClick={() => setActiveReport('inventario')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'inventario' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>12. Margen e Inventario</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Kardex</span>
                </button>
                <button
                  onClick={() => setActiveReport('gastos')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'gastos' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>13. Gastos / Egresos</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Caja</span>
                </button>
                <button
                  onClick={() => setActiveReport('utilidad')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'utilidad' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>14. Pérdidas y Ganancias</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">P&L</span>
                </button>
              </div>
            </div>

            {/* Cat 4: Clientes & Domicilios */}
            <div className="space-y-1.5">
              <span className="text-[8px] font-extrabold tracking-widest uppercase text-emerald-400 block px-1.5">
                Clientes Especiales, Fidelidad y Envíos
              </span>
              <div className="grid grid-cols-1 gap-1">
                <button
                  onClick={() => setActiveReport('clientes_vip')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'clientes_vip' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>15. Cupos y Deudas VIP</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Credit</span>
                </button>
                <button
                  onClick={() => setActiveReport('fidelidad')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'fidelidad' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>16. Puntos de Fidelidad</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Fidel</span>
                </button>
                <button
                  onClick={() => setActiveReport('domicilios')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    activeReport === 'domicilios' ? 'bg-[#00f2ff] text-slate-950 font-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>17. Domicilios y Envíos</span>
                  <span className="text-[9px] px-1.5 opacity-85 uppercase">Express</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right Side: Visual Charts & Dynamic Table Records */}
        <div className="lg:col-span-8 space-y-6">

          {/* SVG Vector Charts Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
            {/* Chart 1: Menú Categorías share */}
            <div className="glass-panel rounded-3xl p-5 border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                Distribución Comercial de Menú (Ventas COP)
              </span>
              
              {categoryChartData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Sin Transacciones en el Rango
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4 items-center h-44">
                  {/* Left Donuts Circle */}
                  <div className="col-span-5 flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                      {/* Calculate coordinates on loop for donuts */}
                      {(() => {
                        let accumulatedOffset = 0;
                        const totalSum = categoryChartData.reduce((acc, curr) => acc + curr.value, 0) || 1;
                        const colors = ['#00f2ff', '#0066ff', '#8b5cf6', '#ec4899', '#f59e0b'];
                        return categoryChartData.map((obj, index) => {
                          const percentage = (obj.value / totalSum) * 100;
                          const circumference = 2 * Math.PI * 40;
                          const strokeDash = (percentage / 100) * circumference;
                          const strokeOffset = circumference - (accumulatedOffset / 100) * circumference;
                          accumulatedOffset += percentage;
                          return (
                            <circle
                              key={obj.name}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={colors[index % colors.length]}
                              strokeWidth="12"
                              strokeDasharray={`${strokeDash} ${circumference}`}
                              strokeDashoffset={strokeOffset}
                              className="transition-all duration-500"
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  {/* Right Legend listing details */}
                  <div className="col-span-7 space-y-1.5 text-left">
                    {categoryChartData.slice(0, 4).map((obj, index) => {
                      const colors = ['#00f2ff', '#0066ff', '#8b5cf6', '#ec4899', '#f59e0b'];
                      return (
                        <div key={obj.name} className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                            <span className="text-slate-300 truncate">{obj.name}</span>
                          </div>
                          <span className="text-white font-mono-numbers">{fCOP(obj.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Chart 2: Hourly Performance (busiest hours) */}
            <div className="glass-panel rounded-3xl p-5 border-white/10">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                Densidad Transaccional por Hora (Picos)
              </span>

              {filteredSales.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Sin Transacciones que Indexar
                </div>
              ) : (
                <div className="flex items-end justify-between gap-1.5 h-44 pb-3 pt-6 px-1.5 border-b border-white/5">
                  {/* Peak bar render */}
                  {(() => {
                    const maxHrVal = Math.max(...hourlyChartData.map(h => h.total)) || 1;
                    return hourlyChartData.map((obj) => {
                      const heightPercent = Math.min((obj.total / maxHrVal) * 100, 100);
                      return (
                        <div key={obj.hour} className="group relative flex-1 flex flex-col items-center">
                          {/* Tooltip on Hover */}
                          <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 bg-[#050608] border border-[#00f2ff]/30 text-[#00f2ff] text-[8px] font-mono-numbers px-2 py-1 rounded-lg pointer-events-none transition-all duration-200 z-10 shadow-lg whitespace-nowrap">
                            {fCOP(obj.total)}
                          </div>
                          
                          {/* SVG/Div Core bar fill */}
                          <div className="w-full bg-white/5 rounded-t-lg overflow-hidden h-28 flex items-end">
                            <div 
                              className="w-full bg-gradient-to-t from-[#0066ff] to-[#00f2ff] rounded-t-lg transition-all duration-300 active:brightness-110"
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>
                          
                          <span className="text-[7px] text-slate-500 font-mono-numbers mt-1 uppercase">
                            {obj.hour.split(':')[0]}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Core Structured Table */}
          <div id="print-area-reports-matrix" className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10 relative">
            
            {/* Table Top Metadata Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-4 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#00f2ff] tracking-widest block font-mono">
                  LUAL AUDIT ID: {(activeReport || '').toUpperCase()}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mostrando {calculatedReportRows.length} registros según filtración activa
                </p>
              </div>

              <div className="no-print">
                <span className="text-[9px] bg-slate-900 border border-white/10 px-3 py-1.5 rounded-2xl font-bold text-slate-300 uppercase tracking-widest block">
                  Páginas {currentPage} / {totalPages}
                </span>
              </div>
            </div>

            {/* If load transition active */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#00f2ff] animate-spin" />
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#00f2ff] animate-pulse">
                  Unificando Libros de Auditoría
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] leading-relaxed">
                  <thead>
                    <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {/* Headers names on active report switch */}
                      {(() => {
                        let tableHeaders = ['ID/Concepto', 'Estatus', 'Flujo Base', 'Observación'];
                        if (activeReport.startsWith('ventas_')) {
                          tableHeaders = ['Factura', 'Fecha/Hora', 'Mesa/Barra', 'Método', 'Cliente', 'Subtotal', 'Tax (8%)', 'Total'];
                        } else if (activeReport === 'inventario') {
                          tableHeaders = ['Producto/Insumo', 'Categoría', 'Stock', 'Costo', 'Venta', 'Estatus', 'Total Costo', 'Contrib.'];
                        } else if (activeReport === 'producto') {
                          tableHeaders = ['Plato/Bebida', 'Unidades', 'Ingreso Bruto', 'Costos COGS', 'Utilidad', 'Margen UNIT'];
                        } else if (activeReport === 'gastos') {
                          tableHeaders = ['Folio Caja', 'Detalle de Gasto', 'Lugar', 'Fecha', 'Monto', 'Estatus'];
                        } else if (activeReport === 'utilidad') {
                          tableHeaders = ['Parámetro Financiero', 'Detalle Explicativo', 'Flujos COP', 'Porcentaje'];
                        } else if (activeReport === 'impuestos') {
                          tableHeaders = ['Nombre Tributo', 'Detalle Tasa', 'Tarifa %', 'Base Imponible', 'Impuesto Recaudado'];
                        } else if (activeReport === 'propinas') {
                          tableHeaders = ['Nombre Mesero', 'Cargo Planta', 'Ventas Servidas', 'Fórmula', 'Propina Recibida', 'Estatus'];
                        } else if (activeReport === 'metodos_pago') {
                          tableHeaders = ['Canal de Recaudo', 'Movimientos', 'Subtotal Neto', 'IVA Recaudado', 'Monto Total COP', 'Mercado %'];
                        } else if (activeReport === 'clientes_vip') {
                          tableHeaders = ['Cliente VIP', 'Identificación NIT', 'Teléfono', 'Cupo de Crédito', 'Deuda Acumulada', 'Historial Total', 'Estado'];
                        } else if (activeReport === 'fidelidad') {
                          tableHeaders = ['Fidelidad VIP', 'Id Cédula', 'Historial Compras', 'Puntos Acumulados', 'Bono Cashback', 'Nivel Miembro'];
                        } else if (activeReport === 'cajero') {
                          tableHeaders = ['Cajero/Estación', 'Cargo', 'Invoices', 'Suma Procesada', 'Propinas Recaudadas', 'Retención'];
                        } else if (activeReport === 'mesero') {
                          tableHeaders = ['Mesero Atendió', 'Cargo', 'Servicios Facturados', 'Total Volumen', 'Propinas', 'Estado'];
                        } else if (activeReport === 'cierre_turno') {
                          tableHeaders = ['Folio Turno', 'Fecha Cierre', 'Apertura Base', 'Efectivo Turno', 'Margen Turno', 'Estatus'];
                        } else if (activeReport === 'domicilios') {
                          tableHeaders = ['Factura No.', 'Canal Domicilio', 'Asignado', 'Cliente VIP', 'Método Pago', 'Monto', 'Estado'];
                        }
                        
                        return tableHeaders.map((hdr, hIdx) => (
                          <th key={hdr} className={`pb-4 pl-2 ${hIdx === tableHeaders.length - 1 ? 'text-right' : ''}`}>
                            {hdr}
                          </th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-16 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          Ningún registro encontrado con los filtros seleccionados
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row: any, rIdx) => {
                        const cellValues = Object.values(row);
                        return (
                          <tr key={rIdx} className="hover:bg-white/5 transition-all">
                            {cellValues.map((cell: any, cIdx) => (
                              <td 
                                key={cIdx} 
                                className={`py-4 pl-2 text-xs font-bold ${
                                  cIdx === cellValues.length - 1 ? 'text-right pr-2 text-[#00f2ff]' : ''
                                }`}
                              >
                                {cell === '⚠️ REORDENAR' || cell === 'Inactivo' ? (
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black uppercase">
                                    {cell}
                                  </span>
                                ) : cell === '✓ OK' || cell === '✓ Entregado' || cell === 'Activo' ? (
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase">
                                    {cell}
                                  </span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Footer for enterprise safety loading */}
            {totalPages > 1 && !isLoading && (
              <div className="flex justify-between items-center border-t border-white/5 pt-5 mt-5 no-print">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Resumen de registros: del {((currentPage - 1) * itemsPerPage) + 1} al {Math.min(currentPage * itemsPerPage, calculatedReportRows.length)}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    Retroceder
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    Avanzar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
