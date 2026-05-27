import React, { useState } from 'react';
import { TableState } from '../../types';
import { Layout, Plus, Trash2, Smartphone, Home, Tag, HelpCircle, Utensils } from 'lucide-react';

interface TablesSettingsProps {
  tables: Record<string, TableState>;
  onUpdateTables: (newTables: Record<string, TableState>) => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TablesSettings({ tables, onUpdateTables, onShowToast }: TablesSettingsProps) {
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<'Mesa' | 'Barra' | 'Domicilio'>('Mesa');

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      onShowToast('Por favor introduce un nombre válido.', 'error');
      return;
    }

    const formattedName = `${newTableType} ${newTableName.trim()}`;
    if (tables[formattedName]) {
      onShowToast(`La estación ${formattedName} ya existe en el sistema comercial.`, 'error');
      return;
    }

    const nextTables = {
      ...tables,
      [formattedName]: { items: [], discount: 0, startTime: null }
    };

    onUpdateTables(nextTables);
    setNewTableName('');
    onShowToast(`Mesa/Estación ${formattedName} agregada correctamente.`, 'success');
  };

  const handleDeleteTable = (key: string) => {
    if (tables[key] && tables[key].items.length > 0) {
      onShowToast(`No se puede eliminar ${key} porque tiene comandas activas sin registrar.`, 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de desactivar permanentemente la mesa ${key}?`)) return;

    const nextTables = { ...tables };
    delete nextTables[key];

    onUpdateTables(nextTables);
    onShowToast(`Estación ${key} removida con éxito.`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layout className="text-[#00f2ff] w-5 h-5" />
            Salones, Barras & Mesas Operativas
          </h3>
          <p className="text-[11px] text-slate-400">Diseña el mapa físico comercial del establecimiento gastronómico.</p>
        </div>
      </div>

      <form onSubmit={handleAddTable} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tipo de Estación</label>
          <select
            value={newTableType}
            onChange={(e) => setNewTableType(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-[#00f2ff] outline-none"
          >
            <option value="Mesa">Mesa de Salón</option>
            <option value="Barra">Barra / Barra Alta</option>
            <option value="Domicilio">Domicilios / Domicilio Digital</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Número / Identificador</label>
          <input
            type="text"
            placeholder="Ej: 10, A, VIP"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-xs text-white rounded-xl px-3 py-2.5 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#00f2ff] hover:bg-[#00d6e0] text-[#050608] font-bold text-xs py-3 rounded-xl transition-all uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Agregar Estación
        </button>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#00f2ff]">Distribución del Mapa Físico</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Object.entries(tables).map(([key, value]) => {
            const isMesa = key.startsWith('Mesa');
            const isBarra = key.startsWith('Barra');
            const isOcc = value.items.length > 0;

            return (
              <div
                key={key}
                className={`p-4 rounded-3xl border flex flex-col items-center justify-between gap-3 text-center transition-all ${
                  isOcc
                    ? 'bg-rose-500/10 border-rose-500/25'
                    : 'bg-white/5 border-white/10 hover:border-[#00f2ff]/30'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl p-1 px-1.5 bg-white/5 rounded-2xl border border-white/5 mb-2 block">
                    {isMesa ? <Utensils className="w-4 h-4 text-[#00f2ff]" /> : isBarra ? <Tag className="w-4 h-4 text-amber-400" /> : <Home className="w-4 h-4 text-[#a855f7]" />}
                  </span>
                  <span className="text-xs font-extrabold text-white uppercase tracking-tight block">{key}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded mt-1 ${isOcc ? 'bg-rose-500/25 text-rose-300' : 'bg-emerald-500/25 text-emerald-300'}`}>
                    {isOcc ? 'OCUPADA' : 'LIBRE'}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTable(key)}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/25"
                  title="Eliminar Estación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
