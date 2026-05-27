import { useState, useMemo } from 'react';
import { Product, TableState, Customer } from '../types';
import { Utensils, Zap, Users, ShieldAlert, Award, ChevronDown, Check, Clock, Trash } from 'lucide-react';

interface POSViewProps {
  products: Product[];
  tables: Record<string, TableState>;
  activeId: string | null;
  onSelectTable: (id: string | null) => void;
  onAddProductToTable: (prodId: number) => void;
  onUpdateQty: (itemIdx: number, delta: number) => void;
  onAddNote: (itemIdx: number, note: string) => void;
  onApplyDiscount: (discountPercent: number) => void;
  onTransferTable: (targetId: string) => void;
  onOpenCheckout: () => void;
}

export default function POSView({
  products,
  tables,
  activeId,
  onSelectTable,
  onAddProductToTable,
  onUpdateQty,
  onAddNote,
  onApplyDiscount,
  onTransferTable,
  onOpenCheckout,
}: POSViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [imageStatuses, setImageStatuses] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});

  const fCOP = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-CO');

  // Categories extracted from products
  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isActive !== false).map((p) => p.cat || 'General'));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isActive === false) return false;
      const matchCat = selectedCategory === 'Todos' || p.cat === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // General counts for floor layout
  const stats = useMemo(() => {
    let freeTables = 0;
    let occupiedTables = 0;
    let freeBar = 0;
    let occupiedBar = 0;

    Object.entries(tables).forEach(([id, t]) => {
      const hasItems = t.items.length > 0;
      if (id.startsWith('Mesa')) {
        if (hasItems) occupiedTables++;
        else freeTables++;
      } else {
        if (hasItems) occupiedBar++;
        else freeBar++;
      }
    });

    return { freeTables, occupiedTables, freeBar, occupiedBar };
  }, [tables]);

  // Fetch active table details
  const activeTable = activeId ? tables[activeId] : null;

  const activeSubtotal = useMemo(() => {
    if (!activeTable) return 0;
    return activeTable.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [activeTable]);

  const discountAmount = useMemo(() => {
    if (!activeTable) return 0;
    return activeSubtotal * (activeTable.discount / 100);
  }, [activeTable, activeSubtotal]);

  const activeTotal = activeSubtotal - discountAmount;

  // Handles simple prompts for kitchen note & manual transfers
  const handleNotePrompt = (idx: number, currentNote: string) => {
    const res = prompt('Instrucciones o nota de cocina:', currentNote || '');
    if (res !== null) {
      onAddNote(idx, res);
    }
  };

  const handleTransferPrompt = () => {
    const target = prompt('Ingresa el identificador de mesa destino (ej: Mesa 5 o Barra 1):');
    if (target) {
      if (tables[target]) {
        if (tables[target].items.length > 0) {
          alert('¡La mesa destino ya se encuentra ocupada!');
        } else {
          onTransferTable(target);
        }
      } else {
        alert('Esa mesa o barra no existe en el sistema.');
      }
    }
  };

  const handleDiscountPrompt = () => {
    const dStr = prompt('Ingresa el porcentaje de descuento (0-100):');
    if (dStr !== null) {
      const d = parseFloat(dStr);
      if (!isNaN(d) && d >= 0 && d <= 100) {
        onApplyDiscount(d);
      } else {
        alert('Porcentaje de descuento inválido.');
      }
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden h-full">
      {/* Left panel containing tables map & quick menus */}
      <div className="xl:col-span-2 flex flex-col h-full gap-6 overflow-y-auto pr-1">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Utensils className="text-[#00f2ff] w-4 h-4" />
              Mesas de Salón
            </h3>
            <span className="text-[10px] bg-[#00f2ff]/10 text-[#00f2ff] px-2 py-0.5 rounded border border-[#00f2ff]/20 font-bold">{stats.freeTables} DISPONIBLES</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(tables)
              .filter(([id]) => id.startsWith('Mesa'))
              .map(([id, t]) => {
                const isOcc = t.items.length > 0;
                const isSel = activeId === id;
                const isCuentaLista = isOcc && t.discount > 0;
                const total = t.items.reduce((sum, i) => sum + i.price * i.qty, 0);
                const itemsCount = t.items.reduce((sum, i) => sum + i.qty, 0);
                let timeText = '';
                if (isOcc && t.startTime) {
                  const elapsed = Math.floor((new Date().getTime() - new Date(t.startTime).getTime()) / 60000);
                  timeText = elapsed >= 60 ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}m` : `${elapsed}m`;
                }

                return (
                  <div
                    key={id}
                    onClick={() => onSelectTable(id)}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden border ${
                      isSel
                        ? 'bg-[var(--table-selected)]/10 border-[var(--table-selected)] text-white shadow-[0_4px_16px_rgba(168,85,247,0.15)] ring-1 ring-[var(--table-selected)] scale-[1.03] z-10'
                        : isCuentaLista
                        ? 'bg-[var(--table-ready)]/10 border-[var(--table-ready)] text-amber-200 hover:border-[var(--table-ready)]/80 shadow-[0_4px_12px_rgba(245,158,11,0.15)]'
                        : isOcc
                        ? 'bg-[var(--table-occupied)]/10 border-[var(--table-occupied)] text-white hover:border-[var(--table-occupied)]/80'
                        : 'bg-[var(--table-free)]/5 border-slate-800 hover:border-[var(--table-free)]/40 hover:bg-[var(--table-free)]/10 text-slate-400'
                    }`}
                  >
                    {/* Visual state indicator dot with custom operational variables */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <span 
                        className="w-2.5 h-2.5 rounded-full animate-pulse" 
                        style={{ 
                          backgroundColor: isSel 
                            ? 'var(--table-selected)' 
                            : isCuentaLista
                            ? 'var(--table-ready)'
                            : isOcc 
                            ? 'var(--table-occupied)' 
                            : 'var(--table-free)'
                        }} 
                      />
                    </div>
                    
                    <span className="text-2xl font-black font-mono-numbers text-white mt-1">
                      {id.split(' ')[1]}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">
                      MESA
                    </span>
                    
                    <span 
                      className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md mt-2 uppercase text-center w-full"
                      style={{
                        backgroundColor: isSel
                          ? 'rgba(168, 85, 247, 0.2)'
                          : isCuentaLista
                          ? 'rgba(245, 158, 11, 0.2)'
                          : isOcc
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(16, 185, 129, 0.12)',
                        color: isSel
                          ? '#d8b4fe'
                          : isCuentaLista
                          ? '#fde047'
                          : isOcc
                          ? '#fca5a5'
                          : '#a7f3d0'
                      }}
                    >
                      {isCuentaLista ? 'PRE-CUENTA' : isOcc ? 'OCUPADA' : 'LIBRE'}
                    </span>

                    {isOcc && (
                      <div className="flex flex-col items-center mt-3 w-full border-t border-white/5 pt-2 space-y-0.5">
                        <span className="text-xs font-mono font-extrabold text-[var(--app-accent)]">
                          {fCOP(total)}
                        </span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400">
                          {timeText && <span className="font-mono-numbers text-slate-300">⏱ {timeText}</span>}
                          <span>•</span>
                          <span>{itemsCount}P</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2 mt-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Award className="text-[#00f2ff] w-4 h-4" />
              Barra del Local
            </h3>
            <span className="text-[10px] bg-[#00f2ff]/10 text-[#00f2ff] px-2 py-0.5 rounded border border-[#00f2ff]/20 font-bold">{stats.freeBar} DISPONIBLES</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(tables)
              .filter(([id]) => id.startsWith('Barra'))
              .map(([id, t]) => {
                const isOcc = t.items.length > 0;
                const isSel = activeId === id;
                const isCuentaLista = isOcc && t.discount > 0;
                const total = t.items.reduce((sum, i) => sum + i.price * i.qty, 0);
                const itemsCount = t.items.reduce((sum, i) => sum + i.qty, 0);
                let timeText = '';
                if (isOcc && t.startTime) {
                  const elapsed = Math.floor((new Date().getTime() - new Date(t.startTime).getTime()) / 60000);
                  timeText = elapsed >= 60 ? `${Math.floor(elapsed / 60)}h ${elapsed % 60}m` : `${elapsed}m`;
                }

                return (
                  <div
                    key={id}
                    onClick={() => onSelectTable(id)}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden border ${
                      isSel
                        ? 'bg-[var(--table-selected)]/10 border-[var(--table-selected)] text-white shadow-[0_4px_16px_rgba(168,85,247,0.15)] ring-1 ring-[var(--table-selected)] scale-[1.03] z-10'
                        : isCuentaLista
                        ? 'bg-[var(--table-ready)]/10 border-[var(--table-ready)] text-amber-200 hover:border-[var(--table-ready)]/80 shadow-[0_4px_12px_rgba(245,158,11,0.15)]'
                        : isOcc
                        ? 'bg-[var(--table-occupied)]/10 border-[var(--table-occupied)] text-white hover:border-[var(--table-occupied)]/80'
                        : 'bg-[var(--table-free)]/5 border-slate-800 hover:border-[var(--table-free)]/40 hover:bg-[var(--table-free)]/10 text-slate-400'
                    }`}
                  >
                    {/* Visual state indicator dot with custom operational variables */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <span 
                        className="w-2.5 h-2.5 rounded-full animate-pulse" 
                        style={{ 
                          backgroundColor: isSel 
                            ? 'var(--table-selected)' 
                            : isCuentaLista
                            ? 'var(--table-ready)'
                            : isOcc 
                            ? 'var(--table-occupied)' 
                            : 'var(--table-free)'
                        }} 
                      />
                    </div>
                    
                    <span className="text-2xl font-black font-mono-numbers text-white mt-1">
                      {id.split(' ')[1]}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 font-mono">
                      BARRA
                    </span>
                    
                    <span 
                      className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-md mt-2 uppercase text-center w-full"
                      style={{
                        backgroundColor: isSel
                          ? 'rgba(168, 85, 247, 0.2)'
                          : isCuentaLista
                          ? 'rgba(245, 158, 11, 0.2)'
                          : isOcc
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(16, 185, 129, 0.12)',
                        color: isSel
                          ? '#d8b4fe'
                          : isCuentaLista
                          ? '#fde047'
                          : isOcc
                          ? '#fca5a5'
                          : '#a7f3d0'
                      }}
                    >
                      {isCuentaLista ? 'PRE-CUENTA' : isOcc ? 'OCUPADA' : 'LIBRE'}
                    </span>

                    {isOcc && (
                      <div className="flex flex-col items-center mt-3 w-full border-t border-white/5 pt-2 space-y-0.5">
                        <span className="text-xs font-mono font-extrabold text-[var(--app-accent)]">
                          {fCOP(total)}
                        </span>
                        <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400">
                          {timeText && <span className="font-mono-numbers text-slate-300">⏱ {timeText}</span>}
                          <span>•</span>
                          <span>{itemsCount}P</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Quick Menu Picker in Left Base */}
        {activeId && (
          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="text-xs font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
                <Zap className="text-[#00f2ff] w-4 h-4 accent-glow" />
                Catálogo Rápido
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar plato..."
                  className="bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-lg text-xs px-3 py-1.5 w-44 focus:outline-none focus:border-[#00f2ff]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Horizontal Categories Row */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide mb-4 text-left">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap uppercase tracking-wider border ${
                    selectedCategory === c
                      ? 'bg-[#00f2ff] text-[#050608] border-[#00f2ff] accent-glow font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Quick-add Dishes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const lowStock = p.stock <= p.min;
                const imgStatus = imageStatuses[p.id] || 'loading';

                return (
                  <button
                    key={p.id}
                    disabled={p.stock <= 0}
                    onClick={() => onAddProductToTable(p.id)}
                    className={`p-2.5 glass-panel rounded-2xl flex flex-col text-left transition-all hover:border-[#00f2ff] hover:bg-white/5 active:scale-95 cursor-pointer relative ${
                      p.stock <= 0
                        ? 'opacity-35 cursor-not-allowed border-white/5'
                        : 'border-white/10'
                    }`}
                  >
                    {p.imageUrl ? (
                      <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-slate-950 flex items-center justify-center relative border border-white/5">
                        {imgStatus === 'loading' && (
                          <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex flex-col items-center justify-center">
                            <span className="text-[14px] animate-spin">🍲</span>
                            <span className="text-[7px] uppercase font-bold text-slate-500 mt-1">Cargando</span>
                          </div>
                        )}
                        {imgStatus === 'error' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                            <span className="text-[12px] opacity-80">🥘</span>
                            <span className="text-[8px] uppercase font-bold text-rose-500/80 mt-1">Sin Imagen</span>
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageStatuses(prev => ({ ...prev, [p.id]: 'loading' }));
                              }}
                              className="text-[7px] mt-1 text-[#00f2ff] underline uppercase font-bold tracking-wider hover:text-white"
                            >
                              Reintentar
                            </span>
                          </div>
                        ) : (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className={`w-full h-full object-cover transition-all duration-300 ${imgStatus === 'loading' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                            referrerPolicy="no-referrer"
                            onLoad={() => setImageStatuses(prev => ({ ...prev, [p.id]: 'loaded' }))}
                            onError={() => setImageStatuses(prev => ({ ...prev, [p.id]: 'error' }))}
                          />
                        )}
                        {lowStock && p.stock > 0 && (
                          <span className="absolute top-1 right-1 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Bajo
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl mb-2 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center border border-white/5 text-slate-500 relative">
                        <span className="text-[14px]">🍲</span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-600 mt-0.5">Sin Foto</span>
                        {lowStock && p.stock > 0 && (
                          <span className="absolute top-1 right-1 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Bajo
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] font-extrabold text-white line-clamp-2 mb-1 leading-snug uppercase">
                      {p.name}
                    </span>
                    <div className="flex justify-between items-center w-full mt-auto pt-1 border-t border-white/5 text-left">
                      <span className="text-[10px] font-mono-numbers font-bold text-[#00f2ff]">{fCOP(p.price)}</span>
                      <span className={`text-[8px] font-extrabold ${lowStock ? 'text-amber-400' : 'text-slate-500'}`}>
                        {p.stock} U
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right panel hosting checkout operations */}
      <div className="xl:col-span-1 glass-panel border-r-0 border-t-0 border-b-0 flex flex-col rounded-3xl overflow-hidden h-full min-h-[450px]">
        {activeId ? (
          <>
            <div className="p-6 border-b border-white/10 bg-white/5 flex-shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <span className="text-[#00f2ff]">🍽️</span> {activeId}
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-[#00f2ff]/60 mt-1">
                  {activeTable?.items.length === 0
                    ? 'Esperando selección de pedidos'
                    : `Active ocupando la cuenta`}
                </p>
              </div>
              {activeTable && activeTable.items.length > 0 && (
                <button
                  onClick={handleTransferPrompt}
                  className="bg-transparent hover:bg-white/5 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-2 rounded-xl border border-white/10 flex items-center gap-1.5 active:scale-95 transition-all outline-none"
                >
                  TRASLADAR
                </button>
              )}
            </div>

            {/* Active Order Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTable?.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="text-4xl mb-3">⚡</span>
                  <p className="text-xs uppercase tracking-widest font-extrabold text-white">Mesa libre</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                    Elige productos del menú rápido de la izquierda o indícalos en el buscador para empezar.
                  </p>
                </div>
              ) : (
                activeTable?.items.map((it, idx) => (
                  <div
                    key={`${it.id}-${idx}`}
                    onClick={() => handleNotePrompt(idx, it.note)}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/5 hover:border-[#00f2ff]/40 transition-all cursor-pointer group flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white leading-snug">{it.name}</span>
                        {it.note && (
                          <span className="block text-[10px] text-[#00f2ff] italic font-medium mt-1">
                            📋 Nota: {it.note}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs font-mono-numbers font-extrabold text-white mr-2">{fCOP(it.price * it.qty)}</span>

                        <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-black/40">
                          <button
                            onClick={() => onUpdateQty(idx, -1)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 text-sm font-extrabold active:scale-95 transition-all outline-none bg-transparent"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-mono-numbers font-extrabold text-white">{it.qty}</span>
                          <button
                            onClick={() => onUpdateQty(idx, 1)}
                            className="w-7 h-7 flex items-center justify-center text-white hover:bg-white/10 text-sm font-extrabold active:scale-95 transition-all outline-none bg-transparent"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Bottom Block */}
            {activeTable && activeTable.items.length > 0 && (
              <div className="p-6 bg-black/50 border-t border-white/10 mt-auto flex-shrink-0">
                {/* Search Menu Pick Options */}
                <div className="mb-4">
                  <label className="text-[9px] font-bold text-[#00f2ff]/60 uppercase tracking-widest block mb-1.5">
                    Añadir rápida por buscador
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        onAddProductToTable(parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 text-slate-300 font-bold px-3 py-2.5 rounded-xl text-xs outline-none focus:border-[#00f2ff]"
                  >
                    <option value="" className="bg-[#050608]">Seleccionar del Catálogo...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#050608]">
                        {p.name} ({fCOP(p.price)}) — Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 py-4 border-t border-white/5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono-numbers text-white">{fCOP(activeSubtotal)}</span>
                  </div>

                  {activeTable.discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-red-400">
                      <span>DESCUENTO ({activeTable.discount}%)</span>
                      <span className="font-mono-numbers">-{fCOP(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xl font-black text-white pt-2.5 border-t border-white/10">
                    <span>TOTAL</span>
                    <span className="text-[#00f2ff] font-mono-numbers tracking-tighter">{fCOP(activeTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDiscountPrompt}
                    className="bg-transparent hover:bg-white/5 text-white border border-white/10 text-[10px] uppercase tracking-wider font-extrabold py-3.5 rounded-2xl active:scale-95 transition-all outline-none"
                  >
                    🏷️ Descuento
                  </button>
                  <button
                    onClick={onOpenCheckout}
                    className="btn-active accent-glow hover:brightness-110 text-xs font-extrabold py-3.5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    CERRAR MESA
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 my-auto">
            <span className="text-4xl mb-4">🚪</span>
            <h4 className="text-base uppercase tracking-wider font-bold text-white">Seleccionar Mesa</h4>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Elige una mesa de salón o pilar de barra de la distribución de plantas para empezar a cargar o cobrar pedidos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
