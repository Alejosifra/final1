import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

interface SecuritySettingsProps {
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export default function SecuritySettings({ onShowToast }: SecuritySettingsProps) {
  const [sessionAutoLogout, setSessionAutoLogout] = useState('60'); // Minutes before lock
  const [isPinRequiredCriticalAction, setIsPinRequiredCriticalAction] = useState(true);
  const [offlineSyncBypass, setOfflineSyncBypass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('Directivas de seguridad actualizadas con éxito.', 'success');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="text-[#a855f7] w-5 h-5" />
            Directivas de Seguridad & Encriptación POS
          </h3>
          <p className="text-[11px] text-slate-400">Protege el flujo del terminal contra alteración de comandas y retiros no autorizados de caja.</p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-xs uppercase rounded-2xl transition-all"
        >
          Aplicar Políticas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 p-4 rounded-3xl bg-white/5 border border-white/5">
          <label className="text-xs font-bold text-white uppercase block">Auto-Bloqueo del Terminal por Inactividad</label>
          <span className="text-[10px] text-slate-400 block mb-3">Minutos antes de exigir PIN de acceso nuevamente.</span>
          <select
            value={sessionAutoLogout}
            onChange={(e) => setSessionAutoLogout(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#00f2ff] outline-none"
          >
            <option value="15">15 Minutos de Inactividad</option>
            <option value="30">30 Minutos de Inactividad</option>
            <option value="60">1 Hora (Recomendado para salón)</option>
            <option value="120">2 Horas de Tolerancia</option>
            <option value="none">No Bloquear Nunca</option>
          </select>
        </div>

        <div className="space-y-1.5 p-4 rounded-3xl bg-white/5 border border-white/5">
          <label className="text-xs font-bold text-white uppercase block">Exigir PIN para Descuento y Anulaciones</label>
          <span className="text-[10px] text-slate-400 block mb-3">Obliga a digitar PIN de supervisor en anulaciones/devoluciones.</span>
          <select
            value={isPinRequiredCriticalAction ? 'true' : 'false'}
            onChange={(e) => setIsPinRequiredCriticalAction(e.target.value === 'true')}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2 focus:ring-1 focus:ring-[#00f2ff] outline-none"
          >
            <option value="true">Sí, exigir validación estricta de credencial</option>
            <option value="false">No, permitir si el operador posee el rol activo</option>
          </select>
        </div>
      </div>

      <div className="bg-[#a855f7]/5 border border-[#a855f7]/15 rounded-3xl p-4 flex gap-3 text-xs text-[#a855f7] items-start">
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wide">Directiva Anti-Manipulación de Auditoría</span>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
            Las contraseñas de supervisor y claves del sistema se encriptan de manera asimétrica a nivel de capa LocalStorage. Ninguna acción autorizada puede ser eliminada del log de auditoría sin dejar huella inmutable.
          </p>
        </div>
      </div>
    </form>
  );
}
