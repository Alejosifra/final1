import { useState, useMemo } from 'react';
import { Sale } from '../types';
import { Calendar, Search, Filter, ShieldAlert, BookOpen, Trash } from 'lucide-react';

interface HistoryViewProps {
  history: Sale[];
  onDeleteHistory: (id: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function HistoryView({
  history,
  onDeleteHistory,
  onShowToast,
}: HistoryViewProps) {
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const filteredHistory = useMemo(() => {
    return history.filter((s) => {
      // Date filter match
      const matchDate = !filterDate || s.timestamp.startsWith(filterDate);
      // Search text match
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.table.toLowerCase().includes(q) ||
        s.cliente.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.method.toLowerCase().includes(q);

      return matchDate && matchSearch;
    });
  }, [history, filterDate, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Date Filtering Bar */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Custom Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Buscar por mesa, cliente, medio o ID..."
              className="bg-white/5 border border-white/10 text-white rounded-2xl text-xs pl-11 pr-4 py-3.5 w-full outline-none focus:border-[#00f2ff] transition-all font-bold placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Filter Box */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1.5 h-11">
            <Calendar className="text-slate-400 w-4 h-4 flex-shrink-0" />
            <input
              type="date"
              className="bg-transparent text-white text-xs font-bold outline-none border-0 p-0 h-full w-32 focus:ring-0 cursor-pointer [color-scheme:dark]"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Clear Filter Triggers */}
        {(filterDate || searchQuery) && (
          <button
            onClick={() => {
              setFilterDate('');
              setSearchQuery('');
              onShowToast('Filtros removidos.', 'info');
            }}
            className="text-xs font-black text-[#00f2ff] hover:brightness-110 tracking-wider uppercase cursor-pointer outline-none"
          >
            LIMPIAR FILTROS
          </button>
        )}
      </div>

      {/* Main Transactions List Table */}
      <div className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-4">ID de Cuenta</th>
                <th className="pb-4">Fecha / Hora</th>
                <th className="pb-4">Puesto / Mesa</th>
                <th className="pb-4">Medio Cobro</th>
                <th className="pb-4">Total Recaudado</th>
                <th className="pb-4">Socio de Cuenta</th>
                <th className="pb-4 text-center">Invertir Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No se encontraron registros de ventas que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-all">
                    <td className="py-4">
                      <span className="text-[10px] font-mono-numbers font-bold text-slate-500 block max-w-[124px] truncate" title={s.id}>
                        {s.id}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-mono-numbers text-slate-400">
                      {new Date(s.timestamp).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {s.table}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                        s.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                        s.method === 'Tarjeta' ? 'bg-sky-500/10 text-sky-400 border-sky-500/15' :
                        s.method === 'Transf' ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/15'
                      }`}>
                        {s.method}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-mono-numbers font-extrabold text-[#00f2ff]">
                      {fCOP(s.total)}
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {s.cliente || 'Venta de Pasillo'}
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => onDeleteHistory(s.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all border border-transparent hover:border-rose-500/30 outline-none"
                        title="Reversar venta de inventario"
                      >
                        <Trash className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
