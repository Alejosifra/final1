import { useState, useMemo } from 'react';
import { Customer, Abono } from '../types';
import { Users, Search, UserPlus, CreditCard, Receipt, Edit2, Trash2 } from 'lucide-react';

interface ClientsViewProps {
  clientes: Customer[];
  onOpenAddModal: () => void;
  onOpenEditModal: (id: number) => void;
  onOpenAbonoModal: (id: number) => void;
  onOpenAccountStatement: (id: number) => void;
  onDeleteCustomer: (id: number) => void;
}

export default function ClientsView({
  clientes,
  onOpenAddModal,
  onOpenEditModal,
  onOpenAbonoModal,
  onOpenAccountStatement,
  onDeleteCustomer,
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const globalPortfolio = useMemo(() => {
    return clientes.reduce((sum, c) => sum + c.deuda, 0);
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.nombre.toLowerCase().includes(q) ||
        c.nit.toLowerCase().includes(q) ||
        c.tel.toLowerCase().includes(q) ||
        (c.mail && c.mail.toLowerCase().includes(q)) ||
        String(c.id).includes(q)
      );
    });
  }, [clientes, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top action line and metrics summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl">
          <button
            onClick={onOpenAddModal}
            className="btn-active cursor-pointer hover:brightness-110 font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-95 transition-all outline-none"
          >
            <UserPlus className="w-4 h-4" />
            REGISTRAR CLIENTE
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT, cédula, teléfono..."
              className="bg-white/5 border border-white/10 text-white rounded-2xl text-xs pl-11 pr-4 py-3.5 w-full outline-none focus:border-[#00f2ff] transition-all font-bold placeholder-slate-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-panel rounded-3xl px-8 py-5 flex items-center gap-5 border border-white/10 min-w-80">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cartera Global Pendiente</span>
            <h3 className="text-2xl font-black text-rose-400 mt-0.5 font-mono-numbers">{fCOP(globalPortfolio)}</h3>
          </div>
        </div>
      </div>

      {/* Main Clients Table List */}
      <div className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-4">Cliente / Teléfono</th>
                <th className="pb-4">Cédula / NIT</th>
                <th className="pb-4">Cupo Autorizado</th>
                <th className="pb-4">Deuda Actual</th>
                <th className="pb-4">Saldo Disponible</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right">Acciones de Cartera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No se encontraron clientes registrados con ese criterio.
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => {
                  const available = c.cupo - c.deuda;
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2 flex-wrap">
                            {c.nombre}
                            <span className="text-[9px] font-mono-numbers text-[#00f2ff] bg-[#00f2ff]/10 px-1.5 py-0.5 rounded border border-[#00f2ff]/20 font-black">
                              ID: {c.id}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono-numbers mt-1">
                            📞 {c.tel} {c.mail ? `| ✉️ ${c.mail}` : ''}
                          </span>
                          {c.dir && (
                            <span className="text-[9px] text-slate-500 mt-1 italic">
                              📍 {c.dir}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-xs font-mono-numbers text-slate-300">{c.nit}</td>
                      <td className="py-4 text-xs font-mono-numbers font-medium text-slate-300">{fCOP(c.cupo)}</td>
                      <td className="py-4 text-xs font-mono-numbers font-extrabold text-red-400">{fCOP(c.deuda)}</td>
                      <td className="py-4 text-xs font-mono-numbers font-extrabold text-[#00f2ff]">{fCOP(available)}</td>
                      <td className="py-4">
                        <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                          c.status === 'Activo' 
                            ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            onClick={() => onOpenEditModal(c.id)}
                            title="Editar Cliente"
                            className="p-2 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl active:scale-95 transition-all outline-none"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenAbonoModal(c.id)}
                            disabled={c.deuda <= 0}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1 active:scale-95 transition-all outline-none border ${
                              c.deuda <= 0
                                ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                                : 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30 hover:bg-[#00f2ff]/20'
                            }`}
                          >
                            ABONO
                          </button>
                          <button
                            onClick={() => onOpenAccountStatement(c.id)}
                            title="Estado de cuenta"
                            className="px-2.5 py-1.5 text-xs bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-1 active:scale-95 transition-all outline-none"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-bold hidden sm:inline uppercase tracking-widest">DETALLE</span>
                          </button>
                          <button
                            onClick={() => onDeleteCustomer(c.id)}
                            title="Eliminar Cliente"
                            className="p-2 bg-red-500/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/20 rounded-xl active:scale-95 transition-all outline-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
