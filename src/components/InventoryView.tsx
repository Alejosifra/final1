import React, { useState } from 'react';
import { Product } from '../types';
import * as XLSX from 'xlsx';
import { FileDown, FileUp, FolderGit, Save, Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { InventoryService } from '../services/inventoryService';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: number) => void;
  onBulkUpdateProducts: (prods: Product[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function InventoryView({
  products,
  onAddProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
  onShowToast,
}: InventoryViewProps) {
  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newCat, setNewCat] = useState('Platos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCost);
    const price = parseFloat(newPrice);
    const stock = parseInt(newStock);
    const min = parseInt(newMin) || 5;

    if (!newName || isNaN(cost) || isNaN(price) || isNaN(stock)) {
      onShowToast('Por favor, completa todos los campos con valores correctos.', 'error');
      return;
    }

    onAddProduct({
      name: newName,
      cost,
      price,
      stock,
      min,
      cat: newCat,
    });

    onShowToast('Producto registrado exitosamente.', 'success');

    // Reset Form
    setNewName('');
    setNewCost('');
    setNewPrice('');
    setNewStock('');
    setNewMin('');
    setNewCat('Platos');
  };

  // SheetJS Excel exporting
  const handleExportMenu = () => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(wb, ws, 'MENU');
      XLSX.writeFile(wb, `Lual_Menu_${new Date().toISOString().split('T')[0]}.xlsx`);
      onShowToast('Menú exportado exitosamente.', 'success');
    } catch (err) {
      onShowToast('Fallo al exportar excel.', 'error');
    }
  };

  // SheetJS Excel importing (Bulk Override Menu)
  const handleImportMenu = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        if (rows.length === 0) {
          onShowToast('El archivo excel está vacío.', 'error');
          return;
        }

        const confirmImport = confirm(
          `¿Estás seguro de importar ${rows.length} productos? Esto REEMPLAZARÁ el menú y stock actual.`
        );

        if (confirmImport) {
          // Model excel rows to schema with fallback generators
          const importedProducts: Product[] = rows.map((r, i) => ({
            id: Number(r.id) || Date.now() + i,
            name: String(r.name || r.nombre || 'Sin nombre'),
            cost: Number(r.cost || r.costo || 0),
            price: Number(r.price || r.precio || r.venta || 0),
            stock: Number(r.stock || r.cantidad || 0),
            min: Number(r.min || r.minimo || 5),
            cat: String(r.cat || r.categoria || 'Platos'),
          }));

          onBulkUpdateProducts(importedProducts);
          onShowToast(`${rows.length} Platos cargados exitosamente.`, 'success');
        }
      } catch (err) {
        onShowToast('Formato de archivo excel incorrecto.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Clean input
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper Grid Layout: Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bulk Sheets Management Card */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FolderGit className="text-[#00f2ff] w-5 h-5 accent-glow" />
              Gestión Masiva (Excel)
            </h3>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Exportar tu menú entero te permite modificar precios y cantidades en un editor externo como Excel local, y luego cargarlo para aplicar cambios de golpe de forma segura.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <button
              onClick={handleExportMenu}
              className="px-5 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
            >
              <FileDown className="w-4 h-4" />
              Exportar Menú
            </button>

            <label className="px-5 py-3.5 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 border border-[#00f2ff]/20 text-[#00f2ff] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer text-center outline-none">
              <FileUp className="w-4 h-4" />
              Importar Menú
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportMenu} />
            </label>
          </div>
        </div>

        {/* Create/Edit Custom Product Form */}
        <div className="lg:col-span-3 glass-panel rounded-3xl p-6 border border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
            <PlusCircle className="text-[#00f2ff] w-5 h-5" />
            Nuevo Producto / Plato
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Nombre del Plato / Bebida"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Costo base ($)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Precio Venta ($)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <select
                className="w-full bg-white/5 border border-white/10 text-slate-300 font-bold rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
              >
                <option value="Platos" className="bg-[#050608]">🍲 Platos</option>
                <option value="Bebidas" className="bg-[#050608]">🍸 Bebidas</option>
                <option value="Entradas" className="bg-[#050608]">🍿 Entradas</option>
                <option value="Postres" className="bg-[#050608]">🧁 Postres</option>
              </select>
            </div>
            <div>
              <input
                type="number"
                placeholder="Inventario inicial"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Stock Mínimo"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newMin}
                onChange={(e) => setNewMin(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="md:col-span-4 btn-active cursor-pointer accent-glow hover:brightness-110 text-white font-black uppercase tracking-wider rounded-2xl py-3.5 text-xs flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
            >
              <Save className="w-4.5 h-4.5" />
              GUARDAR EN INVENTARIO
            </button>
          </form>
        </div>
      </div>

      {/* Main Inventory Board Table */}
      <div className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-4">Descripción</th>
                <th className="pb-4">Categoría</th>
                <th className="pb-4">Precio Costo</th>
                <th className="pb-4">Precio Venta</th>
                <th className="pb-4">Utilidad / Margen</th>
                <th className="pb-4">Stock de Caja</th>
                <th className="pb-4 text-center">Eliminar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No hay productos configurados en el sistema.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                  const belowMin = p.stock <= p.min;

                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wide">{p.name}</span>
                      </td>
                      <td className="py-4 text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest">
                        {p.cat || 'Platos'}
                      </td>
                      <td className="py-4 text-xs font-mono-numbers text-slate-400">{fCOP(p.cost)}</td>
                      <td className="py-4 text-xs font-mono-numbers font-extrabold text-[#00f2ff]">{fCOP(p.price)}</td>
                      <td className="py-4">
                        <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                          margin < 30 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                            : 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30'
                        }`}>
                          {margin.toFixed(1)}% Margen
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase border ${
                          InventoryService.getStockStatusTag(p.stock, p.min).color
                        }`}>
                          {belowMin && <AlertCircle className="w-3.5 h-3.5" />}
                          {p.stock} UNIDADES • {InventoryService.getStockStatusTag(p.stock, p.min).label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                              onShowToast('Producto eliminado.', 'info');
                            }
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all border border-transparent hover:border-rose-500/30 outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
