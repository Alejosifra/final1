import React, { useState, useMemo } from 'react';
import { Sale, CashMovement, Shift, DBState } from '../types';
import * as XLSX from 'xlsx';
import { ArrowUpRight, ArrowDownRight, Download, Upload, Coins, Plus, Minus, History, Trash, ShieldCheck, ShieldAlert, Key } from 'lucide-react';
import { EnterpriseDBService } from '../services/supabaseService';

interface AuditViewProps {
  baseCash: number;
  sales: Sale[];
  expenses: CashMovement[];
  shifts: Shift[];
  shiftStart: string | null;
  onAddMovement: (desc: string, val: number, tipo: 'Entrada' | 'Salida') => void;
  onImportBackup: (backupState: any) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  fullDBState: DBState;
}

export default function AuditView({
  baseCash,
  sales,
  expenses,
  shifts,
  shiftStart,
  onAddMovement,
  onImportBackup,
  onShowToast,
  fullDBState,
}: AuditViewProps) {
  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');

  const shiftSales = useMemo(() => {
    return sales.filter((s) => !shiftStart || s.timestamp >= shiftStart);
  }, [sales, shiftStart]);

  const cashSales = useMemo(() => {
    return shiftSales.filter((s) => s.method === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
  }, [shiftSales]);

  const shiftMovs = useMemo(() => {
    return expenses.filter((e) => !shiftStart || e.time >= shiftStart);
  }, [expenses, shiftStart]);

  const entries = useMemo(() => {
    return shiftMovs.filter((e) => e.tipo === 'Entrada').reduce((sum, e) => sum + e.val, 0);
  }, [shiftMovs]);

  const exits = useMemo(() => {
    return shiftMovs.filter((e) => e.tipo === 'Salida').reduce((sum, e) => sum + e.val, 0);
  }, [shiftMovs]);

  const totalCashDrawer = baseCash + cashSales + entries - exits;

  const handleAddMov = (tipo: 'Entrada' | 'Salida') => {
    const v = parseFloat(val);
    if (!desc.trim() || isNaN(v) || v <= 0) {
      onShowToast('Por favor, ingresa una descripción y valor de dinero válidos.', 'error');
      return;
    }

    onAddMovement(desc.trim(), v, tipo);
    setDesc('');
    setVal('');
  };

  // SheetJS Excel Full Backup Multi-Sheet File Exporter
  const handleExportBackup = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Table mapping representing sheets
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullDBState.clientes), 'CLIENTES');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullDBState.products), 'INVENTARIO');

      const stringifiedSales = fullDBState.history.map((h) => ({
        ...h,
        items: JSON.stringify(h.items), // Support sub-arrays conversion to spreadsheet cells
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stringifiedSales), 'VENTAS');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullDBState.expenses), 'CAJA');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fullDBState.abonos), 'ABONOS');

      XLSX.writeFile(wb, `LUAL_BACKUP_${new Date().toISOString().split('T')[0]}.xlsx`);
      onShowToast('Copia de respaldo (.XLSX) creada.', 'success');
    } catch (err) {
      onShowToast('Fallo al exportar copia de seguridad.', 'error');
    }
  };

  // SheetJS Excel Backup Restorer Overwriter
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const confirmRestore = confirm(
          '🚨 ADVERTENCIA: ¿Estás seguro de restaurar una copia de seguridad? Esto REEMPLAZARÁ la totalidad de la base de datos actual.'
        );

        if (confirmRestore) {
          const loadedClientes = XLSX.utils.sheet_to_json<any>(workbook.Sheets['CLIENTES']) || [];
          const loadedProducts = XLSX.utils.sheet_to_json<any>(workbook.Sheets['INVENTARIO']) || [];
          const rawVentas = XLSX.utils.sheet_to_json<any>(workbook.Sheets['VENTAS']) || [];
          const loadedCaja = XLSX.utils.sheet_to_json<any>(workbook.Sheets['CAJA']) || [];
          const loadedAbonos = XLSX.utils.sheet_to_json<any>(workbook.Sheets['ABONOS']) || [];

          // Map stringified arrays of items back to real objects
          const loadedVentas = rawVentas.map((v) => {
            let parsedItems = [];
            if (typeof v.items === 'string') {
              try {
                parsedItems = JSON.parse(v.items);
              } catch (ex) {
                parsedItems = [];
              }
            } else {
              parsedItems = v.items || [];
            }
            return {
              ...v,
              items: parsedItems,
            };
          });

          const restoredState: Partial<DBState> = {
            clientes: loadedClientes,
            products: loadedProducts,
            history: loadedVentas,
            expenses: loadedCaja,
            abonos: loadedAbonos,
          };

          onImportBackup(restoredState);
          onShowToast('Base de datos restaurada con éxito.', 'success');
        }
      } catch (err) {
        onShowToast('Copia de respaldo errónea o ilegible.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset slot
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Drawer stats header block */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fondo Inicio de Caja</span>
          <h3 className="text-2xl font-black text-white mt-3 font-mono-numbers">{fCOP(baseCash)}</h3>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ingresos Turno (Efectivo)</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-3 font-mono-numbers">{fCOP(cashSales + entries)}</h3>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gastos / Egresos Caja</span>
          <h3 className="text-2xl font-black text-rose-400 mt-3 font-mono-numbers">{fCOP(exits)}</h3>
        </div>

        <div className="bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-white rounded-3xl p-6 accent-glow">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Efectivo Físico Esperado</span>
          <h3 className="text-2xl font-black text-[#00f2ff] mt-3 font-mono-numbers">{fCOP(totalCashDrawer)}</h3>
        </div>
      </div>

      {/* Backup and Ledger Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Backups and Z reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Backup block */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Coins className="text-[#00f2ff] w-5 h-5 accent-glow" />
              Copia de Respaldo Completa (.XLSX)
            </h3>
            <p className="text-xs text-slate-400 mt-2 pb-4 border-b border-white/5 leading-relaxed">
              Descarga o carga una copia local completa de la base de datos de Lual Gastro POS v9. El archivo contiene hojas separadas con toda la información de transacciones de ventas, inventario, clientes, y movimientos de caja menor.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4">
              <button
                onClick={handleExportBackup}
                className="bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/25 text-[#00f2ff] font-extrabold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
              >
                <Download className="w-4 h-4" />
                Descargar Copia de Respaldo
              </button>

              <label className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-extrabold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer outline-none">
                <Upload className="w-4 h-4" />
                Restaurar Base de Datos
                <input type="file" className="hidden" accept=".xlsx" onChange={handleImportBackup} />
              </label>
            </div>
          </div>

          {/* Shifts Z History */}
          <div className="glass-panel rounded-[32px] p-6 border border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
              <History className="text-[#00f2ff] w-5 h-5" />
              Historial de Cierres de Caja (Z)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    <th className="pb-3">Cierre / Fecha</th>
                    <th className="pb-3">Venta Total</th>
                    <th className="pb-3">Efectivo Cobrado</th>
                    <th className="pb-3">Retorno Neto (Utilidad)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-xs text-slate-500">
                        No se registran cierres quincenales o diarios en el historial.
                      </td>
                    </tr>
                  ) : (
                    shifts.map((s, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-all">
                        <td className="py-3 text-xs font-mono-numbers text-slate-300">
                          {new Date(s.end).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 text-xs font-mono-numbers font-medium text-slate-300">
                          {fCOP(s.total)}
                        </td>
                        <td className="py-3 text-xs font-mono-numbers font-bold text-emerald-400">
                          {fCOP(s.cash)}
                        </td>
                        <td className="py-3 text-xs font-mono-numbers font-bold text-[#00f2ff]">
                          {fCOP(s.profit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SaaS Core Enterprise Audit Logs (Phase 10) */}
          <div className="glass-panel rounded-[32px] p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldCheck className="text-[#00f2ff] w-5 h-5 accent-glow" />
                Bitácora de Auditoría Comercial en Tiempo Real
              </h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono-numbers font-bold">
                PROT-ACTIVO
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Resumen de operaciones registradas. Captura de forma inmutable las acciones críticas realizadas por roles del sistema (Ventas, Autorizaciones, Descuentos, Caja).
            </p>

            <div className="overflow-y-auto max-h-72 space-y-2 pr-1">
              {EnterpriseDBService.getAuditLogs().map((log) => (
                <div 
                  key={log.id} 
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-slate-700 transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[20px] pt-1">
                      {log.module === 'CAJA' ? '🪙' : log.module === 'AUTH' ? '🔐' : log.module === 'INVENTARIO' ? '📦' : '🍽️'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white uppercase tracking-wide text-[11px]">
                          {log.action}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-bold uppercase">
                          {log.role}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 text-[11px] leading-tight">
                        {log.details}
                      </p>
                      <span className="text-[9px] text-slate-500 font-mono-numbers mt-1 block">
                        Operador: {log.user} • ID: {log.id}
                      </span>
                    </div>
                  </div>
                  
                  <span className="text-[9px] font-mono-numbers text-slate-400 whitespace-nowrap md:text-right">
                    {new Date(log.timestamp).toLocaleTimeString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Petty cash tracking list */}
        <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between h-full min-h-[480px]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Caja Menor / Egresos</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Registra entradas por base extra de efectivo, propinas recibidas o salidas para compras inmediatas de insumos, etc.
            </p>

            <div className="my-5 bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
              <input
                type="text"
                placeholder="Concepto o justificación"
                className="w-full bg-white/5 border border-white/10 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none focus:border-[#00f2ff]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />

              <input
                type="number"
                placeholder="Valor en pesos ($)"
                className="w-full bg-white/5 border border-white/10 text-white px-3.5 py-2.5 text-xs rounded-xl outline-none focus:border-[#00f2ff]"
                value={val}
                onChange={(e) => setVal(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddMov('Entrada')}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all outline-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ENTRADA
                </button>

                <button
                  type="button"
                  onClick={() => handleAddMov('Salida')}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/15 rounded-xl py-2.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all outline-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                  SALIDA
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 mt-2 pr-1 space-y-2">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1 block">Movimientos Recientes del Turno</h4>
            {shiftMovs.length === 0 ? (
              <p className="text-center text-[10px] text-slate-500 py-3 font-semibold uppercase tracking-wider">No hay registros cargados hoy</p>
            ) : (
              shiftMovs.map((m) => (
                <div
                  key={m.id}
                  className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-2xl text-[11px] hover:border-[#00f2ff]/40 transition-all font-semibold"
                >
                  <div>
                    <span className="text-white block text-xs font-bold leading-tight uppercase tracking-wide">{m.desc}</span>
                    <span className="text-slate-500 font-normal text-[9px] mt-0.5 block">{new Date(m.time).toLocaleTimeString()}</span>
                  </div>
                  <span className={`font-mono-numbers font-bold text-xs ${m.tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.tipo === 'Entrada' ? '+' : '-'}{fCOP(m.val)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
