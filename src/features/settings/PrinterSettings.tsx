import React, { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { Printer, Save, CheckCircle2 } from 'lucide-react';

interface PrinterSettingsProps {
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function PrinterSettings({ onShowToast }: PrinterSettingsProps) {
  const { printer, updatePrinter } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [ip, setIp] = useState(printer.ip);
  const [port, setPort] = useState(printer.port);
  const [kitchenPrinterIp, setKitchenPrinterIp] = useState(printer.kitchenPrinterIp);
  const [barPrinterIp, setBarPrinterIp] = useState(printer.barPrinterIp);
  const [ticketSize, setTicketSize] = useState(printer.ticketSize);
  const [autoPrintReceipts, setAutoPrintReceipts] = useState(printer.autoPrintReceipts);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    updatePrinter({
      ip,
      port: Number(port) || 9100,
      kitchenPrinterIp,
      barPrinterIp,
      ticketSize,
      autoPrintReceipts
    });

    setLoading(false);
    onShowToast('Configuración de impresoras térmicas ESC/POS aplicada.', 'success');
  };

  return (
    <form onSubmit={handleApply} className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Printer className="text-[#00f2ff] w-5 h-5" />
            Impresoras de Comanda & Factura Térmica (ESC/POS)
          </h3>
          <p className="text-[11px] text-slate-400">Administra los puertos socket de red y comandos de corte de papel automático.</p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-[#00f2ff] hover:bg-[#00d6e0] text-[#050608] font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          Aplicar Sockets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Impresora Factura POS (IP o Loopback)</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs font-mono text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            placeholder="192.168.1.99"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Puerto TCP (Por defecto 9100)</label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-xs font-mono text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            placeholder="9100"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Impresora de Cocina (IP Comandera)</label>
          <input
            type="text"
            value={kitchenPrinterIp}
            onChange={(e) => setKitchenPrinterIp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs font-mono text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            placeholder="192.168.1.101"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Impresora Bar / Barra Bebidas (IP)</label>
          <input
            type="text"
            value={barPrinterIp}
            onChange={(e) => setBarPrinterIp(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs font-mono text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            placeholder="192.168.1.102"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Ancho del Papel Térmico</label>
          <select
            value={ticketSize}
            onChange={(e) => setTicketSize(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
          >
            <option value="80mm">80 mm Standard (Recomendado para restaurantes)</option>
            <option value="58mm">58 mm Ticket Pequeño</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Autoimprimir al Cobrar</label>
          <select
            value={autoPrintReceipts ? 'true' : 'false'}
            onChange={(e) => setAutoPrintReceipts(e.target.value === 'true')}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-2xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
          >
            <option value="true">Sí, disparar impresión directa tras el pago</option>
            <option value="false">No, exigir confirmación en pantalla antes de imprimir</option>
          </select>
        </div>
      </div>

      <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/10 rounded-3xl p-4 flex gap-3 text-xs text-[#00f2ff] items-start">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wide">Compatibilidad Universal ESC/POS & QZ Tray</span>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
            Las órdenes emitidas se reformatean en formato raw de bajo nivel con cortes de papel automáticos tipo cutters. Funcionamiento directo para impresoras Star Micronics, Epson TM-T88, Munbyn, Bixolon, y compatibles de red ethernet/WiFi.
          </p>
        </div>
      </div>
    </form>
  );
}
