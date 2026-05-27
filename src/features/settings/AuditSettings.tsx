import React, { useState, useEffect } from 'react';
import { EnterpriseDBService, AuditLog } from '../../services/supabaseService';
import { Library, Trash, RefreshCw, FileSpreadsheet, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AuditSettingsProps {
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export default function AuditSettings({ onShowToast }: AuditSettingsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterModule, setFilterModule] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLogs(EnterpriseDBService.getAuditLogs() || []);
  };

  const handleClearLogs = () => {
    if (!confirm('¿Estás seguro de vaciar el log de auditoría local?')) return;
    localStorage.removeItem('lual_v9_audit_logs');
    setLogs([]);
    onShowToast('Bitácora de auditoría in situ vaciada.', 'info');
  };

  const filteredLogs = logs.filter(log => {
    const matchUser = log.user.toLowerCase().includes(filterUser.toLowerCase());
    const matchModule = filterModule === 'ALL' || log.module === filterModule;
    return matchUser && matchModule;
  });

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      onShowToast('No hay registros de auditoría para exportar.', 'info');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filteredLogs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría POS");
    XLSX.writeFile(workbook, "LualGastro_Autoditoria_Logs.xlsx");
    onShowToast('Logs de auditoría exportados en Excel.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Library className="text-[#00f2ff] w-5 h-5" />
            Bitácora de Auditoría e Incidencias en Turno
          </h3>
          <p className="text-[11px] text-slate-400">Audite los cambios de precios, cierres de turno, anulaciones de comandas y logs de ingresos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase rounded-xl border border-emerald-500/10 flex items-center gap-1 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Recargar logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs uppercase rounded-xl border border-rose-500/10 flex items-center gap-1 transition-all"
          >
            <Trash className="w-4 h-4" />
            Purgar Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-slate-400" /> Filtrar por Operador
          </label>
          <input
            type="text"
            placeholder="Escriba el nombre del cajero/mesero"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2.5 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtrar por Módulo</label>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2.5 outline-none"
          >
            <option value="ALL">TODOS LOS MÓDULOS</option>
            <option value="POS">VENTA POS / MESAS</option>
            <option value="CAJA">CAJA MENOR Y Z-REPORTS</option>
            <option value="AUTH">AUTENTICACIONES Y PERFILES</option>
            <option value="INVENTARIO">CATÁLOGOS E INVENTARIO</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-white/5 bg-white/2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[9px] font-extrabold text-slate-400 tracking-wider bg-white/5 uppercase">
              <th className="p-4 pl-6">Fecha/Hora</th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Módulo</th>
              <th className="p-4">Acción</th>
              <th className="p-4 pr-6">Detalles del Incidente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs text-slate-300">
            {filteredLogs.slice(0, 100).map((log, index) => (
              <tr key={index} className="hover:bg-white/2 transition-colors">
                <td className="p-4 pl-6 font-mono text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleString('es-CO')}
                </td>
                <td className="p-4">
                  <div>
                    <span className="font-bold text-white block">{log.user}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-black">{log.role}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                    {log.module}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    log.action.includes('FALLIDO') || log.action.includes('ERROR')
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="p-4 pr-6 text-slate-400 max-w-xs truncate" title={log.details}>
                  {log.details}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                  No se encontraron incidentes registrados en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
