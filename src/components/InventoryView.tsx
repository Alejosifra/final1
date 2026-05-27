import React, { useState, useRef } from 'react';
import { Product } from '../types';
import * as XLSX from 'xlsx';
import { 
  FileDown, 
  FileUp, 
  FolderGit, 
  Save, 
  Trash2, 
  PlusCircle, 
  AlertCircle, 
  Edit, 
  Image as ImageIcon, 
  X, 
  Barcode, 
  Truck, 
  Scale, 
  Percent, 
  Check, 
  Eye, 
  EyeOff,
  Activity
} from 'lucide-react';
import { InventoryService } from '../services/inventoryService';
import { StorageService } from '../services/storageService';

interface InventoryViewProps {
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkUpdateProducts: (prods: Product[]) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function InventoryView({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkUpdateProducts,
  onShowToast,
}: InventoryViewProps) {
  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  // Add Product Form States
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newMin, setNewMin] = useState('');
  const [newCat, setNewCat] = useState('Platos');
  const [newTax, setNewTax] = useState('8');
  const [newBarcode, setNewBarcode] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newUnitType, setNewUnitType] = useState('Unidad');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Media states for creation form
  const [uploadingNewImg, setUploadingNewImg] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editCat, setEditCat] = useState('Platos');
  const [editTax, setEditTax] = useState('8');
  const [editBarcode, setEditBarcode] = useState('');
  const [editProvider, setEditProvider] = useState('');
  const [editUnitType, setEditUnitType] = useState('Unidad');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState('');
  
  // Media states for editing form
  const [uploadingEditImg, setUploadingEditImg] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filter Term for looking up table
  const [searchFilter, setSearchFilter] = useState('');

  // Handle image upload for New Product
  const handleNewProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingNewImg(true);
    try {
      const filename = `new-product-${Date.now()}`;
      const url = await StorageService.uploadImage(file, 'businesses/default/products', filename);
      setNewImageUrl(url);
      onShowToast('Imagen cargada y optimizada correctamente.', 'success');
    } catch (err) {
      onShowToast('Error al cargar la imagen, guardando de forma segura.', 'error');
    } finally {
      setUploadingNewImg(false);
    }
  };

  // Handle image upload for Editing Product
  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!editingProduct) return;

    setUploadingEditImg(true);
    try {
      const filename = `product-${editingProduct.id}`;
      const url = await StorageService.uploadImage(file, 'businesses/default/products', filename);
      setEditImageUrl(url);
      onShowToast('Imagen de producto actualizada.', 'success');
    } catch (err) {
      onShowToast('Error al procesar la imagen.', 'error');
    } finally {
      setUploadingEditImg(false);
    }
  };

  // Submit Creation Form
  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCost);
    const price = parseFloat(newPrice);
    const stock = parseInt(newStock);
    const min = parseInt(newMin) || 5;
    const tax = parseFloat(newTax) || 0;

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
      tax,
      barcode: newBarcode.trim() || undefined,
      provider: newProvider.trim() || undefined,
      unitType: newUnitType,
      isActive: newIsActive,
      imageUrl: newImageUrl || undefined
    });

    onShowToast(`Plato "${newName}" registrado exitosamente.`, 'success');

    // Reset Creation Fields
    setNewName('');
    setNewCost('');
    setNewPrice('');
    setNewStock('');
    setNewMin('');
    setNewCat('Platos');
    setNewTax('8');
    setNewBarcode('');
    setNewProvider('');
    setNewUnitType('Unidad');
    setNewIsActive(true);
    setNewImageUrl('');
  };

  // Open Edit Dialog Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditCost(String(p.cost));
    setEditPrice(String(p.price));
    setEditStock(String(p.stock));
    setEditMin(String(p.min));
    setEditCat(p.cat || 'Platos');
    setEditTax(String(p.tax ?? 8));
    setEditBarcode(p.barcode || '');
    setEditProvider(p.provider || '');
    setEditUnitType(p.unitType || 'Unidad');
    setEditIsActive(p.isActive !== false);
    setEditImageUrl(p.imageUrl || '');
  };

  // Save Editing Changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const cost = parseFloat(editCost);
    const price = parseFloat(editPrice);
    const stock = parseInt(editStock);
    const min = parseInt(editMin) || 5;
    const tax = parseFloat(editTax) || 0;

    if (!editName || isNaN(cost) || isNaN(price) || isNaN(stock)) {
      onShowToast('Complete la planilla con valores válidos.', 'error');
      return;
    }

    const updatedProduct: Product = {
      ...editingProduct,
      name: editName,
      cost,
      price,
      stock,
      min,
      cat: editCat,
      tax,
      barcode: editBarcode.trim() || undefined,
      provider: editProvider.trim() || undefined,
      unitType: editUnitType,
      isActive: editIsActive,
      imageUrl: editImageUrl || undefined
    };

    onUpdateProduct(updatedProduct);
    onShowToast(`Modificación de "${editName}" guardada con éxito en inventario y sincronizada.`, 'success');
    setEditingProduct(null); // Close modal
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
          const importedProducts: Product[] = rows.map((r, i) => ({
            id: Number(r.id) || Date.now() + i,
            name: String(r.name || r.nombre || 'Sin nombre'),
            cost: Number(r.cost || r.costo || 0),
            price: Number(r.price || r.precio || r.venta || 0),
            stock: Number(r.stock || r.cantidad || 0),
            min: Number(r.min || r.minimo || 5),
            cat: String(r.cat || r.categoria || 'Platos'),
            tax: Number(r.tax) || 8,
            barcode: r.barcode ? String(r.barcode) : undefined,
            provider: r.provider ? String(r.provider) : undefined,
            unitType: r.unitType ? String(r.unitType) : 'Unidad',
            isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
            imageUrl: r.imageUrl ? String(r.imageUrl) : undefined
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

  // Filter products list matching search option
  const listProducts = products.filter(p => {
    const term = searchFilter.toLowerCase();
    const matchName = p.name.toLowerCase().includes(term);
    const matchCat = (p.cat || '').toLowerCase().includes(term);
    const matchBarcode = (p.barcode || '').toLowerCase().includes(term);
    const matchProvider = (p.provider || '').toLowerCase().includes(term);
    return matchName || matchCat || matchBarcode || matchProvider;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Upper Grid Layout: Action Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Bulk Sheets Management Card */}
        <div className="xl:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
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

        {/* Create Custom Product Form */}
        <div className="xl:col-span-3 glass-panel rounded-3xl p-6 border border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
            <PlusCircle className="text-[#00f2ff] w-5 h-5 hover:scale-110 duration-200" />
            Nuevo Producto / Plato
          </h3>

          <form onSubmit={handleSubmitNew} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* General Info */}
            <div className="space-y-3 md:col-span-2">
              <input
                type="text"
                placeholder="Nombre del Plato / Bebida (Ej. Hamburguesa Lual)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Costo base ($)"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Precio Venta ($)"
                  className="w-full bg-white/5 border border-[#00f2ff]/20 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="w-full bg-[#050608] border border-white/10 text-slate-300 font-bold rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                >
                  <option value="Platos">🍲 Platos / Fuertes</option>
                  <option value="Bebidas">🍸 Bebidas y Cocteles</option>
                  <option value="Entradas">🍿 Acompañantes / Entradas</option>
                  <option value="Postres">🧁 Pasteles / Postres</option>
                </select>
                <select
                  className="w-full bg-[#050608] border border-white/10 text-slate-300 font-bold rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newUnitType}
                  onChange={(e) => setNewUnitType(e.target.value)}
                >
                  <option value="Unidad">📦 Unidad</option>
                  <option value="kg">⚖️ Kilogramos (kg)</option>
                  <option value="g">⚖️ Gramos (g)</option>
                  <option value="litro">🧪 Litros (L)</option>
                  <option value="porción">🍽️ Porción</option>
                </select>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Código de Barras (Opcional)"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Proveedor / Distribuidor"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                />
              </div>

              {/* Stock and tax */}
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Stock"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Mínimo"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                  value={newMin}
                  onChange={(e) => setNewMin(e.target.value)}
                />
                <div className="relative">
                  <input
                    type="number"
                    placeholder="IVA"
                    className="w-full bg-[#00f2ff]/5 border border-[#00f2ff]/20 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff] pr-6"
                    value={newTax}
                    onChange={(e) => setNewTax(e.target.value)}
                  />
                  <span className="absolute right-3 top-3.5 text-[9px] font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Product Image Panel */}
            <div className="flex flex-col justify-between border border-white/10 rounded-2xl bg-[#00f2ff]/5 p-3 text-center h-full min-h-[160px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                FOTO DE PRODUCTO
              </span>
              
              {newImageUrl ? (
                <div className="relative group w-full h-28 rounded-xl overflow-hidden bg-slate-950 border border-white/10">
                  <img src={newImageUrl} alt="Plato Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    className="absolute inset-0 bg-red-900/80 text-white font-black opacity-0 group-hover:opacity-100 duration-200 text-xs flex items-center justify-center uppercase tracking-wider"
                  >
                    Quitar Foto
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => newFileInputRef.current?.click()}
                  className="border border-dashed border-white/25 rounded-xl cursor-pointer py-6 px-2 flex flex-col items-center justify-center hover:bg-white/5 transition-all text-slate-400"
                >
                  <ImageIcon className="w-8 h-8 text-[#00f2ff] opacity-60 mb-1" />
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    {uploadingNewImg ? 'Subiendo...' : 'Subir Foto'}
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1">JPEG/PNG Max 300px</span>
                </div>
              )}
              <input type="file" ref={newFileInputRef} accept="image/*" className="hidden" onChange={handleNewProductImageUpload} />

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Estado:</span>
                <button
                  type="button"
                  onClick={() => setNewIsActive(!newIsActive)}
                  className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all border ${
                    newIsActive 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                  }`}
                >
                  {newIsActive ? 'Habilitado' : 'De baja'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="md:col-span-3 btn-active cursor-pointer accent-glow hover:brightness-110 text-white font-black uppercase tracking-wider rounded-2xl py-3.5 text-xs flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
            >
              <Save className="w-4.5 h-4.5" />
              REGISTRAR EN CATÁLOGO POS
            </button>
          </form>
        </div>
      </div>

      {/* Main Inventory Board Table */}
      <div className="glass-panel rounded-[32px] p-6 shadow-xl border-white/10 space-y-4">
        {/* Table Filters header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Tablero de Productos e Inventarios
            </h3>
            <p className="text-[10px] text-slate-400">Catálogo completo de platos, bebidas y provisiones.</p>
          </div>
          <input
            type="text"
            placeholder="Buscar por Nombre, Categoría, Barcode, Proveedor..."
            className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-xs px-4 py-2.5 w-72 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/15 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="pb-4">Descripción</th>
                <th className="pb-4">Categoría</th>
                <th className="pb-4">Código / Barcode</th>
                <th className="pb-4">Precio Costo</th>
                <th className="pb-4">Precio Venta</th>
                <th className="pb-4 font-center">Utilidad / Margen</th>
                <th className="pb-4">Existencia</th>
                <th className="pb-4">Mesa POS</th>
                <th className="pb-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                listProducts.map((p) => {
                  const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                  const belowMin = p.stock <= p.min;

                  return (
                    <tr key={p.id} className={`hover:bg-white/5 transition-all ${p.isActive === false ? 'opacity-40' : ''}`}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt="Plato" 
                              className="w-10 h-10 rounded-xl object-cover border border-white/10" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 text-sm">
                              🍲
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-bold text-white uppercase tracking-wide block">{p.name}</span>
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase flex items-center gap-1 mt-0.5">
                              <Scale className="w-3 h-3 text-slate-400" /> Medida: {p.unitType || 'Unidad'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-[10px] font-bold text-[#00f2ff] uppercase tracking-widest">
                        {p.cat || 'Platos'}
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-400">
                        {p.barcode ? (
                          <span className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 w-max">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" /> {p.barcode}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
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
                          {belowMin && <AlertCircle className="w-3.5 h-3.5 animate-pulse" />}
                          {p.stock} {p.unitType || 'UNID'} • {InventoryService.getStockStatusTag(p.stock, p.min).label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase border ${
                          p.isActive !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {p.isActive !== false ? 'Activo' : 'De baja'}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 text-[#00f2ff] bg-[#00f2ff]/10 hover:bg-[#00f2ff] hover:text-black rounded-xl transition-all border border-transparent hover:border-[#00f2ff]/30 outline-none"
                            title="Editar propiedades del producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar permanentemente "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                                onShowToast('Producto eliminado permanentemente de la base de datos.', 'info');
                              }
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-500/20 hover:text-white rounded-xl transition-all border border-transparent hover:border-rose-500/30 outline-none"
                            title="Eliminar producto por completo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Full Support Product Editor */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#050608] glass-panel border border-[#00f2ff]/30 rounded-[32px] p-6 w-full max-w-2xl text-white shadow-2xl animate-scale-up space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Edit className="text-[#00f2ff] w-5 h-5" />
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                    Editar Ficha del Plato
                  </h4>
                  <p className="text-[10px] text-slate-400">ID Referencia: {editingProduct.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Product Info left block */}
              <div className="md:col-span-2 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Nombre del Producto / Bebida
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Costo Base ($)
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-[#00f2ff] uppercase tracking-widest block">
                      Precio de Venta ($)
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white/5 border border-[#00f2ff]/35 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Categoría del Menú
                    </label>
                    <select
                      className="w-full bg-[#050608] border border-white/10 text-slate-300 font-bold rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                    >
                      <option value="Platos">🍲 Platos / Fuertes</option>
                      <option value="Bebidas">🍸 Bebidas y Cocteles</option>
                      <option value="Entradas">🍿 Acompañantes / Entradas</option>
                      <option value="Postres">🧁 Pasteles / Postres</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Unidad de Medida
                    </label>
                    <select
                      className="w-full bg-[#050608] border border-white/10 text-slate-300 font-bold rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editUnitType}
                      onChange={(e) => setEditUnitType(e.target.value)}
                    >
                      <option value="Unidad">📦 Unidad</option>
                      <option value="kg">⚖️ Kilogramos (kg)</option>
                      <option value="g">⚖️ Gramos (g)</option>
                      <option value="litro">🧪 Litros (L)</option>
                      <option value="porción">🍽️ Porción</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                      <Barcode className="w-3 h-3" /> Código de Barras
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Distribuidor
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editProvider}
                      onChange={(e) => setEditProvider(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Mínimo Alerta
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff]"
                      value={editMin}
                      onChange={(e) => setEditMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-[#00f2ff] uppercase tracking-widest block flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Impuesto IVA
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full bg-[#00f2ff]/5 border border-[#00f2ff]/30 text-white rounded-xl text-xs px-3.5 py-3 outline-none focus:border-[#00f2ff] pr-6"
                        value={editTax}
                        onChange={(e) => setEditTax(e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-[9px] font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Media Column right block */}
              <div className="space-y-4 flex flex-col justify-between border border-white/10 rounded-2xl bg-white/5 p-4 text-center">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Logo / Portada del Plato
                  </span>
                  
                  {editImageUrl ? (
                    <div className="relative group w-full h-36 rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
                      <img src={editImageUrl} alt="Plato Actual Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="absolute inset-0 bg-rose-950/90 text-white font-black opacity-0 group-hover:opacity-100 duration-200 text-xs flex items-center justify-center uppercase tracking-wider"
                      >
                        Remover Foto
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => editFileInputRef.current?.click()}
                      className="border border-dashed border-[#00f2ff]/20 bg-[#00f2ff]/5 rounded-2xl cursor-pointer py-10 px-2 flex flex-col items-center justify-center hover:bg-white/5 transition-all text-slate-400"
                    >
                      <ImageIcon className="w-10 h-10 text-[#00f2ff] opacity-80 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                        {uploadingEditImg ? 'Cargando...' : 'Cambiar Imagen'}
                      </span>
                      <span className="text-[8px] text-slate-500 mt-1">Soporta JPG o PNG</span>
                    </div>
                  )}
                  <input type="file" ref={editFileInputRef} accept="image/*" className="hidden" onChange={handleEditProductImageUpload} />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Visibilidad POS:</span>
                    <button
                      type="button"
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1 ${
                        editIsActive 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                      }`}
                    >
                      {editIsActive ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Habilitado
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Inactivo / Baja
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[9px] text-slate-500 leading-normal text-left">
                    * Al desactivar el plato, se conservarán todas las órdenes históricas para efectos contables pero no aparecerá en el menú del terminal táctil.
                  </p>
                </div>
              </div>

              {/* Dialog Footer Actions row */}
              <div className="md:col-span-3 flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all outline-none border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#00f2ff] hover:bg-[#00d6e0] text-[#050608] font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all outline-none"
                >
                  Guardar Cambios permanentemente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
