import React, { useRef, useState } from 'react';
import { DBState } from '../../types';
import { BackupService } from '../../services/backupService';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { OfflineSyncEngine } from '../../services/dbQueue';
import { Database, FileDown, FileUp, ShieldAlert, Sparkles, BookOpen, Cloud, CloudOff, RefreshCw, UploadCloud, Shield, CheckCircle } from 'lucide-react';

interface BackupRestoreProps {
  dbState: DBState;
  onRestoreState: (state: DBState) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function BackupRestore({ dbState, onRestoreState, onShowToast }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvProductsText, setCsvProductsText] = useState('');
  const [importedStatus, setImportedStatus] = useState<string>('');

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [pendingOps, setPendingOps] = useState(() => OfflineSyncEngine.getQueue().length);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('lual_last_sync_time') || 'Sin registros en este turno');
  const [lastBackupTime, setLastBackupTime] = useState(() => localStorage.getItem('lual_last_backup_time') || 'Sin copias en la nube registradas');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Connectivity and queue status tracking
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingOps(OfflineSyncEngine.getQueue().length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      onShowToast('Sincronización cancelada: Sin acceso a internet.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await OfflineSyncEngine.syncBackground();
      const nowStr = new Date().toLocaleString();
      localStorage.setItem('lual_last_sync_time', nowStr);
      setLastSyncTime(nowStr);
      setPendingOps(OfflineSyncEngine.getQueue().length);
      
      if (res.successCount > 0) {
        onShowToast(`¡Sincronización exitosa! ${res.successCount} registros consolidados en la nube.`, 'success');
      } else {
        onShowToast('Todo el catálogo y deudas locales están plenamente sincronizados con la nube.', 'success');
      }
    } catch (err) {
      onShowToast('Ocurrió un error inesperado al despachar la cola de transacciones.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudBackup = async () => {
    if (!isOnline) {
      onShowToast('Respaldo en la nube cancelado: Se requiere internet activo para cargar copias de seguridad.', 'error');
      return;
    }
    setIsBackingUp(true);
    try {
      const activeBusinessId = localStorage.getItem('lual_active_business_id') || 'LUAL-BIZ-MEDELLIN-01';
      const timestamp = Date.now();
      const filename = `backup-${timestamp}.json`;
      const storageRef = ref(storage, `businesses/${activeBusinessId}/backups/${filename}`);
      
      // Convert dbState structure to Blob
      const serializedData = JSON.stringify(dbState, null, 2);
      const blob = new Blob([serializedData], { type: 'application/json' });
      
      await uploadBytes(storageRef, blob);
      
      const nowStr = new Date().toLocaleString();
      localStorage.setItem('lual_last_backup_time', nowStr);
      setLastBackupTime(nowStr);
      onShowToast(`Copia de respaldo histórica (${filename}) cargada exitosamente en Firebase Storage.`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast('Fallo al subir archivo de seguridad a Firebase Storage.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

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

      {/* Firebase Cloud Sync Control Panel */}
      <div className="glass-panel rounded-3xl p-6 border-[#00f2ff]/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00f2ff]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-5 mb-5">
          <div>
            <span className="text-[9px] font-black uppercase text-[#00f2ff] tracking-[0.2em] block mb-1">
              Motor Sincronizador Cloud (Offline-First Ready)
            </span>
            <h4 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
              Sincronización de Base de Datos & Respaldo en la Nube
            </h4>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/40 border border-white/5 px-4 py-2 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Estado de Red:
            </span>
            <div className="flex items-center gap-2 select-none">
              <span className="w-2.5 h-2.5 rounded-full flex relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-[#ef4444]'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-[#ef4444]'}`} />
              </span>
              <span className={`text-[10px] font-extrabold tracking-widest uppercase ${isOnline ? 'text-emerald-400' : 'text-[#ef4444]'}`}>
                {isOnline ? 'EN LÍNEA' : 'FUERA DE LÍNEA'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Cloud Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mb-6">
          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Cola de Transacciones</span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <h5 className="text-xl font-bold font-mono-numbers text-white">
                {pendingOps}
              </h5>
              <span className="text-[9px] font-medium text-slate-400"> operando</span>
            </div>
            <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
              {pendingOps > 0 ? '⚠️ Cambios pendientes de sincronía' : '✓ Base de datos al día'}
            </p>
          </div>

          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Última Sincronía</span>
            <div className="flex items-center gap-2 mt-2 font-mono-numbers">
              <span className="text-xs font-bold text-slate-300">{lastSyncTime}</span>
            </div>
            <p className="text-[8px] text-[#00f2ff]/60 mt-1 uppercase tracking-wider font-bold">Consolidación con Firestore</p>
          </div>

          <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Copia Firebase Storage</span>
            <div className="flex items-center gap-2 mt-2 font-mono-numbers">
              <span className="text-xs font-bold text-slate-300">{lastBackupTime}</span>
            </div>
            <p className="text-[8px] text-emerald-400/80 mt-1 uppercase tracking-wider font-bold">Respaldos del Kardex y Ventas</p>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex-1 px-5 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 outline-none active:scale-[0.98] ${
              isSyncing 
                ? 'bg-slate-900 text-slate-500 cursor-wait border border-white/5' 
                : 'btn-active accent-glow hover:brightness-110'
            }`}
          >
            <RefreshCw className={`w-4 h-4 text-inherit ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'FORZAR SINCRONIZACIÓN FIREBASE'}
          </button>

          <button
            onClick={handleCloudBackup}
            disabled={isBackingUp}
            className={`flex-1 px-5 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-250 outline-none active:scale-[0.98] bg-[#00f2ff]/10 hover:bg-[#00f2ff]/15 border border-[#00f2ff]/30 hover:border-[#00f2ff]/50 text-white ${
              isBackingUp ? 'cursor-wait opacity-60' : ''
            }`}
          >
            <UploadCloud className={`w-4 h-4 text-[#00f2ff] ${isBackingUp ? 'animate-bounce' : ''}`} />
            {isBackingUp ? 'Cargando Copia...' : 'SUBIR RESPALDO A STORAGE'}
          </button>
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
