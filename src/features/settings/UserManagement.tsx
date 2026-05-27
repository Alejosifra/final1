import React, { useState, useEffect } from 'react';
import { UsersService, ExtendedUser } from '../../services/usersService';
import { UserRole } from '../../stores/authStore';
import { usePermissionsStore, LIST_OF_PERMISSIONS } from '../../stores/permissionsStore';
import { Plus, User, Check, X, Shield, RefreshCw, Key, ToggleLeft, ToggleRight, Edit2, Copy, Trash2, KeyRound, AlertTriangle } from 'lucide-react';

interface UserManagementProps {
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function UserManagement({ onShowToast }: UserManagementProps) {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'permissions'>('employees');
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  // User fields
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Mesero');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('🏃');
  const [isActive, setIsActive] = useState(true);

  // Dynamic Custom Roles
  const { rolePermissions, togglePermission } = usePermissionsStore();
  const [customRoles, setCustomRoles] = useState<string[]>(['Supervisor', 'Cajero', 'Mesero', 'Cocina', 'Bartender', 'Delivery', 'Manager']);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string>('Supervisor');

  useEffect(() => {
    reloadUsers();
    // Load custom roles from local storage if available
    const savedRoles = localStorage.getItem('lual_custom_available_roles');
    if (savedRoles) {
      setCustomRoles(JSON.parse(savedRoles));
    }
  }, []);

  const reloadUsers = () => {
    setUsers(UsersService.getUsers());
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !username || !email) {
      onShowToast('Por favor diligencie todos los campos obligatorios.', 'error');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        UsersService.updateUser(editingUser.id, {
          fullname,
          username,
          email,
          role,
          pin: pin || '0000',
          avatar,
          isActive
        });
        onShowToast(`Colaborador ${fullname} actualizado con éxito.`, 'success');
      } else {
        // Create user
        await UsersService.createUser({
          email,
          fullname,
          role,
          avatar,
          username,
          isActive: true,
          pin: pin || '0000'
        });
        onShowToast(`Usuario ${fullname} registrado correctamente en el sistema.`, 'success');
      }
      resetForm();
      reloadUsers();
    } catch (err) {
      onShowToast('Error al guardar los cambios del colaborador.', 'error');
    }
  };

  const handleEditClick = (u: ExtendedUser) => {
    setEditingUser(u);
    setFullname(u.fullname);
    setUsername(u.username);
    setEmail(u.email);
    setRole(u.role);
    setPin(u.pin);
    setAvatar(u.avatar);
    setIsActive(u.isActive);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    try {
      await UsersService.deleteUser(id);
      onShowToast(`Colaborador "${name}" eliminado permanentemente de la base de datos y sincronizado con Firebase.`, 'success');
      reloadUsers();
      if (editingUser?.id === id) {
        resetForm();
      }
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      onShowToast('Ocurrió un error al remover al colaborador.', 'error');
    }
  };

  const resetForm = () => {
    setFullname('');
    setUsername('');
    setEmail('');
    setRole('Mesero');
    setPin('');
    setAvatar('🏃');
    setIsActive(true);
    setEditingUser(null);
    setShowUserForm(false);
  };

  const handleToggleState = (id: string, name: string) => {
    const nextState = UsersService.toggleStatus(id);
    onShowToast(`Usuario ${name} ahora está ${nextState ? 'Activo' : 'Desactivado'}`, 'info');
    reloadUsers();
  };

  const handleAddRole = () => {
    if (!newRoleName) {
      onShowToast('Ingresa un nombre válido para el nuevo rol de permisos.', 'error');
      return;
    }
    const sanitized = newRoleName.trim();
    if (customRoles.includes(sanitized)) {
      onShowToast('Ese rol ya se encuentra registrado.', 'error');
      return;
    }

    const updatedRoles = [...customRoles, sanitized];
    setCustomRoles(updatedRoles);
    localStorage.setItem('lual_custom_available_roles', JSON.stringify(updatedRoles));
    setSelectedRoleForPerms(sanitized);
    setNewRoleName('');
    onShowToast(`Rol de permisos "${sanitized}" creado con éxito.`, 'success');
  };

  const handleCloneRole = (sourceRole: string) => {
    const cloneName = `${sourceRole} Copia`;
    if (customRoles.includes(cloneName)) {
      onShowToast('Ya existe una copia del rol seleccionado.', 'error');
      return;
    }

    // Add role
    const updatedRoles = [...customRoles, cloneName];
    setCustomRoles(updatedRoles);
    localStorage.setItem('lual_custom_available_roles', JSON.stringify(updatedRoles));

    // Copy permissions in local storage
    const currentPermissions = rolePermissions[sourceRole as UserRole] || [];
    const storedPermissions = localStorage.getItem('lual_role_permissions');
    const fullPermissionsMap = storedPermissions ? JSON.parse(storedPermissions) : { ...rolePermissions };
    fullPermissionsMap[cloneName] = [...currentPermissions];
    localStorage.setItem('lual_role_permissions', JSON.stringify(fullPermissionsMap));

    // Reload store if needed or prompt success
    onShowToast(`Rol "${sourceRole}" clonado correctamente como "${cloneName}".`, 'success');
    window.location.reload(); // Force full store reload for dynamic bindings
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Sub-Tab Navigator to divide layout beautifully and clear spacing */}
      <div className="flex border-b border-white/10 gap-2 pb-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${
            activeSubTab === 'employees'
              ? 'bg-cyan-500/10 border border-cyan-500/25 text-[#00f2ff]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <User className="w-4 h-4" />
          Lista de Colaboradores ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${
            activeSubTab === 'permissions'
              ? 'bg-purple-500/10 border border-purple-500/25 text-[#c084fc]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Shield className="w-4 h-4" />
          Roles Dinámicos y Permisos
        </button>
      </div>

      {/* RENDER EMPLOYEE LIST TAB */}
      {activeSubTab === 'employees' && (
        <div className={`grid grid-cols-1 ${showUserForm ? 'xl:grid-cols-3' : 'grid-cols-1'} gap-8 transition-all duration-300`}>
          
          {/* Main List Section */}
          <div className={`${showUserForm ? 'xl:col-span-2' : 'col-span-1'} space-y-6`}>
            <div className="flex items-center justify-between bg-slate-900/40 p-5 rounded-[24px] border border-white/5">
              <div>
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">Directorio de Personal</h3>
                <p className="text-[11px] text-slate-400 mt-1">Gestión de accesos, credenciales, estados operativos y desvinculaciones seguras.</p>
              </div>
              <button
                onClick={() => {
                  if (showUserForm) resetForm();
                  else setShowUserForm(true);
                }}
                className={`px-4 py-2.5 rounded-xl font-bold border text-xs uppercase tracking-wide flex items-center gap-2 transition-all active:scale-95 ${
                  showUserForm
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                {showUserForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 text-[#00f2ff]" />}
                {showUserForm ? 'Cerrar Panel' : 'Agregar Colaborador'}
              </button>
            </div>

            {/* Main Table Container with more spacious cell padding */}
            <div className="overflow-x-auto rounded-[24px] border border-white/5 bg-slate-950/20 backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-extrabold text-slate-400 tracking-wider bg-white/5 uppercase">
                    <th className="p-5 pl-7">Colaborador</th>
                    <th className="p-5">Usuario de Acceso</th>
                    <th className="p-5">Rol Asignado</th>
                    <th className="p-5">PIN de Autorización</th>
                    <th className="p-5">Estado Operacional</th>
                    <th className="p-5 text-center pr-7">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {users.map((u) => {
                    const isSuperAdmin = u.role === 'Admin';
                    return (
                      <tr key={u.id} className="hover:bg-white/2 transition-colors duration-150">
                        <td className="p-5 pl-7">
                          <div className="flex items-center gap-3.5">
                            <span className="text-2xl bg-slate-900 border border-white/10 w-11 h-11 rounded-xl flex items-center justify-center shadow-inner">
                              {u.avatar}
                            </span>
                            <div>
                              <span className="font-extrabold text-white text-sm block">{u.fullname}</span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 font-mono text-slate-300 text-sm">
                          {u.username}
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            u.role === 'Admin'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                              : u.role === 'Supervisor'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                              : u.role === 'Cajero'
                              ? 'bg-cyan-500/15 text-[#00f2ff] border-cyan-500/25'
                              : 'bg-slate-500/15 text-slate-400 border-slate-500/25'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {u.role}
                          </span>
                        </td>
                        <td className="p-5 font-mono text-xs text-slate-400 tracking-widest font-bold">
                          •••• {u.pin ? u.pin.slice(-2) : 'XX'}
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            u.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {u.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                          </span>
                        </td>
                        <td className="p-5 pr-7">
                          <div className="flex items-center justify-center gap-2.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditClick(u)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-[#00f2ff]/20 border border-white/10 hover:border-[#00f2ff]/30 text-white hover:text-[#00f2ff] transition-all active:scale-90"
                              title="Modificar Colaborador"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Enable/Disable Toggle */}
                            <button
                              onClick={() => handleToggleState(u.id, u.fullname)}
                              disabled={isSuperAdmin}
                              className={`text-[9px] font-black uppercase tracking-wide px-3 py-2 rounded-xl border transition-all ${
                                isSuperAdmin 
                                  ? 'text-slate-600 border-slate-800 bg-transparent cursor-not-allowed'
                                  : u.isActive
                                  ? 'text-slate-400 bg-white/5 border-white/10 hover:bg-amber-500/15 hover:text-amber-400 hover:border-amber-500/20'
                                  : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/15 hover:bg-emerald-500/25'
                              }`}
                              title={u.isActive ? 'Dar de Baja Temporal' : 'Dar de Alta'}
                            >
                              {u.isActive ? 'Suspender' : 'Activar'}
                            </button>

                            {/* CRITICAL / HIGH VISIBILITY RED DELETE ACTION */}
                            <button
                              onClick={() => setUserToDelete({ id: u.id, name: u.fullname })}
                              disabled={isSuperAdmin}
                              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                                isSuperAdmin
                                  ? 'bg-slate-900 border-slate-950 text-slate-700 cursor-not-allowed'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-lg active:scale-90'
                              }`}
                              title={isSuperAdmin ? "No se puede eliminar al Administrador raíz" : "ELIMINAR COLABORADOR DEFINITIVAMENTE"}
                            >
                              <Trash2 className="w-4 h-4 stroke-[2]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expanded / Fully Spaced Registration Form (Side component) */}
          {showUserForm && (
            <div className="col-span-1 animate-fade-in">
              <form onSubmit={handleCreateOrUpdate} className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-5 sticky top-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-xs font-black uppercase text-[#00f2ff] tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00f2ff]" />
                    {editingUser ? `Editar: ${editingUser.fullname}` : 'Nuevo Registro'}
                  </h4>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="Ej. Andrés Mendoza"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 text-xs text-white rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] focus:border-[#00f2ff] outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Usuario para Ingreso</label>
                    <input
                      type="text"
                      placeholder="Ej. andres.m"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 text-xs text-white rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] focus:border-[#00f2ff] outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Email Corporativo</label>
                    <input
                      type="email"
                      placeholder="andres@lualgastro.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 text-xs text-white rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] focus:border-[#00f2ff] outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">PIN Secreto de Caja (4-6 dígitos)</label>
                    <input
                      type="text"
                      placeholder="Clave numérica"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/10 text-xs font-mono font-black text-white rounded-xl px-4 py-3 focus:ring-1 focus:ring-[#00f2ff] focus:border-[#00f2ff] outline-none tracking-widest transition-all"
                      maxLength={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Rol de Permisos</label>
                      <select
                        value={role}
                        onChange={(e) => {
                          const r = e.target.value as UserRole;
                          setRole(r);
                          setAvatar(r === 'Admin' ? '👔' : r === 'Supervisor' ? '🕵️' : r === 'Cajero' ? '💵' : r === 'Cocina' ? '🍳' : '🏃');
                        }}
                        className="w-full bg-slate-950/80 border border-white/10 text-xs text-white rounded-xl px-3 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none font-bold"
                      >
                        {customRoles.map((cr) => (
                          <option key={cr} value={cr}>{cr}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Emoticón Avatar</label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/10 text-xs text-white text-center rounded-xl px-3 py-3 focus:ring-1 focus:ring-[#00f2ff] outline-none font-bold"
                      />
                    </div>
                  </div>

                  {editingUser && (
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Acceso al Terminal:</span>
                      <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className="flex items-center gap-2 text-xs font-extrabold text-white"
                      >
                        {isActive ? (
                          <ToggleRight className="w-8 h-8 text-emerald-400 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-500 cursor-pointer" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-extrabold uppercase tracking-wider transition-all"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00f2ff] text-[#050608] hover:bg-[#00d6e0] text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                  >
                    {editingUser ? 'Guardar Cambios' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* RENDER DYNAMIC CUSTOM ROLES TAB WITH 100% RE-DISTRIBUTED SCREEN WIDTH */}
      {activeSubTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
          
          {/* Left panel: Create & Duplicate Roles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-[24px] bg-slate-900/40 border border-white/5 space-y-5">
              <h3 className="text-xs font-black uppercase text-[#c084fc] tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#c084fc]" />
                Grupos De Trabajo
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">Crea subdivisiones jerárquicas totalmente dinámicas y guárdalas directamente en la bases de datos locales y la nube.</p>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Nombre del Nuevo Rol</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Bartender, Delivery, Sommelier"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="flex-1 bg-slate-950/80 border border-white/10 text-xs text-white rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#c084fc]"
                  />
                  <button
                    onClick={handleAddRole}
                    className="px-4 py-2.5 bg-[#a855f7] text-white hover:bg-[#9333ea] rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all active:scale-95 shadow-md"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Helper Box */}
            <div className="p-6 rounded-[24px] bg-purple-950/10 border border-purple-500/10 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-purple-450 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-[#c084fc] uppercase tracking-wide">Privilegios Críticos</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">Considera que la asignación de accesos como "Anulación de Ordenes", "Kardex de Inventario" o "Modificación Jurídica" requerirá la verificación del PIN de Supervisor.</p>
              </div>
            </div>
          </div>

          {/* Right panel: Permissions Matrix occupying full remaining width (3/5 layout) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-5 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gestión de Acciones para:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={selectedRoleForPerms}
                      onChange={(e) => setSelectedRoleForPerms(e.target.value)}
                      className="bg-slate-950 border border-white/15 text-sm text-white rounded-xl px-3 py-2 outline-none font-extrabold text-[#c084fc]"
                    >
                      {customRoles.filter(r => r !== 'Admin').map((cr) => (
                        <option key={cr} value={cr}>{cr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Molde Base:</span>
                  <button
                    onClick={() => handleCloneRole(selectedRoleForPerms)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase text-[#00f2ff] rounded-xl tracking-wide flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicar Rol
                  </button>
                </div>
              </div>

              {/* Spacious List of Checkboxes */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {LIST_OF_PERMISSIONS.map((perm) => {
                  const keysForSelected = rolePermissions[selectedRoleForPerms as UserRole] || [];
                  const hasIt = keysForSelected.includes(perm.key);
                  
                  return (
                    <div
                      key={perm.key}
                      onClick={() => {
                        togglePermission(selectedRoleForPerms as UserRole, perm.key);
                        onShowToast(`Perfil de permisos actualizado para el rol ${selectedRoleForPerms}`, 'info');
                      }}
                      className={`p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 ${
                        hasIt
                          ? 'bg-[#a855f7]/5 border-[#a855f7]/30 hover:border-[#a855f7]/50'
                          : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-white block uppercase tracking-wide">{perm.name}</span>
                        <span className="text-[10px] text-slate-400 block leading-relaxed">{perm.description}</span>
                      </div>
                      <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                        hasIt 
                          ? 'bg-[#a855f7] border-[#8b5cf6] text-white' 
                          : 'border-white/20 text-transparent'
                      }`}>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">¿Confirmar Eliminación?</h3>
                <p className="text-[11px] text-rose-400 font-bold uppercase tracking-wider">Acción Crítica e Irreversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Está seguro de que desea eliminar permanentemente al colaborador <strong className="text-white">"{userToDelete.name}"</strong>? Esta opción eliminará su cuenta de acceso, su PIN de autorización, y guardará un registro de baja en la base de datos de auditoría.
            </p>

            <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Advertencia de Sincronización</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Este cambio se registrará inmediatamente en la cola local de sincronización y se replicará de forma permanente en Firebase Cloud.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete.id, userToDelete.name)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-900/30 transition-all active:scale-95"
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
