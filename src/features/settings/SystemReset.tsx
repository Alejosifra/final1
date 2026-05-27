import React, { useState } from 'react';
import { AlertTriangle, Trash2, Key, HelpCircle, Check, ShieldCheck } from 'lucide-react';

interface SystemResetProps {
  onResetDatabaseSection: (sections: {
    sales: boolean;
    cash: boolean;
    history: boolean;
    audit: boolean;
    customers: boolean;
    inventory: boolean;
    tables?: boolean;
    all?: boolean;
  }) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export default function SystemReset({ onResetDatabaseSection, onShowToast }: SystemResetProps) {
  // Option Selectors
  const [sales, setSales] = useState(false);
  const [cash, setCash] = useState(false);
  const [history, setHistory] = useState(false);
  const [audit, setAudit] = useState(false);
  const [customers, setCustomers] = useState(false);
  const [inventory, setInventory] = useState(false);
  const [tables, setTables] = useState(false);
  const [all, setAll] = useState(false);

  // Security checks
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');

  const SUPERVISOR_PASSWORD = 'LUAL123';

  const handleAllToggle = () => {
    const nextAll = !all;
    setAll(nextAll);
    if (nextAll) {
      setSales(true);
      setCash(true);
      setHistory(true);
      setAudit(true);
      setCustomers(true);
      setInventory(true);
      setTables(true);
    } else {
      setSales(false);
      setCash(false);
      setHistory(false);
      setAudit(false);
      setCustomers(false);
      setInventory(false);
      setTables(false);
    }
  };

  const handleOpenConfirm = () => {
    const noneSelected = !sales && !cash && !history && !audit && !customers && !inventory && !tables && !all;
    if (noneSelected) {
      onShowToast('Selecciona al menos un módulo o "Reiniciar TODO" para purgar.', 'warning');
      return;
    }
    setConfirmModal(true);
  };

  const handleExecuteReset = () => {
    if (confirmText.toUpperCase() !== 'RESET') {
      onShowToast('Frase de validación incorrecta. Escribe "RESET" exactamente.', 'error');
      return;
    }

    if (supervisorPassword !== SUPERVISOR_PASSWORD) {
      onShowToast('PIN o clave de supervisor incorrecta. Autorización revocada.', 'error');
      return;
    }

    // Execute state reset upward
    onResetDatabaseSection({
      sales,
      cash,
      history,
      audit,
      customers,
      inventory,
      tables,
      all
    });

    onShowToast('Los módulos de sistema seleccionados fueron purgados exitosamente.', 'warning');
    setConfirmModal(false);
    setConfirmText('');
    setSupervisorPassword('');

    // Reset checkboxes
    setSales(false);
    setCash(false);
    setHistory(false);
    setAudit(false);
    setCustomers(false);
    setInventory(false);
    setTables(false);
    setAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="text-rose-500 w-5 h-5 animate-pulse" />
            Reinicios Críticos & Purga Administrativa
          </h3>
          <p className="text-[11px] text-slate-400">Restablece parcial o totalmente la base de datos de transacciones del POS.</p>
        </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-500/25 rounded-2xl p-5 flex gap-4 text-xs items-start text-rose-400">
        <AlertTriangle className="w-5.5 h-5.5 flex-shrink-0 text-rose-500" />
        <div>
          <span className="font-extrabold text-sm block uppercase tracking-wider text-white">ADVERTENCIA COMERCIAL DE SEGURIDAD SECURE-LOCK</span>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            Las operaciones de purgado son **IRREVERSIBLES**. El reinicio de inventores, ventas históricas y auditoría dejará el terminal sin registros previos. Realice una copia de seguridad preventivamente. El sistema preservará las identidades de locales y claves de colaboradores Admins.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Checkbox columns */}
        <div className="xl:col-span-2 p-5 border border-white/5 bg-slate-900/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--app-accent)]">Módulos a Reiniciar</h4>
            <button 
              onClick={handleAllToggle}
              className={`text-[9px] px-2.5 py-1.5 rounded-lg border font-black uppercase tracking-wider transition-all ${
                all 
                  ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              {all ? 'Desmarcar todo' : 'Seleccionar TODO (Factory Reset)'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Reset Active Sales */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={sales}
                onChange={() => {
                  setSales(!sales);
                  if (all && sales) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Vaciar Cuentas / Comandas</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Establece todas las mesas del salón y barras en estado Libre.</span>
              </div>
            </label>

            {/* Reset Cash Status */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={cash}
                onChange={() => {
                  setCash(!cash);
                  if (all && cash) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Arqueo Diarios & Turnos de Caja</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Restablece la base monetaria inicial y reinicia el listado de turnos de caja menor.</span>
              </div>
            </label>

            {/* Reset History */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={history}
                onChange={() => {
                  setHistory(!history);
                  if (all && history) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Purgar Historial Ventas (Facturas Z)</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Elimina todas las transacciones cobradas históricas, gráficos e informes correlacionados.</span>
              </div>
            </label>

            {/* Reset Audit */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={audit}
                onChange={() => {
                  setAudit(!audit);
                  if (all && audit) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Limpiar Bitácora de Auditoría</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Elimina logs de ingresos, cancelaciones y revocaciones in situ.</span>
              </div>
            </label>

            {/* Reset Customers */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={customers}
                onChange={() => {
                  setCustomers(!customers);
                  if (all && customers) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Remover Base Clientes & Cartera</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Borra clientes y sus respectivas deudas de cartera de crédito fiada.</span>
              </div>
            </label>

            {/* Reset Inventory */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={inventory}
                onChange={() => {
                  setInventory(!inventory);
                  if (all && inventory) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Vaciar Catálogo / Productos</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Purga todos los platos, bebidas y postres agregados en el menú.</span>
              </div>
            </label>

            {/* NEW: Reset Tables Layout */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/30 border border-white/5 cursor-pointer hover:bg-slate-900/50 select-none transition-all">
              <input
                type="checkbox"
                checked={tables}
                onChange={() => {
                  setTables(!tables);
                  if (all && tables) setAll(false);
                }}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-white block">Reiniciar Estructura de Mesas</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Vacía y reconfigura las mesas a su estado de fábrica estructurado (Mesas 1-8 y Barras 1-4).</span>
              </div>
            </label>

            {/* ALL Factory Reset master indicator */}
            <label className="flex items-start gap-3.5 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 cursor-pointer hover:bg-rose-500/10 select-none transition-all">
              <input
                type="checkbox"
                checked={all}
                onChange={handleAllToggle}
                className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4 bg-transparent border-white/20 mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-rose-400 block">Restablecimiento Físico Completo</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Purga masiva de todas las transacciones, inventarios y cartera simultáneamente.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Action summary panel */}
        <div className="p-5 border border-white/5 bg-slate-900/25 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#a855f7]">Resumen del Purgado</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Marque las opciones deseadas y presione el gatillo administrativo. Requiere doble verificación explícita, frase literal y credencial PIN del supervisor para efectuar el vaciado permanente de memoria.
            </p>

            <div className="bg-black/15 p-3 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Módulos seleccionados:</span>
              <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside">
                {sales && <li>Comandas de mesas</li>}
                {cash && <li>Arqueos y Turnos de Caja</li>}
                {history && <li>Cierres Z e histórico</li>}
                {audit && <li>Bitácoras de auditoría</li>}
                {customers && <li>Clientes deudores</li>}
                {inventory && <li>Platos e Inventario</li>}
                {tables && <li>Reiniciar estructura salón</li>}
                {!sales && !cash && !history && !audit && !customers && !inventory && !tables && <li className="text-slate-500">Ningún módulo</li>}
              </ul>
            </div>
          </div>

          <button
            onClick={handleOpenConfirm}
            className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs py-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-rose-500/20"
          >
            <Trash2 className="w-4.5 h-4.5" />
            Purgar Selección
          </button>
        </div>
      </div>

      {/* Double Confirmation Modal Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-[#050608]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-[32px] p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.25)]">
            <div className="flex flex-col items-center text-center space-y-3">
              <span className="p-2.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8 text-rose-500 animate-ping" />
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">¿Autorizar Purgado Administrativo?</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Estás a un paso de purgar permanentemente partes vitales de la facturación comercial de LUAL GASTRO.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">Escribe la frase de control literal: <code className="text-[#00f2ff]">RESET</code></label>
                <input
                  type="text"
                  placeholder="Escribe RESET aquí"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs font-black text-center text-white rounded-xl py-3 focus:ring-1 focus:ring-rose-500 gap-1 uppercase outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Clave PIN de Supervisor General
                </label>
                <input
                  type="password"
                  placeholder="Ingresa clave de Supervisor"
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-xs text-center text-white rounded-xl py-3 focus:ring-1 focus:ring-rose-500 outline-none font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-3.5 rounded-xl text-xs uppercase shadow-lg shadow-rose-500/20"
              >
                Confirmar Borrado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
