import { TabType } from '../types';
import { LayoutDashboard, ShoppingCart, Users, FolderOpen, History, Award, LogOut, BarChart3, Settings, Edit2, Building2 } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onCloseShift: () => void;
}

export default function Sidebar({ activeTab, onTabChange, onCloseShift }: SidebarProps) {
  const { business } = useSettingsStore();

  const menuItems = [
    { key: 'dash' as const, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pos' as const, label: 'Servicio POS', icon: ShoppingCart },
    { key: 'clientes' as const, label: 'Clientes & Cartera', icon: Users },
    { key: 'reports' as const, label: 'Reportes Ventas', icon: BarChart3 },
    { key: 'inventory' as const, label: 'Inventario Pro', icon: FolderOpen },
    { key: 'history' as const, label: 'Historial Ventas', icon: History },
    { key: 'audit' as const, label: 'Caja & Backup', icon: Award },
    { key: 'settings' as const, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-72 border-r border-[var(--app-border-color)] flex flex-col justify-between py-8 px-6 flex-shrink-0 no-print bg-[var(--app-bg-secondary)] backdrop-blur-xl">
      {/* Brand Header */}
      <div>
        {/* Elegant "LUAL GASTRO" Centered Title */}
        <div className="flex flex-col items-center justify-center text-center pb-5 border-b border-[var(--app-border-color)] mb-5 cursor-default relative select-none">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--app-accent)] animate-pulse" />
            <h1 className="text-xl font-black tracking-[0.16em] text-[var(--app-text-primary)]">
              LUAL<span className="text-[var(--app-accent)] font-light">GASTRO</span>
            </h1>
          </div>
          <span className="text-[8px] font-extrabold tracking-[0.25em] text-[var(--app-text-secondary)]/50 uppercase font-mono mt-1">
            Enterprise Management System
          </span>
        </div>

        {/* Customizable Implementing Brand Slot */}
        <div
          onClick={() => onTabChange('settings')}
          className="group mb-5 p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--app-border-color)] hover:border-[var(--app-accent)]/30 transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
          title="Haga clic para configurar nombre y logo de su empresa en Ajustes"
        >
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--app-accent)]/5 rounded-full blur-lg group-hover:bg-[var(--app-accent)]/10 transition-all duration-300" />
          
          <div className="w-12 h-12 rounded-2xl bg-[var(--app-bg-secondary)] border border-[var(--app-border-color)] flex items-center justify-center text-2xl shadow-sm mb-2 relative group-hover:scale-105 transition-all duration-300 overflow-hidden">
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
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--app-bg-secondary)] flex items-center justify-center shadow-sm z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div className="w-full">
            <span className="block text-[8px] font-bold text-[var(--app-accent)] tracking-widest uppercase mb-0.5">
              Empresa Implementadora
            </span>
            <h2 className="text-xs font-black text-[var(--app-text-primary)] tracking-wide leading-tight truncate px-0.5">
              {business.restaurantName || 'LUAL GASTRO BAR'}
            </h2>
            <div className="mt-1 flex items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <Edit2 className="w-2.5 h-2.5 text-[var(--app-accent)]" />
              <span className="text-[8px] font-bold text-[var(--app-accent)] uppercase tracking-wider">Ajustes de Identidad</span>
            </div>
          </div>
        </div>

        {/* Navigation list with premium states */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl font-extrabold text-xs tracking-wide transition-all duration-200 relative ${
                  active
                    ? 'bg-[var(--app-accent)] text-[var(--sidebar-active-text,#050608)] shadow-[0_4px_16px_rgba(var(--app-accent-rgb),0.25)]'
                    : 'text-slate-400 hover:text-[var(--app-text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-[var(--sidebar-active-text,#050608)] font-black' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-[var(--sidebar-active-text,#050608)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Closing Z Panel with clear and highly secure active warnings */}
      <div className="pt-6 border-t border-[var(--app-border-color)] flex flex-col items-center">
        <button
          onClick={onCloseShift}
          className="w-full bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold text-[11px] py-3.5 rounded-xl flex items-center justify-center gap-2 tracking-wider active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          ARQUEO & CIERRE (Z)
        </button>
        <div className="mt-3.5 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
          Terminal ID: CO-MED-01
        </div>
      </div>
    </aside>
  );
}
