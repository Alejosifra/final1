import React, { useState } from 'react';
import { usePermissionsStore, LIST_OF_PERMISSIONS } from '../../stores/permissionsStore';
import { UserRole } from '../../stores/authStore';
import { Shield, Check, Lock, Info } from 'lucide-react';

export default function RolesPermissions() {
  const { rolePermissions, togglePermission } = usePermissionsStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Supervisor');

  const availableRolesList: UserRole[] = ['Supervisor', 'Cajero', 'Mesero', 'Cocina'];

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="text-[#a855f7] w-5 h-5" />
          Roles, Llaves de Acceso y Permisos (RBAC)
        </h3>
        <p className="text-[11px] text-slate-400">
          Modifica el alcance administrativo para cada rol. Los administradores principales (Admin) conservan permisos absolutos inmutables.
        </p>
      </div>

      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/5 max-w-lg">
        {availableRolesList.map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
              selectedRole === role
                ? 'bg-[#a855f7] text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-2xl p-4 flex gap-3 text-xs text-[#b87cf8] items-start">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wide">Privilegios para Rol {selectedRole}</span>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              Al marcar una casilla de verificación, el colaborador con dicho rol podrá ejecutar la acción especificada de manera directa en el POS sin requerir clave de invalidación de supervisor supervisor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIST_OF_PERMISSIONS.map((perm) => {
            const hasIt = rolePermissions[selectedRole]?.includes(perm.key);
            return (
              <div
                key={perm.key}
                onClick={() => {
                  togglePermission(selectedRole, perm.key);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 select-none ${
                  hasIt
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/45'
                    : 'bg-white/2 border-white/5 hover:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">{perm.name}</span>
                    <span className="text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400 uppercase tracking-widest font-mono-numbers">
                      {perm.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    {perm.description}
                  </p>
                </div>

                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  hasIt 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : 'border-white/20 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
