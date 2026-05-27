import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGuard({
  permission,
  fallback,
  children
}: PermissionGuardProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    
    // Default visually elegant restricted message panel
    return (
      <div className="glass-panel border border-rose-500/10 bg-rose-950/5 p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">Acceso Restringido</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
            Tu perfil de usuario no posee el permiso <code className="bg-black/25 text-rose-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/5">{permission}</code> para ejecutar esta acción.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
