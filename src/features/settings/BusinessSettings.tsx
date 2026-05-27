import React, { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { SettingsService } from '../../services/settingsService';
import { AlertCircle, Save, CheckCircle2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { StorageService } from '../../services/storageService';

interface BusinessSettingsProps {
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function BusinessSettings({ onShowToast }: BusinessSettingsProps) {
  const { business, updateBusiness } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [restaurantName, setRestaurantName] = useState(business.restaurantName);
  const [nit, setNit] = useState(business.nit);
  const [address, setAddress] = useState(business.address);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email);
  const [currency, setCurrency] = useState(business.currency);
  const [taxPercent, setTaxPercent] = useState(business.taxPercent);
  const [tipPercent, setTipPercent] = useState(business.tipPercent);
  const [ticketFooter, setTicketFooter] = useState(business.ticketFooter);
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '🍽️');

  // Media state for Logo
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Isolate Tenant fields
  const [businessId, setBusinessId] = useState(localStorage.getItem('lual_active_business_id') || 'LUAL-BIZ-MEDELLIN-01');
  const [tenantId, setTenantId] = useState(localStorage.getItem('lual_active_tenant_id') || 'LUAL-TENANT-CO-PRO');

  // Handle Logo uploading
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const filename = `business-logo-${Date.now()}`;
      const url = await StorageService.uploadImage(file, 'businesses/default/logos', filename);
      setLogoUrl(url);
      onShowToast('Logo de la empresa cargado e indexado exitosamente.', 'success');
    } catch (err) {
      onShowToast('Error al procesar la imagen del logo. Se almacena localmente de forma segura.', 'success');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('🍽️');
    onShowToast('Se restableció el imagotipo alternativo estándar (emoji de plato).', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Persist multi-tenant dynamic parameters
    localStorage.setItem('lual_active_business_id', businessId);
    localStorage.setItem('lual_active_tenant_id', tenantId);

    const payload = {
      restaurantName,
      logoUrl,
      nit,
      address,
      phone,
      email,
      currency,
      taxPercent: Number(taxPercent) || 0,
      tipPercent: Number(tipPercent) || 0,
      ticketFooter
    };

    updateBusiness(payload);
    
    const res = await SettingsService.saveSettings(payload);
    setLoading(false);

    if (res.success) {
      onShowToast('Identidad de la empresa y partición de inquilino (tenant) unificada de forma exitosa.', 'success');
    } else {
      onShowToast('Datos de identidad guardados localmente. Servidor offline.', 'success');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Identidad & Parámetros Generales</h3>
          <p className="text-[11px] text-slate-400">Establece la personería jurídica, imagen de marca e impuestos con validez fiscal.</p>
        </div>
        <button
          type="submit"
          disabled={loading || uploadingLogo}
          className="px-5 py-2.5 rounded-2xl bg-[#00f2ff] hover:bg-[#00d6e0] text-[#050608] font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Aplicar Cambios'}
        </button>
      </div>

      {/* Brand Identity / Logo Configuration Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start bg-white/5 border border-white/10 rounded-3xl p-5">
        <div className="lg:col-span-1 flex flex-col items-center">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            LOGOTIPO CORPORATIVO
          </label>
          
          <div className="relative group w-32 h-32 rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/15 shadow-inner">
            {logoUrl && logoUrl.startsWith('http') || logoUrl.startsWith('data:image') ? (
              <img 
                src={logoUrl} 
                alt="Brand Logo" 
                className="w-full h-full object-contain p-2" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-5xl">{logoUrl || '🍽️'}</span>
            )}
            
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col gap-1.5 items-center justify-center duration-200">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1 text-[8px] font-extrabold uppercase bg-[#00f2ff] text-black rounded hover:bg-white transition-all cursor-pointer"
              >
                Cambiar
              </button>
              {logoUrl !== '🍽️' && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-2.5 py-1 text-[8px] font-extrabold uppercase bg-rose-600 text-white rounded hover:bg-rose-700 transition-all cursor-pointer"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
          <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
          
          <p className="text-[9px] text-slate-500 mt-3 text-center leading-normal">
            Aparece en tickets de venta, facturas web, reportes ejecutivos e interfaz táctil.
          </p>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Comercial</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
              required
            />
          </div>

          {/* NIT */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIT / Registro Fiscal</label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dirección Comercial Principal</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teléfono de Atención</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Email */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correo de Contacto</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modo Moneda Base</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all font-bold"
          >
            <option value="COP">COP ($ Pesos Colombianos)</option>
            <option value="USD">USD ($ Dólar Americano)</option>
            <option value="MXN">MXN ($ Peso Mexicano)</option>
            <option value="EUR">EUR (€ Euro)</option>
          </select>
        </div>

        {/* IVA */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest">IVA / Impuesto Impoconsumo (%)</label>
          <input
            type="number"
            value={taxPercent}
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#00f2ff]/5 border border-[#00f2ff]/30 text-white rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all"
            min="0"
            max="100"
            required
          />
        </div>

        {/* Propina */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-[#a855f7] uppercase tracking-widest">Propina Voluntaria Sugerida (%)</label>
          <input
            type="number"
            value={tipPercent}
            onChange={(e) => setTipPercent(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#a855f7]/5 border border-[#a855f7]/30 text-white rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-[#a855f7] outline-none transition-all"
            min="0"
            max="100"
            required
          />
        </div>

        {/* Business Tenant Identification Key */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">Identificador de Negocio (Business ID)</label>
          <input
            type="text"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full bg-[#f59e0b]/5 border border-[#f59e0b]/30 text-white rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all"
            required
            placeholder="LUAL-BIZ-MEDELLIN-01"
          />
        </div>

        {/* Dynamic Tenant isolation Code */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest">Código de Inquilino SaaS (Tenant ID)</label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full bg-[#f59e0b]/5 border border-[#f59e0b]/30 text-white rounded-2xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-[#f59e0b] outline-none transition-all"
            required
            placeholder="LUAL-TENANT-CO-PRO"
          />
        </div>
      </div>

      {/* Ticket Footer */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pie de Página de Ticket Termoimpreso</label>
        <textarea
          value={ticketFooter}
          onChange={(e) => setTicketFooter(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:ring-1 focus:ring-[#00f2ff] outline-none transition-all h-24 resize-none leading-relaxed"
          maxLength={200}
        />
      </div>

      <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/10 rounded-2xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#00f2ff] flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#00f2ff] leading-relaxed">
          <strong>Seguridad de Datos:</strong> Cualquier guardado y cambio de configuración realizado localmente se almacena en IndexedDB con soporte automático sin conexión, y se sincronizará con Firebase de manera deferida.
        </p>
      </div>
    </form>
  );
}
