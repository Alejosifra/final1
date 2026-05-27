import React, { useRef, useState } from 'react';
import { DBState } from '../../types';
import { BackupService } from '../../services/backupService';
import { Database, FileDown, FileUp, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface BackupRestoreProps {
  dbState: DBState;
  onRestoreState: (state: DBState) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function BackupRestore({ dbState, onRestoreState, onShowToast }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvProductsText, setCsvProductsText] = useState('');
  const [importedStatus, setImportedStatus] = useState<string>('');

  const handleExportJSON = () => {
    const ok = BackupService.exportDatabaseToJSON(dbState);
    if (ok) {
      onShowToast('Copia de seguridad del sistema POS exportada exitosamente.', 'success');
    } else {
      onShowToast('Error al serializar el estado del POS.', 'error');
    }
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (BackupService.validateBackupJSON(parsed)) {
          onRestoreState(parsed);
          onShowToast('Base de datos restaurada correctamente.', 'success');
        } else {
          onShowToast('El esquema del archivo JSON de respaldo no es válido o está incompleto.', 'error');
        }
      } catch (err) {
        onShowToast('No se pudo decodificar el archivo de respaldo seleccionado.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvProductsText.trim()) {
      onShowToast('El texto de importación se encuentra vacío.', 'error');
      return;
    }

    try {
      const parsedItems = BackupService.parseProductCsv(csvProductsText);
      if (parsedItems.length === 0) {
        onShowToast('No se identificaron columnas válidas formateadas en CSV.', 'error');
        return;
      }

      // Add parsed items to products state
      const nextProducts = [...dbState.products];
      parsedItems.forEach((p: any) => {
        // Prevent ID collisions
        const finalId = Math.floor(10000 + Math.random() * 90000);
        nextProducts.push({
          id: finalId,
          name: p.name,
          cost: p.cost,
          price: p.price,
          stock: p.stock,
          min: p.min,
          cat: p.cat
        });
      });

      onRestoreState({
        ...dbState,
        products: nextProducts
      });

      setImportedStatus(`¡Completado! Se importaron ${parsedItems.length} nuevos platos/productos al inventario.`);
      setCsvProductsText('');
      onShowToast(`Se importaron ${parsedItems.length} referencias nuevas al catálogo comercial.`, 'success');
    } catch (err) {
      onShowToast('No se completó la importación del inventario por columnas discordantes.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="text-[#00f2ff] w-5 h-5" />
            Copia de Seguridad, Sincronización & Respaldos
          </h3>
          <p className="text-[11px] text-slate-400">Previene caídas de infraestructura exportando e importando copias locales de contingencia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Backup controls */}
        <div className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-4">
          <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Sparkles className="text-emerald-400 w-4 h-4" />
            Respaldos Tipo JSON In situ
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Genera una instantánea inmutable que contiene el inventario, clientes habituales, cartera fiada, dinero en caja, log de auditoría y todo el historial de facturas Z de la terminal gastronómica.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wide flex items-center gap-2 transition-all active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              Respaldar Base Datos (JSON)
            </button>

            <button
              onClick={handleImportJSONClick}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase tracking-wide flex items-center gap-2 transition-all active:scale-95"
            >
              <FileUp className="w-4 h-4 text-[#00f2ff]" />
              Restaurar desde Copia
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* CSV Import */}
        <form onSubmit={handleCsvImport} className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-4">
          <h4 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
            <BookOpen className="text-amber-400 w-4 h-4" />
            Importar Menú por Lotes (CSV)
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Añade nuevos platos en lote. Copie el formato exacto: <code>Nombre de Referencia, Costo base, Precio venta, Existencias iniciales, Categoría, Stock crítico</code>
          </p>
          <div className="space-y-2">
            <textarea
              value={csvProductsText}
              onChange={(e) => setCsvProductsText(e.target.value)}
              placeholder="Ej: Hamburguesa Suprema,15000,29000,50,Entradas,10"
              className="w-full h-20 bg-white/5 border border-white/10 text-xs font-mono text-slate-300 rounded-xl p-3 focus:ring-1 focus:ring-[#00f2ff] outline-none"
            />
          </div>
          {importedStatus && (
            <p className="text-[10px] text-emerald-400 font-bold">{importedStatus}</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#00f2ff] hover:bg-[#00d6e0] text-[#050608] py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <FileUp className="w-4 h-4 stroke-[3]" />
            Analizar y Cargar CSV
          </button>
        </form>
      </div>

      <div className="bg-[#ef4444]/5 border border-[#ef4444]/15 rounded-3xl p-4 flex gap-3 text-xs text-[#f87171] items-start">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wide">Peligro de Sobreescritura</span>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
            La restauración de una copia de seguridad elimina los datos actuales de la memoria del navegador. Asegúrese de realizar un respaldo local preventivo antes de importar cualquier archivo externo.
          </p>
        </div>
      </div>
    </div>
  );
}
