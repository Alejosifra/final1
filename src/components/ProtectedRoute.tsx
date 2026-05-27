import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldCheck, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  permission?: string;
  children: React.ReactNode;
}

export default function ProtectedRoute({
  permission,
  children
}: ProtectedRouteProps) {
  const { currentUser } = useAuthStore();
  const { can } = usePermissions();

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/15 flex items-center justify-center mb-4">
          <LogIn className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-black uppercase text-slate-300 tracking-wider">Sesión No Iniciada</h3>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          Por favor, inicia sesión con tus credenciales de colaborador gastronómico para acceder a este módulo.
        </p>
      </div>
    );
  }

  if (permission && !can(permission)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/15 flex items-center justify-center mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-black uppercase text-rose-400 tracking-wider">Permiso Insuficiente</h3>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          Se requiere el permiso de tipo <code className="bg-black/35 font-mono px-1 py-0.5 rounded text-rose-300 text-[10px]">{permission}</code> para visualizar este informe o panel.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
