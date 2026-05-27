import { useState, useMemo } from 'react';
import { Sale, Product } from '../types';
import { BarChart3, TrendingUp, DollarSign, Calendar, Sliders, Box, Award, ShieldAlert, ArrowDownUp } from 'lucide-react';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
}

type PeriodType = 'diario' | 'semanal' | 'mensual';

export default function ReportsView({ sales, products }: ReportsViewProps) {
  const [period, setPeriod] = useState<PeriodType>('diario');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const filteredSales = useMemo(() => {
    if (!selectedDate) return [];
    
    const baseDate = new Date(selectedDate + 'T00:00:00');
    
    return sales.filter((s) => {
      const saleDate = new Date(s.timestamp);
      
      switch (period) {
        case 'diario': {
          return (
            saleDate.getFullYear() === baseDate.getFullYear() &&
            saleDate.getMonth() === baseDate.getMonth() &&
            saleDate.getDate() === baseDate.getDate()
          );
        }
        case 'semanal': {
          // Calculate start of week (Sunday or Monday, let's say 7 days back from baseDate inclusive)
          const startOfWeek = new Date(baseDate);
          startOfWeek.setDate(baseDate.getDate() - 6);
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(baseDate);
          endOfWeek.setHours(23, 59, 59, 999);
          
          return saleDate >= startOfWeek && saleDate <= endOfWeek;
        }
        case 'mensual': {
          return (
            saleDate.getFullYear() === baseDate.getFullYear() &&
            saleDate.getMonth() === baseDate.getMonth()
          );
        }
        default:
          return false;
      }
    });
  }, [sales, period, selectedDate]);

  // Calculations for the selected period
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let transactionsCount = filteredSales.length;

    filteredSales.forEach((s) => {
      totalRevenue += s.total;
      totalCost += s.cost || 0;
    });

    const totalProfit = totalRevenue - totalCost;
    const avgTicket = transactionsCount > 0 ? totalRevenue / transactionsCount : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      transactionsCount,
      avgTicket,
      profitMargin,
    };
  }, [filteredSales]);

  // Top Selling Products Calculations
  const topProducts = useMemo(() => {
    const counts: Record<string, { qty: number; revenue: number; cost: number; profit: number }> = {};

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prodName = item.name;
        const matchingProduct = products.find((p) => p.name.toLowerCase() === prodName.toLowerCase());
        const costPerUnit = matchingProduct ? matchingProduct.cost : 0.4 * item.price; // fallback to 40% cost if match fails

        const itemQty = item.qty || 0;
        const itemRevenue = (item.price || 0) * itemQty;
        const itemCost = costPerUnit * itemQty;
        const itemProfit = itemRevenue - itemCost;

        if (!counts[prodName]) {
          counts[prodName] = { qty: 0, revenue: 0, cost: 0, profit: 0 };
        }
        counts[prodName].qty += itemQty;
        counts[prodName].revenue += itemRevenue;
        counts[prodName].cost += itemCost;
        counts[prodName].profit += itemProfit;
      });
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        qty: data.qty,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.profit,
      }))
      .sort((a, b) => b.qty - a.qty);
  }, [filteredSales, products]);

  // Generate some helper UI indicators for trend
  const periodText = period === 'diario' ? 'Día seleccionado' : period === 'semanal' ? 'Últimos 7 días' : 'Mes seleccionado';

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top filter Controls */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          {/* Period Selector Tabs */}
          <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex gap-1 items-center h-12">
            <button
              onClick={() => setPeriod('diario')}
              className={`px-4.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none ${
                period === 'diario'
                  ? 'bg-[#00f2ff] text-[#050608] font-bold accent-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Diario
            </button>
            <button
              onClick={() => setPeriod('semanal')}
              className={`px-4.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none ${
                period === 'semanal'
                  ? 'bg-[#00f2ff] text-[#050608] font-bold accent-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setPeriod('mensual')}
              className={`px-4.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all outline-none ${
                period === 'mensual'
                  ? 'bg-[#00f2ff] text-[#050608] font-bold accent-glow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Date Selector Input */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1.5 h-12">
            <Calendar className="text-slate-400 w-4.5 h-4.5 flex-shrink-0" />
            <input
              type="date"
              className="bg-transparent text-white text-xs font-bold outline-none border-0 p-0 h-full w-36 focus:ring-0 cursor-pointer [color-scheme:dark]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-[#00f2ff]/10 text-[#00f2ff] px-3 py-1.5 rounded-xl border border-[#00f2ff]/20 font-black uppercase tracking-widest">
            {periodText}
          </span>
        </div>
      </div>

      {/* Primary Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Sales Summary */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#00f2ff]/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Ventas Totales</span>
            <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/15 flex items-center justify-center text-[#00f2ff] accent-glow">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white mt-4 font-mono-numbers">{fCOP(stats.totalRevenue)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide font-bold opacity-75">
            {stats.transactionsCount} Transacciones completadas
          </p>
        </div>

        {/* Total Profits Summary */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-emerald-400/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Ganancias Generadas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-emerald-400 mt-4 font-mono-numbers">{fCOP(stats.totalProfit)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide font-bold opacity-75">
            Margen Prometido: {stats.profitMargin.toFixed(1)}% Neto
          </p>
        </div>

        {/* Cost and Basket averages */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#00f2ff]/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Ticket Promedio / Costos</span>
            <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/15 flex items-center justify-center text-[#00f2ff]">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white mt-4 font-mono-numbers">{fCOP(stats.avgTicket)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide font-bold opacity-75">
            Costos Totales en Insumos: {fCOP(stats.totalCost)}
          </p>
        </div>
      </div>

      {/* Secondary layout splits: left charts & right top list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* left progress block: Visual report breakdown */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sliders className="text-[#00f2ff] w-4.5 h-4.5" />
                Desempeño del Menú por Categorías
              </h3>
            </div>
            
            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-semibold text-xs uppercase tracking-wide">
                Sin datos de ventas para este periodo
              </div>
            ) : (
              <div className="space-y-5">
                {topProducts.slice(0, 6).map((tp, i) => {
                  const maxQty = topProducts[0]?.qty || 1;
                  const ratio = Math.min((tp.qty / maxQty) * 100, 100);
                  return (
                    <div key={tp.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white hover:text-[#00f2ff] transition-all truncate max-w-[180px]">
                          {i + 1}. {tp.name}
                        </span>
                        <span className="text-[#00f2ff] font-mono-numbers">{tp.qty} Unidades ({fCOP(tp.revenue)})</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-[#00f2ff] to-[#0066ff] h-full rounded-full transition-all duration-500"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
            <span className="text-slate-400 uppercase font-bold tracking-widest text-[9px]">Análisis de Retorno en Tiempo Real</span>
            <div className="flex gap-4 font-mono-numbers">
              <div className="text-center">
                <span className="text-slate-500 text-[10px] block">VENTAS</span>
                <span className="text-white font-black">{fCOP(stats.totalRevenue)}</span>
              </div>
              <div className="border-r border-white/10 my-1" />
              <div className="text-center">
                <span className="text-slate-500 text-[10px] block">UTILIDAD</span>
                <span className="text-emerald-400 font-black">{fCOP(stats.totalProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right list: Products ranked */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-white/10">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Award className="text-[#00f2ff] w-4.5 h-4.5 accent-glow" />
              Platos Más Vendidos
            </h3>
            <span className="text-[9px] bg-[#00f2ff]/10 text-[#00f2ff] px-2 py-0.5 rounded border border-[#00f2ff]/20 font-bold uppercase tracking-widest">
              Top List
            </span>
          </div>

          <div className="space-y-3.5 pr-1 max-h-[340px] overflow-y-auto scrollbar-hide">
            {topProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 font-semibold text-xs uppercase tracking-wider">
                No se registran ventas
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div 
                  key={p.name}
                  className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#00f2ff]/25 transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black font-mono-numbers text-[#00f2ff] border border-white/5 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-extrabold text-white block uppercase tracking-wide truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono-numbers mt-0.5 block">{p.qty} UNIDADES VENDIDAS</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono-numbers font-extrabold text-[#00f2ff] block">{fCOP(p.revenue)}</span>
                    <span className="text-[9px] font-mono-numbers text-emerald-400 mt-0.5 block">+{fCOP(p.profit)} ganancia</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Complete Historical Products Matrix table */}
      <div className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#00f2ff]">
            Matriz de Ventas del Periodo ({period.toUpperCase()})
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Consolidado General</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-4">Producto/Plato</th>
                <th className="pb-4 text-center">Unidades Vendidas</th>
                <th className="pb-4">Ingreso Bruto</th>
                <th className="pb-4">Costo de Ventas (COGS)</th>
                <th className="pb-4">Utilidad Neta</th>
                <th className="pb-4 text-right">Margen Neto Unitario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Ninguna transacción disponible para indexar.
                  </td>
                </tr>
              ) : (
                topProducts.map((p) => {
                  const productMargin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                  return (
                    <tr key={p.name} className="hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wide block">{p.name}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-xs font-mono-numbers font-black bg-white/5 border border-white/5 text-white px-3 py-1.5 rounded-xl uppercase tracking-wider">
                          {p.qty} U
                        </span>
                      </td>
                      <td className="py-4 text-xs font-mono-numbers font-medium text-slate-300">
                        {fCOP(p.revenue)}
                      </td>
                      <td className="py-4 text-xs font-mono-numbers text-slate-400">
                        {fCOP(p.cost)}
                      </td>
                      <td className="py-4 text-xs font-mono-numbers font-extrabold text-[#00f2ff]">
                        {fCOP(p.profit)}
                      </td>
                      <td className="py-4 text-right">
                        <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                          productMargin < 40 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30'
                        }`}>
                          {productMargin.toFixed(1)}% Margen
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
