import { useState } from 'react';
import { DBState, TableState } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { usePermissionsStore } from '../../stores/permissionsStore';

// Components
import BusinessSettings from './BusinessSettings';
import UserManagement from './UserManagement';
import RolesPermissions from './RolesPermissions';
import PrinterSettings from './PrinterSettings';
import TablesSettings from './TablesSettings';
import BackupRestore from './BackupRestore';
import SystemReset from './SystemReset';
import SecuritySettings from './SecuritySettings';
import AuditSettings from './AuditSettings';
import ThemeSettings from './ThemeSettings';

// Icons
import { Building, Users, Shield, Printer, Columns, Database, Trash2, Key, Library, ShieldAlert, Palette } from 'lucide-react';

interface SettingsViewProps {
  dbState: DBState;
  onUpdateTables: (newTables: Record<string, TableState>) => void;
  onRestoreState: (state: DBState) => void;
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
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

type SubTabType = 'business' | 'users' | 'rbac' | 'appearance' | 'printers' | 'tables' | 'backup' | 'reset' | 'security' | 'audit';

export default function SettingsView({
  dbState,
  onUpdateTables,
  onRestoreState,
  onResetDatabaseSection,
  onShowToast
}: SettingsViewProps) {
  const { currentUser } = useAuthStore();
  const { hasPermission } = usePermissionsStore();
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('business');

  // RBAC Direct Guard check
  const isAdminOrSupervisor = currentUser.role === 'Admin' || currentUser.role === 'Supervisor';

  const subMenuItems = [
    { key: 'business' as const, label: 'Identidad Local', icon: Building, desc: 'Nombre, NIT, IVA, Propina' },
    { key: 'users' as const, label: 'Colaboradores', icon: Users, desc: 'CRUD, Pin, Contraseñas', guard: true },
    { key: 'rbac' as const, label: 'Roles y Permisos', icon: Shield, desc: 'RBAC, Privilegios del personal', guard: true },
    { key: 'appearance' as const, label: 'Apariencia', icon: Palette, desc: 'Colores, Temas, Glow, Densidad' },
    { key: 'printers' as const, label: 'Impresoras', icon: Printer, desc: 'ESC/POS, sockets, AutoPrint' },
    { key: 'tables' as const, label: 'Salón y Mesas', icon: Columns, desc: 'Añadir o remover mesas y barras' },
    { key: 'backup' as const, label: 'Copias Respaldo', icon: Database, desc: 'Exportar JSON, importar CSV' },
    { key: 'security' as const, label: 'Políticas Seguridad', icon: Key, desc: 'PIN bypass, auto-lock', guard: true },
    { key: 'audit' as const, label: 'Bitácora Histórica', icon: Library, desc: 'Sucesos, incidentes, logs', guard: true },
    { key: 'reset' as const, label: 'Purgas de Sistema', icon: Trash2, desc: 'Borrado total o parcial del core', guard: true },
  ];

  const handleSubTabSelection = (key: SubTabType, requiresGuard?: boolean) => {
    if (requiresGuard && !isAdminOrSupervisor) {
      onShowToast('Acceso denegado. Privilegios de Administrador o Supervisor requeridos.', 'error');
      return;
    }
    setActiveSubTab(key);
  };

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-6 h-full overflow-hidden">
      {/* Category Selection Sidebar */}
      <div className="w-full xl:w-72 flex-shrink-0 flex flex-col xl:h-full justify-between pr-1">
        <div className="space-y-4">
          <div className="border-b border-white/5 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00f2ff]">Categorías del SaaS</h3>
            <p className="text-[10px] text-slate-500">Módulos avanzados de administración.</p>
          </div>

          <nav className="space-y-1.5 flex flex-wrap xl:flex-col gap-1.5 xl:gap-0">
            {subMenuItems.map((item) => {
              const Icon = item.icon;
              const active = activeSubTab === item.key;
              const isLockedForRole = item.guard && !isAdminOrSupervisor;

              return (
                <button
                  key={item.key}
                  onClick={() => handleSubTabSelection(item.key, item.guard)}
                  className={`flex-1 xl:flex-none w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group border ${
                    active
                      ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.15)] font-black'
                      : isLockedForRole
                      ? 'text-slate-600 border-transparent hover:bg-rose-500/5 hover:text-rose-400 cursor-not-allowed'
                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4.5 flex-shrink-0 ${active ? 'text-[#00f2ff]' : 'text-slate-500'}`} />
                  <div className="truncate">
                    <span className="text-xs tracking-wide block">{item.label}</span>
                    <span className="text-[8px] font-bold opacity-50 block truncate pr-1">{item.desc}</span>
                  </div>
                  {isLockedForRole && (
                    <span className="absolute right-3.5 top-3.5 text-[8px] font-bold bg-rose-500/10 text-rose-400 px-1 py-0.2 rounded border border-rose-500/15">
                      LOCK
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main active module detail sheet */}
      <div className="flex-1 glass-panel border border-white/5 bg-white/2 rounded-[36px] p-6 md:p-8 overflow-y-auto h-full relative">
        {activeSubTab === 'business' && (
          <BusinessSettings onShowToast={onShowToast} />
        )}
        {activeSubTab === 'users' && (
          <UserManagement onShowToast={onShowToast} />
        )}
        {activeSubTab === 'rbac' && (
          <RolesPermissions />
        )}
        {activeSubTab === 'appearance' && (
          <ThemeSettings onShowToast={onShowToast} />
        )}
        {activeSubTab === 'printers' && (
          <PrinterSettings onShowToast={onShowToast} />
        )}
        {activeSubTab === 'tables' && (
          <TablesSettings
            tables={dbState.tables}
            onUpdateTables={onUpdateTables}
            onShowToast={onShowToast}
          />
        )}
        {activeSubTab === 'backup' && (
          <BackupRestore
            dbState={dbState}
            onRestoreState={onRestoreState}
            onShowToast={onShowToast}
          />
        )}
        {activeSubTab === 'security' && (
          <SecuritySettings onShowToast={onShowToast} />
        )}
        {activeSubTab === 'audit' && (
          <AuditSettings onShowToast={onShowToast} />
        )}
        {activeSubTab === 'reset' && (
          <SystemReset
            onResetDatabaseSection={onResetDatabaseSection}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
}
