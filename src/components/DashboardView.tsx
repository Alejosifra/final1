import { Sale, CashMovement } from '../types';
import { TrendingUp, Coins, Users, CheckCircle, ArrowUpRight, ArrowDownRight, Wallet, Receipt } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

interface DashboardViewProps {
  sales: Sale[];
  baseCash: number;
  expenses: CashMovement[];
  clientes: { nombre: string; deuda: number; status: string }[];
  abonos: { fecha: string; val: number }[];
  shiftStart: string | null;
}

export default function DashboardView({
  sales,
  baseCash,
  expenses,
  clientes,
  abonos,
  shiftStart,
}: DashboardViewProps) {
  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const activeShiftSales = sales.filter((s) => !shiftStart || s.timestamp >= shiftStart);
  const totalSales = activeShiftSales.reduce((sum, s) => sum + s.total, 0);

  const activeShiftExpenses = expenses.filter((e) => !shiftStart || e.time >= shiftStart);
  const entries = activeShiftExpenses.filter((e) => e.tipo === 'Entrada').reduce((sum, e) => sum + e.val, 0);
  const exits = activeShiftExpenses.filter((e) => e.tipo === 'Salida').reduce((sum, e) => sum + e.val, 0);

  const activeShiftAbonos = abonos.filter((a) => !shiftStart || a.fecha >= shiftStart);
  const abonosShiftTotal = activeShiftAbonos.reduce((sum, a) => sum + a.val, 0);

  const totalCartera = clientes.reduce((sum, c) => sum + c.deuda, 0);
  const activeCreditsCount = clientes.filter((c) => c.deuda > 0).length;

  const totalProfit = activeShiftSales.reduce((sum, s) => sum + s.profit, 0) - exits;

  // Calculate Cash total in drawer
  const cashSales = activeShiftSales.filter((s) => s.method === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
  const drawerCash = baseCash + cashSales + entries + abonosShiftTotal - exits;

  // Breakdown by payment method
  const methodsSummary = {
    Efectivo: 0,
    Tarjeta: 0,
    Transf: 0,
    Credito: 0,
  };
  activeShiftSales.forEach((s) => {
    if (s.method in methodsSummary) {
      methodsSummary[s.method as keyof typeof methodsSummary] += s.total;
    }
  });

  const { business } = useSettingsStore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Brand Identity Banner */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-950 to-slate-900 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner overflow-hidden flex-shrink-0">
            {business.logoUrl && (business.logoUrl.startsWith('http') || business.logoUrl.startsWith('data:image')) ? (
              <img 
                src={business.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain p-1.5"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{business.logoUrl || '🍽️'}</span>
            )}
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black text-white tracking-wide uppercase">
              {business.restaurantName || 'LUAL GASTRO BAR'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-extrabold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse" />
              Panel de Control e Inteligencia Operativa • NIT: {business.nit || '901.342.887-5'}
            </p>
          </div>
        </div>
        <div className="text-right flex flex-col items-center sm:items-end">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ubicación</span>
          <p className="text-xs font-semibold text-slate-300 mt-1 uppercase">{business.address || 'Calle 10a #9-44, Medellín, CO'}</p>
        </div>
      </div>

      {/* Prime Stats Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#00f2ff]/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Ingresos Shift</span>
            <TrendingUp className="text-[#00f2ff] w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-3xl font-black text-white mt-4 font-mono-numbers">{fCOP(totalSales)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold opacity-75">Ventas en jornada actual</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#00f2ff]/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Cartera Total</span>
            <Coins className="text-rose-400 w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-3xl font-black text-rose-400 mt-4 font-mono-numbers">{fCOP(totalCartera)}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold opacity-75">Suma de saldos por cobrar</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-[#00f2ff]/40">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Clientes Fiados</span>
            <Users className="text-[#00f2ff] w-5 h-5 opacity-80" />
          </div>
          <h3 className="text-3xl font-black text-white mt-4 font-mono-numbers">{activeCreditsCount}</h3>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold opacity-75">Clientes con deuda activa</p>
        </div>

        <div className="btn-active rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-[#00f2ff]/20 transition-all duration-300 hover:scale-[1.01] accent-glow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black tracking-wider uppercase text-[#050608]/70">Retorno Neto</span>
            <CheckCircle className="text-[#050608] w-5 h-5 opacity-90" />
          </div>
          <h3 className="text-3xl font-black text-[#050608] mt-4 font-mono-numbers">{fCOP(totalProfit)}</h3>
          <p className="text-[10px] text-[#050608]/80 mt-2 uppercase tracking-widest font-extrabold text-[9px]">Utilidad menú - salidas</p>
        </div>
      </div>

      {/* Cash Register Flow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-emerald-950/20 border border-emerald-500/15 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Entradas Caja</span>
            <ArrowUpRight className="text-emerald-400 w-5 h-5" />
          </div>
          <h4 className="text-2xl font-black text-emerald-300 mt-3 font-mono-numbers">{fCOP(entries)}</h4>
        </div>

        <div className="bg-rose-950/20 border border-rose-500/15 rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">Salidas Caja</span>
            <ArrowDownRight className="text-rose-400 w-5 h-5" />
          </div>
          <h4 className="text-2xl font-black text-rose-300 mt-3 font-mono-numbers">{fCOP(exits)}</h4>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Abonos Recibidos</span>
            <Wallet className="text-slate-300 w-5 h-5" />
          </div>
          <h4 className="text-2xl font-black text-white mt-3 font-mono-numbers">{fCOP(abonosShiftTotal)}</h4>
        </div>

        <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/20 rounded-3xl p-6 flex flex-col justify-between accent-glow">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-extrabold text-[#00f2ff] uppercase tracking-widest">Efectivo en Caja</span>
            <Coins className="text-[#00f2ff] w-5 h-5" />
          </div>
          <h4 className="text-2xl font-black text-[#00f2ff] mt-3 font-mono-numbers">{fCOP(drawerCash)}</h4>
        </div>
      </div>

      {/* Detailed overview rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Receipt className="text-[#00f2ff] w-5 h-5" />
              Últimas Transacciones
            </h3>
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Jornada actual</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 text-slate-500">Hora</th>
                  <th className="pb-3 text-slate-500">Puesto</th>
                  <th className="pb-3 text-slate-500">Beneficiario/Cliente</th>
                  <th className="pb-3 text-slate-500">Total</th>
                  <th className="pb-3 text-center text-slate-500">Pago</th>
                </tr>
              </thead>
              <tbody>
                {activeShiftSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                      No se han realizado ventas en este turno.
                    </td>
                  </tr>
                ) : (
                  activeShiftSales.slice(0, 6).map((s) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                      <td className="py-4 text-xs font-mono-numbers text-slate-400">
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 text-xs font-bold text-white">{s.table}</td>
                      <td className="py-4 text-xs text-slate-300">{s.cliente}</td>
                      <td className="py-4 text-xs font-mono-numbers font-extrabold text-white">{fCOP(s.total)}</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase border ${
                          s.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' :
                          s.method === 'Tarjeta' ? 'bg-sky-500/10 text-sky-400 border-sky-500/10' :
                          s.method === 'Transf' ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/10'
                        }`}>
                          {s.method}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Media Recaudo Side Block */}
        <div className="glass-panel rounded-3xl p-6 border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Recaudo por Medio</h3>
            <div className="space-y-3">
              {Object.entries(methodsSummary).map(([method, val]) => (
                <div
                  key={method}
                  className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#00f2ff]/20 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      method === 'Efectivo' ? 'bg-emerald-400' :
                      method === 'Tarjeta' ? 'bg-sky-400' :
                      method === 'Transf' ? 'bg-[#00f2ff]' :
                      'bg-amber-400'
                    }`} />
                    <span className="text-xs font-bold text-slate-300">{method}</span>
                  </div>
                  <b className="text-xs font-mono-numbers text-white">{fCOP(val)}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Recaudado</span>
            <span className="text-sm font-black font-mono-numbers text-[#00f2ff]">{fCOP(totalSales)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
