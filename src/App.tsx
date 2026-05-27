import React, { useState, useEffect, useMemo } from 'react';
import { DBState, TabType, Product, Customer, Sale, CashMovement, Shift, TableState, Abono } from './types';
import { getInitialState } from './data/initialData';
import AppSidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import ClientsView from './components/ClientsView';
import InventoryView from './components/InventoryView';
import HistoryView from './components/HistoryView';
import AuditView from './components/AuditView';
import ReportsView from './components/ReportsView';
import SettingsView from './features/settings/SettingsView';
import ProtectedRoute from './components/ProtectedRoute';
import { useTheme } from './hooks/useTheme';
import { useThemeStore } from './stores/themeStore';
import { useSettingsStore } from './stores/settingsStore';
import { Coins, LogOut, Check, AlertTriangle, ShieldCheck, Printer, X, Shield, Volume2, VolumeX, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useAuthStore, SYSTEM_USERS } from './stores/authStore';
import { EnterpriseDBService } from './services/supabaseService';
import { playChirpSound, playCashRegisterSound } from './utils/audio';
import { OfflineSyncEngine } from './services/dbQueue';
import { SettingsService } from './services/settingsService';

export default function App() {
  // Initialize customizable appearance theme variables
  useTheme();

  const { currentUser, switchUser, checkPermission } = useAuthStore();
  const { business } = useSettingsStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  // Poll sync status automatically
  useEffect(() => {
    const checkCount = () => {
      setSyncQueueCount(OfflineSyncEngine.getQueue().length);
    };
    checkCount();
    const intervalRef = setInterval(checkCount, 4000);
    return () => clearInterval(intervalRef);
  }, []);

  // Load theme configurations on mount and handle connectivity listeners
  useEffect(() => {
    useThemeStore.getState().loadFromLocal();
    useSettingsStore.getState().loadFromLocal();

    // Fetch latest cloud settings on start if online
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      SettingsService.fetchLatestSettings().then((cloudSettings) => {
        if (cloudSettings) {
          useSettingsStore.getState().updateBusiness(cloudSettings);
        }
      });
    }

    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión a internet restablecida. Sincronizando datos locales...', 'info');
      OfflineSyncEngine.syncBackground().then((res) => {
        if (res.successCount > 0) {
          showToast(`¡Sincronización completada! ${res.successCount} registros subidos con éxito.`, 'success');
        }
        setSyncQueueCount(OfflineSyncEngine.getQueue().length);
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin acceso a red. Trabajando con persistencia local segura.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-sync on startup if online
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      OfflineSyncEngine.syncBackground().then((res) => {
        if (res.successCount > 0) {
          showToast(`Sincronización automática de inicio: ${res.successCount} registros subidos.`, 'success');
        }
        setSyncQueueCount(OfflineSyncEngine.getQueue().length);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [db, setDb] = useState<DBState>(() => {
    try {
      const stored = localStorage.getItem('lual_v9_db');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.settings) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading localStorage', e);
    }
    return getInitialState();
  });

  const [activeTab, setActiveTab] = useState<TabType>('dash');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Modals visibility toggles
  const [showOpenCashModal, setShowOpenCashModal] = useState(!db.settings.isCashOpen);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [showAccountStatementModal, setShowAccountStatementModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Dialog fields states
  const [baseCashInput, setBaseCashInput] = useState('250000');
  const [editingCliId, setEditingCliId] = useState<number | null>(null);
  const [cliName, setCliName] = useState('');
  const [cliNit, setCliNit] = useState('');
  const [cliTel, setCliTel] = useState('');
  const [cliMail, setCliMail] = useState('');
  const [cliDir, setCliDir] = useState('');
  const [cliCupo, setCliCupo] = useState('500000');
  const [cliStatus, setCliStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [cliObs, setCliObs] = useState('');

  // Abonos specific states
  const [abonoCliId, setAbonoCliId] = useState<number | null>(null);
  const [abonoValInput, setAbonoValInput] = useState('');
  const [abonoObsInput, setAbonoObsInput] = useState('');

  // Account statement spectator state
  const [selectedStatementCliId, setSelectedStatementCliId] = useState<number | null>(null);

  // Cash checkout settlement fields
  const [checkoutPayMethod, setCheckoutPayMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transf' | 'Credito'>('Efectivo');
  const [checkoutCreditCliId, setCheckoutCreditCliId] = useState<number | null>(null);
  const [checkoutCashReceived, setCheckoutCashReceived] = useState('');
  const [checkoutChange, setCheckoutChange] = useState(0);

  // Supervisor lock triggers
  const SUPERVISOR_PASSWORD = 'LUAL123';

  // State-wide toast drawer notifications
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' | 'warning' | 'info' }[]>([]);

  // Clock state
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Clock tick
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('es-CO'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage on DB changes
  useEffect(() => {
    localStorage.setItem('lual_v9_db', JSON.stringify(db));
  }, [db]);

  // Ensure cash open lock screen stays active if drawer isn't open
  useEffect(() => {
    setShowOpenCashModal(!db.settings.isCashOpen);
  }, [db.settings.isCashOpen]);

  // Toast dispatch utility
  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Floor layout spot activation selection
  const handleSelectTable = (id: string | null) => {
    setActiveId(id);
  };

  // Add Item to Table
  const handleAddProductToTable = (prodId: number) => {
    if (!activeId) return;

    const prod = db.products.find((p) => p.id === prodId);
    if (!prod) return;

    if (prod.stock <= 0) {
      showToast('¡Este producto no cuenta con existencias en inventario!', 'warning');
      return;
    }

    if (soundEnabled) {
      playChirpSound();
    }

    setDb((prev) => {
      const updatedTables = { ...prev.tables };
      const tableState = updatedTables[activeId] || { items: [], discount: 0, startTime: null };

      // Initialize startTime on empty layouts
      const startTime = tableState.items.length === 0 ? new Date().toISOString() : tableState.startTime;

      // Find standard exact target matching item without kitchen notes
      const existingIdx = tableState.items.findIndex((i) => i.id === prodId && !i.note);
      let updatedItems = [...tableState.items];

      if (existingIdx > -1) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          qty: updatedItems[existingIdx].qty + 1,
        };
      } else {
        updatedItems.push({
          id: prod.id,
          name: prod.name,
          cost: prod.cost,
          price: prod.price,
          qty: 1,
          note: '',
        });
      }

      updatedTables[activeId] = {
        ...tableState,
        items: updatedItems,
        startTime,
      };

      return {
        ...prev,
        tables: updatedTables,
      };
    });
  };

  // Qty selectors trigger
  const handleUpdateQty = (itemIdx: number, delta: number) => {
    if (!activeId) return;

    setDb((prev) => {
      const updatedTables = { ...prev.tables };
      const tableState = updatedTables[activeId];
      if (!tableState) return prev;

      let updatedItems = [...tableState.items];
      const targetItem = updatedItems[itemIdx];

      if (targetItem) {
        const nextQty = targetItem.qty + delta;
        if (nextQty <= 0) {
          updatedItems.splice(itemIdx, 1);
        } else {
          updatedItems[itemIdx] = {
            ...targetItem,
            qty: nextQty,
          };
        }
      }

      const activeItemsCount = updatedItems.length;

      updatedTables[activeId] = {
        ...tableState,
        items: updatedItems,
        startTime: activeItemsCount === 0 ? null : tableState.startTime,
      };

      return {
        ...prev,
        tables: updatedTables,
      };
    });
  };

  // Note bindings trigger
  const handleAddNote = (itemIdx: number, cookingNote: string) => {
    if (!activeId) return;

    setDb((prev) => {
      const updatedTables = { ...prev.tables };
      const tableState = updatedTables[activeId];
      if (!tableState) return prev;

      const updatedItems = [...tableState.items];
      if (updatedItems[itemIdx]) {
        updatedItems[itemIdx] = {
          ...updatedItems[itemIdx],
          note: cookingNote,
        };
      }

      updatedTables[activeId] = {
        ...tableState,
        items: updatedItems,
      };

      return {
        ...prev,
        tables: updatedTables,
      };
    });
  };

  // Standard flat discounts triggered via POSView
  const handleApplyDiscount = (discountPercent: number) => {
    if (!activeId) return;

    const hasDirectPerm = currentUser.role === 'Admin' || currentUser.role === 'Supervisor';
    
    if (!hasDirectPerm) {
      const pass = prompt('Por motivos de seguridad, ingresa la clave de Supervisor para autorizar este descuento:');
      if (pass !== SUPERVISOR_PASSWORD) {
        showToast('Clave incorrecta. Autenticación fallida.', 'error');
        // Audit fail attempt
        EnterpriseDBService.addAuditLog(
          currentUser.fullname,
          currentUser.role,
          'INTENTO_DESCUENTO_FALLIDO',
          'AUTH',
          `Intento fallido de aplicar descuento del ${discountPercent}% en ${activeId}. Clave incorrecta.`
        );
        return;
      }
    }

    setDb((prev) => {
      const updatedTables = { ...prev.tables };
      updatedTables[activeId] = {
        ...updatedTables[activeId],
        discount: discountPercent,
      };
      return {
        ...prev,
        tables: updatedTables,
      };
    });

    // Logging audit trail
    EnterpriseDBService.addAuditLog(
      currentUser.fullname,
      currentUser.role,
      'APLICAR_DESCUENTO',
      'POS',
      `Descuento del ${discountPercent}% aplicado a la cuenta ${activeId} ${!hasDirectPerm ? '(Con código de anulación)' : '(Permiso de rol directo)'}`
    );

    showToast(`Descuento del ${discountPercent}% aplicado.`, 'success');
  };

  // Transfer table spot items entire dictionary
  const handleTransferTable = (targetId: string) => {
    if (!activeId) return;

    setDb((prev) => {
      const updatedTables = { ...prev.tables };
      const sourceData = updatedTables[activeId];
      const targetData = updatedTables[targetId];

      if (sourceData && targetData && targetData.items.length === 0) {
        updatedTables[targetId] = { ...sourceData };
        updatedTables[activeId] = { items: [], discount: 0, startTime: null };
      }

      return {
        ...prev,
        tables: updatedTables,
      };
    });

    setActiveId(targetId);
    showToast(`Pedido trasladado con éxito a ${targetId}.`, 'success');
  };

  // Core Open Cash register workflow
  const handleOpenCash = () => {
    const val = parseFloat(baseCashInput) || 0;
    
    if (soundEnabled) {
      playCashRegisterSound();
    }

    setDb((prev) => ({
      ...prev,
      settings: {
        isCashOpen: true,
        baseCash: val,
        shiftStart: new Date().toISOString(),
      },
      expenses: [], // Reset active shift petty cash
    }));

    EnterpriseDBService.addAuditLog(
      currentUser.fullname,
      currentUser.role,
      'APERTURA_CAJA',
      'CAJA',
      `Inicio de jornada comercial. Base inicial de caja registrada: $${val.toLocaleString('es-CO')}`
    );

    setShowOpenCashModal(false);
    showToast(`Jornada iniciada con base de ${val.toLocaleString('es-CO')}`, 'success');
  };

  // Closing Shift and generating Z reports values
  const handleCloseShift = () => {
    const confirmClose = confirm('¿Estás seguro de efectuar el Cierre de Caja Z para esta jornada?');
    if (!confirmClose) return;

    const hasDirectPerm = currentUser.role === 'Admin' || currentUser.role === 'Supervisor';
    if (!hasDirectPerm) {
      const pass = prompt('Clave de Supervisor para autorizar el cierre diario de caja Z:');
      if (pass !== SUPERVISOR_PASSWORD) {
        showToast('No autorizado. Clave incorrecta.', 'error');
        EnterpriseDBService.addAuditLog(
          currentUser.fullname,
          currentUser.role,
          'INTENTO_CIERRE_FALLIDO',
          'CAJA',
          'Intento de cierre de caja Z denegado por password incorrecto de supervisor.'
        );
        return;
      }
    }

    const start = db.settings.shiftStart;
    const shiftSales = db.history.filter((s) => !start || s.timestamp >= start);
    const grossTotal = shiftSales.reduce((sum, s) => sum + s.total, 0);
    const cashTotal = shiftSales.filter((s) => s.method === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
    const netProfit = shiftSales.reduce((sum, s) => sum + s.profit, 0);

    const activeZReport: Shift = {
      end: new Date().toISOString(),
      total: grossTotal,
      cash: cashTotal,
      profit: netProfit,
    };

    if (soundEnabled) {
      playCashRegisterSound();
    }

    setDb((prev) => ({
      ...prev,
      settings: {
        isCashOpen: false,
        baseCash: 0,
        shiftStart: null,
      },
      shifts: [activeZReport, ...prev.shifts],
    }));

    EnterpriseDBService.addAuditLog(
      currentUser.fullname,
      currentUser.role,
      'CIERRE_CAJA_Z',
      'CAJA',
      `Cierre diario completado. Total Ventas: $${grossTotal.toLocaleString('es-CO')} • Efectivo: $${cashTotal.toLocaleString('es-CO')} • Retorno Neto: $${netProfit.toLocaleString('es-CO')} ${!hasDirectPerm ? '(Autorizado por credencial)' : '(Rol supervisor directo)'}`
    );

    setActiveId(null);
    setActiveTab('dash');
    showToast('La caja se ha cerrado correctamente. ¡Buen descanso!', 'info');
  };

  // Save or edit Customer elements
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cupo = parseFloat(cliCupo) || 0;

    const compiled: Customer = {
      id: editingCliId || Date.now(),
      nombre: cliName,
      nit: cliNit,
      tel: cliTel,
      mail: cliMail,
      dir: cliDir,
      cupo,
      deuda: editingCliId ? db.clientes.find((c) => c.id === editingCliId)?.deuda || 0 : 0,
      status: cliStatus,
      obs: cliObs,
      lastBuy: editingCliId ? db.clientes.find((c) => c.id === editingCliId)?.lastBuy : null,
      fecha: editingCliId ? db.clientes.find((c) => c.id === editingCliId)?.fecha || new Date().toISOString() : new Date().toISOString(),
    };

    if (editingCliId) {
      const pass = prompt('Clave Supervisor para modificar base de cliente:');
      if (pass !== SUPERVISOR_PASSWORD) {
        showToast('Cancelado o password inválido.', 'error');
        return;
      }
      setDb((prev) => ({
        ...prev,
        clientes: prev.clientes.map((c) => (c.id === editingCliId ? compiled : c)),
      }));
      showToast('Información de cliente modificada.', 'success');
    } else {
      setDb((prev) => ({
        ...prev,
        clientes: [...prev.clientes, compiled],
      }));
      showToast('Nuevo cliente registrado.', 'success');
    }

    setShowClientModal(false);
    resetClientForm();
  };

  const resetClientForm = () => {
    setEditingCliId(null);
    setCliName('');
    setCliNit('');
    setCliTel('');
    setCliMail('');
    setCliDir('');
    setCliCupo('500000');
    setCliStatus('Activo');
    setCliObs('');
  };

  const handleOpenEditCliModal = (id: number) => {
    const cli = db.clientes.find((c) => c.id === id);
    if (!cli) return;

    setEditingCliId(cli.id);
    setCliName(cli.nombre);
    setCliNit(cli.nit);
    setCliTel(cli.tel);
    setCliMail(cli.mail || '');
    setCliDir(cli.dir || '');
    setCliCupo(String(cli.cupo));
    setCliStatus(cli.status);
    setCliObs(cli.obs || '');

    setShowClientModal(true);
  };

  const handleDeleteCli = (id: number) => {
    const pass = prompt('Ingresa clave de Supervisor para eliminar registro de cliente:');
    if (pass !== SUPERVISOR_PASSWORD) {
      showToast('Operación denegada.', 'error');
      return;
    }

    setDb((prev) => ({
      ...prev,
      clientes: prev.clientes.filter((c) => c.id !== id),
    }));
    showToast('Cliente removido de base de datos.', 'info');
  };

  // Open Abonos specific modals
  const handleOpenAbonoModal = (id: number) => {
    setAbonoCliId(id);
    setAbonoValInput('');
    setAbonoObsInput('');
    setShowAbonoModal(true);
  };

  const handleProcessAbono = () => {
    const v = parseFloat(abonoValInput);
    if (isNaN(v) || v <= 0 || !abonoCliId) {
      showToast('Por favor, ingresa un monto válido.', 'error');
      return;
    }

    const cli = db.clientes.find((c) => c.id === abonoCliId);
    if (!cli) return;

    if (v > cli.deuda) {
      showToast('El abono excede el saldo pendiente total del cliente.', 'error');
      return;
    }

    const activeAbonoObj: Abono = {
      id: Date.now(),
      cliId: cli.id,
      cliName: cli.nombre,
      val: v,
      fecha: new Date().toISOString(),
      obs: abonoObsInput.trim() || 'Abono corriente',
    };

    setDb((prev) => {
      const updatedClients = prev.clientes.map((c) => {
        if (c.id === abonoCliId) {
          return {
            ...c,
            deuda: c.deuda - v,
          };
        }
        return c;
      });

      return {
        ...prev,
        clientes: updatedClients,
        abonos: [activeAbonoObj, ...prev.abonos],
      };
    });

    setShowAbonoModal(false);
    showToast('Abono procesado con éxito. Balanza actualizada.', 'success');
  };

  // Open printed states lists
  const handleOpenAccountStatement = (id: number) => {
    setSelectedStatementCliId(id);
    setShowAccountStatementModal(true);
  };

  // Map client Product to Firestore compatible blueprint properties
  const mapProductToFirestore = (p: Product) => ({
    id: p.id,
    name: p.name,
    cost_price: p.cost,
    sale_price: p.price,
    stock_qty: p.stock,
    min_stock_qty: p.min,
    category_id: p.cat,
    imageUrl: p.imageUrl || '',
    tax: p.tax || 0,
    barcode: p.barcode || '',
    provider: p.provider || '',
    unitType: p.unitType || 'Unidad',
    isActive: p.isActive !== false,
  });

  // Adding product directly to lists (InventoryView callback)
  const handleAddProduct = (p: Omit<Product, 'id'>) => {
    const newItem: Product = {
      id: Date.now(),
      isActive: true,
      ...p,
    };
    setDb((prev) => ({
      ...prev,
      products: [...prev.products, newItem],
    }));
    OfflineSyncEngine.enqueueOp('products', 'CREATE', mapProductToFirestore(newItem), String(newItem.id));
  };

  // Updating product details (InventoryView callback)
  const handleUpdateProduct = (updated: Product) => {
    setDb((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
    }));
    OfflineSyncEngine.enqueueOp('products', 'UPDATE', mapProductToFirestore(updated), String(updated.id));
  };

  // Deleting product in core menu
  const handleDeleteProduct = (id: number) => {
    setDb((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    OfflineSyncEngine.enqueueOp('products', 'DELETE', {}, String(id));
  };

  // Overwriting products bulk list via SheetJS excel upload
  const handleBulkUpdateProducts = (allProds: Product[]) => {
    setDb((prev) => ({
      ...prev,
      products: allProds,
    }));
  };

  // Reversing completed bills history
  const handleDeleteHistory = (id: string) => {
    const pass = prompt('Ingresa la clave de Supervisor para revertir y anular esta venta:');
    if (pass !== SUPERVISOR_PASSWORD) {
      showToast('No autorizado.', 'error');
      return;
    }

    const t = db.history.find((h) => h.id === id);
    if (!t) return;

    // Optional: Return stock to inventory
    setDb((prev) => {
      const remStateProducts = prev.products.map((p) => {
        // Look up if any matching item was inverted
        const itemOnSale = t.items.find((it) => it.name === p.name);
        if (itemOnSale) {
          return {
            ...p,
            stock: p.stock + itemOnSale.qty,
          };
        }
        return p;
      });

      // Discount customer tab debt if it was ticketed to a Client Credit balance
      let remStateClientes = prev.clientes;
      if (t.method === 'Credito') {
        remStateClientes = prev.clientes.map((c) => {
          if (c.nombre === t.cliente) {
            return {
              ...c,
              deuda: Math.max(0, c.deuda - t.total),
            };
          }
          return c;
        });
      }

      return {
        ...prev,
        history: prev.history.filter((h) => h.id !== id),
        products: remStateProducts,
        clientes: remStateClientes,
      };
    });

    showToast('Venta reversada e inventarios devueltos.', 'info');
  };

  // Adding entries/exits movement sheets
  const handleAddMovement = (descStr: string, valNum: number, mType: 'Entrada' | 'Salida') => {
    setDb((prev) => {
      const activeObj: CashMovement = {
        id: Date.now(),
        desc: descStr,
        val: valNum,
        tipo: mType,
        time: new Date().toISOString(),
      };
      return {
        ...prev,
        expenses: [activeObj, ...prev.expenses],
      };
    });
  };

  // Full backup restore replacement trigger
  const handleImportBackup = (restoredDB: any) => {
    setDb((prev) => ({
      ...prev,
      ...restoredDB,
    }));
  };

  // Select billing setup checkout modal
  const handleOpenCheckoutModal = () => {
    setCheckoutPayMethod('Efectivo');
    setCheckoutCashReceived('');
    setCheckoutChange(0);

    // Filter and pick active qualified credits clients automatically
    const validClient = db.clientes.find((c) => c.status === 'Activo' && c.cupo - c.deuda > 0);
    setCheckoutCreditCliId(validClient ? validClient.id : null);

    setShowCheckoutModal(true);
  };

  // Calculate terminal change cash balances on screen input
  const calculateChange = (cashInput: string) => {
    setCheckoutCashReceived(cashInput);
    if (!activeId) return;

    const t = db.tables[activeId];
    if (!t) return;

    const subt = t.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subt * (1 - t.discount / 100);

    const received = parseFloat(cashInput) || 0;
    setCheckoutChange(Math.max(0, received - total));
  };

  // Core checkout confirm triggered on Payment Popups
  const handleConfirmCheckout = () => {
    if (!activeId) return;
    const t = db.tables[activeId];
    if (!t || t.items.length === 0) return;

    const subt = t.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subt * (1 - t.discount / 100);
    const tax = (total / 1.08) * 0.08; // Imponconsumo 8% typical

    const totalMenuCost = t.items.reduce((sum, i) => sum + i.cost * i.qty, 0);
    // Net profit = Net total without tax - Cost
    const netProfit = total / 1.08 - totalMenuCost;

    let targetClientName = 'Venta Mostrador';

    if (checkoutPayMethod === 'Credito') {
      if (!checkoutCreditCliId) {
        showToast('Debes seleccionar un cliente autorizado para fiar.', 'error');
        return;
      }

      const clientObj = db.clientes.find((c) => c.id === checkoutCreditCliId);
      if (!clientObj) return;

      const availableBuffer = clientObj.cupo - clientObj.deuda;
      if (total > availableBuffer) {
        showToast('¡El monto total de la cuenta excede el cupo disponible del cliente!', 'error');
        return;
      }

      setDb((prev) => {
        const nextClients = prev.clientes.map((c) => {
          if (c.id === checkoutCreditCliId) {
            return {
              ...c,
              deuda: c.deuda + total,
              lastBuy: new Date().toISOString(),
            };
          }
          return c;
        });
        return { ...prev, clientes: nextClients };
      });

      targetClientName = clientObj.nombre;
    }

    // Generate unique alphanumeric bill sequence
    const randomHex = Math.random().toString(36).substring(3, 8).toUpperCase();
    const invoiceId = `FAC-${randomHex}-${activeId.replace(/\s+/g, '')}`;

    const newSaleObj: Sale = {
      id: invoiceId,
      timestamp: new Date().toISOString(),
      table: activeId,
      total,
      tax,
      cost: totalMenuCost,
      profit: netProfit,
      method: checkoutPayMethod,
      cliente: targetClientName,
      items: t.items.map((it) => ({
        name: it.name,
        qty: it.qty,
        price: it.price,
      })),
    };

    // Commit changes and deduct stocks from main store index
    setDb((prev) => {
      const nextProducts = prev.products.map((p) => {
        const itemOnCart = t.items.find((cartIt) => cartIt.id === p.id);
        if (itemOnCart) {
          return {
            ...p,
            stock: Math.max(0, p.stock - itemOnCart.qty),
          };
        }
        return p;
      });

      // Clean/free active table spot
      const nextTables = { ...prev.tables };
      nextTables[activeId] = { items: [], discount: 0, startTime: null };

      return {
        ...prev,
        history: [newSaleObj, ...prev.history],
        products: nextProducts,
        tables: nextTables,
      };
    });

    if (soundEnabled) {
      playCashRegisterSound();
    }

    EnterpriseDBService.addAuditLog(
      currentUser.fullname,
      currentUser.role,
      'EMISION_FACTURA',
      'VENTA',
      `Factura ${invoiceId} cobrada con éxito. Mesa: ${activeId} • Total: $${total.toLocaleString('es-CO')} • Método: ${checkoutPayMethod} • Cliente: ${targetClientName}`
    );

    setShowCheckoutModal(false);
    setActiveId(null);
    showToast('¡Mesa cobrada y guardada en historial de caja!', 'success');
  };

  // Helper variables for statements view
  const activeStatementClient = useMemo(() => {
    if (!selectedStatementCliId) return null;
    return db.clientes.find((c) => c.id === selectedStatementCliId) || null;
  }, [selectedStatementCliId, db.clientes]);

  const activeStatementMovements = useMemo(() => {
    if (!activeStatementClient) return [];
    const clientSales = db.history.filter((s) => s.cliente === activeStatementClient.nombre);
    const clientDeposits = db.abonos.filter((a) => a.cliId === activeStatementClient.id);

    // Combine and sort chronologically DESC
    const comb = [
      ...clientSales.map((s) => ({
        date: s.timestamp,
        concept: `Consumo Cuenta ${s.table} (${s.method})`,
        amount: s.total,
        isDebit: true,
      })),
      ...clientDeposits.map((a) => ({
        date: a.fecha,
        concept: `Abono de Caja - Nota: ${a.obs}`,
        amount: a.val,
        isDebit: false,
      })),
    ];

    return comb.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeStatementClient, db.history, db.abonos]);

  const activeCheckoutSubtotal = activeId ? db.tables[activeId]?.items.reduce((sum, item) => sum + item.price * item.qty, 0) || 0 : 0;
  const activeCheckoutDiscountPercent = activeId ? db.tables[activeId]?.discount || 0 : 0;
  const activeCheckoutDiscountVal = activeCheckoutSubtotal * (activeCheckoutDiscountPercent / 100);
  const activeCheckoutTotal = activeCheckoutSubtotal - activeCheckoutDiscountVal;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg-primary)] text-[var(--app-text-secondary)] font-sans select-none">
      {/* Toast Manager Rendering Layout */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast p-4.5 rounded-2xl font-bold text-xs flex items-center gap-3.5 shadow-2xl pointer-events-auto border animate-slide-in ${
              t.type === 'success'
                ? 'bg-[#00f2ff]/15 text-[#00f2ff] border-[#00f2ff]/30 accent-glow'
                : t.type === 'error'
                ? 'bg-[#f43f5e]/15 text-rose-400 border-rose-500/20'
                : t.type === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20'
            }`}
          >
            <span>
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : '💡'}
            </span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Daily opening lock overlay screen */}
      {showOpenCashModal && (
        <div className="fixed inset-0 z-40 bg-[#050608] flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-[36px] w-full max-w-md text-center shadow-2xl accent-glow-strong">
            <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-1 neon-text-glow font-sans">
              LUAL <span className="text-[#00f2ff]">GASTRO</span>
            </h1>
            <p className="text-[10px] font-extrabold text-[#00f2ff]/70 tracking-widest uppercase mb-8">
              Apertura de Terminal POS-0048
            </p>

            <div className="text-left mb-6">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2 px-1">
                BASE INICIAL DE EFECTIVO ($ COP)
              </label>
              <input
                type="number"
                placeholder="0"
                className="w-full bg-white/5 text-white border border-white/10 text-3xl font-extrabold text-center py-5 rounded-2xl focus:border-[#00f2ff] focus:ring-0 outline-none select-all font-mono-numbers"
                value={baseCashInput}
                onChange={(e) => setBaseCashInput(e.target.value)}
              />
            </div>

            <button
              onClick={handleOpenCash}
              className="w-full btn-active py-4.5 rounded-2xl text-sm tracking-wide shadow-lg hover:brightness-110 active:scale-95 transition-all outline-none"
            >
              ABRIR REGISTRO DIARIO
            </button>
          </div>
        </div>
      )}

      {/* Lateral navigation panel */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // Auto select first table if moving onto POS without item active
          if (tab === 'pos' && !activeId) {
            setActiveId('Mesa 1');
          }
        }}
        onCloseShift={handleCloseShift}
      />

      {/* Main core workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-[90px] px-10 flex items-center justify-between glass-panel border-t-0 border-l-0 border-r-0 flex-shrink-0 no-print">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight capitalize">
              {activeTab === 'dash'
                ? 'Dashboard Operativo'
                : activeTab === 'pos'
                ? 'Distribución de Pedidos'
                : activeTab === 'clientes'
                ? 'Directorio de Clientes'
                : activeTab === 'reports'
                ? 'Reportes & Utilidades'
                : activeTab === 'inventory'
                ? 'Fichas de Inventario'
                : activeTab === 'history'
                ? 'Historial de Facturación'
                : 'Auditoría de Fondos'}
            </h2>
            <p className="text-[10px] font-extrabold text-[#00f2ff]/80 space-x-1.5 uppercase mt-1 tracking-wider flex items-center flex-wrap gap-1">
              {currentTime && <span className="font-mono-numbers">{currentTime}</span>}
              <span className="text-white/25 font-bold">•</span>
              <span>Operador: <strong className="text-white">{currentUser.fullname}</strong></span>
              <span className="text-white/25 font-bold">•</span>
              <span className="px-1.5 py-0.2 rounded bg-violet-500/10 text-[#a855f7] border border-violet-500/20 text-[9px] font-black">{currentUser.role}</span>
            </p>
          </div>

          <div className="text-right flex items-center gap-3">
            {/* Sync Queue Monitor badge */}
            {syncQueueCount > 0 && (
              <button
                onClick={async () => {
                  showToast(`Sincronizando ${syncQueueCount} transacciones locales...`, 'info');
                  const res = await OfflineSyncEngine.syncBackground();
                  if (res.failedCount === 0) {
                    showToast(`¡Transacciones replicadas! ${res.successCount} registros subidos con éxito.`, 'success');
                  } else {
                    showToast(`Replicadas: ${res.successCount}, pendientes: ${res.failedCount}.`, 'warning');
                  }
                  setSyncQueueCount(OfflineSyncEngine.getQueue().length);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-[10px] font-black uppercase tracking-wider animate-pulse transition-all active:scale-95"
                title="Sincronizar Cola de Transacciones Offline Ahora"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Cola Sync: {syncQueueCount}</span>
              </button>
            )}

            {/* Cloud Status Toggle */}
            {isOnline ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Firebase Cloud Sync OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                <CloudOff className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Modo Local Offline</span>
              </div>
            )}

            {/* Sounds on/off control */}
            <button 
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(soundEnabled ? 'Sonidos del POS Desactivados' : 'Sonidos de Feedback de Usuario Activados', 'info');
              }}
              className={`p-2 py-1.5 rounded-xl flex items-center justify-center border transition-all ${
                soundEnabled 
                  ? 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/20 hover:bg-[#00f2ff]/20' 
                  : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
              }`}
              title="Toggle Sonidos POS"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Enterprise Role Selector dropdown */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl">
              <Shield className="text-[#a855f7] w-3.5 h-3.5" />
              <select
                value={currentUser.role}
                onChange={(e) => {
                  const roleVal = e.target.value as any;
                  switchUser(roleVal);
                  const found = SYSTEM_USERS.find((u) => u.role === roleVal);
                  if (found) {
                    showToast(`Rol cambiado a: ${found.fullname} (${found.role})`, 'info');
                    EnterpriseDBService.addAuditLog(
                      found.fullname,
                      found.role,
                      'CAMBIO_PERFIL',
                      'AUTH',
                      `Se cambió el perfil de operador activo en la terminal al rol ${found.role}`
                    );
                    if (soundEnabled) {
                      playChirpSound();
                    }
                  }
                }}
                className="bg-transparent text-white font-black text-[10px] uppercase tracking-wider outline-none select-none cursor-pointer border-none max-w-[150px] sm:max-w-none"
              >
                {SYSTEM_USERS.map((user) => (
                  <option key={user.role} value={user.role} className="bg-[#0b0f19] text-xs font-bold text-slate-300">
                    {user.fullname} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600">|</span>
            <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider hidden sm:block">POS-0048</span>
          </div>
        </header>

        {/* View slots */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          {activeTab === 'dash' && (
            <DashboardView
              sales={db.history}
              baseCash={db.settings.baseCash}
              expenses={db.expenses}
              clientes={db.clientes}
              abonos={db.abonos}
              shiftStart={db.settings.shiftStart}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              products={db.products}
              tables={db.tables}
              activeId={activeId}
              onSelectTable={handleSelectTable}
              onAddProductToTable={handleAddProductToTable}
              onUpdateQty={handleUpdateQty}
              onAddNote={handleAddNote}
              onApplyDiscount={handleApplyDiscount}
              onTransferTable={handleTransferTable}
              onOpenCheckout={handleOpenCheckoutModal}
            />
          )}

          {activeTab === 'clientes' && (
            <ClientsView
              clientes={db.clientes}
              onOpenAddModal={() => {
                resetClientForm();
                setShowClientModal(true);
              }}
              onOpenEditModal={handleOpenEditCliModal}
              onOpenAbonoModal={handleOpenAbonoModal}
              onOpenAccountStatement={handleOpenAccountStatement}
              onDeleteCustomer={handleDeleteCli}
            />
          )}

          {activeTab === 'inventory' && (
            <ProtectedRoute permission="MANAGE_INVENTORY">
              <InventoryView
                products={db.products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onBulkUpdateProducts={handleBulkUpdateProducts}
                onShowToast={showToast}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'history' && (
            <ProtectedRoute>
              <HistoryView
                history={db.history}
                onDeleteHistory={handleDeleteHistory}
                onShowToast={showToast}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'audit' && (
            <ProtectedRoute permission="VIEW_AUDIT">
              <AuditView
                baseCash={db.settings.baseCash}
                sales={db.history}
                expenses={db.expenses}
                shifts={db.shifts}
                shiftStart={db.settings.shiftStart}
                onAddMovement={handleAddMovement}
                onImportBackup={handleImportBackup}
                onShowToast={showToast}
                fullDBState={db}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'reports' && (
            <ProtectedRoute permission="VIEW_REPORTS">
              <ReportsView
                sales={db.history}
                products={db.products}
                shifts={db.shifts}
                expenses={db.expenses}
                clientes={db.clientes}
                abonos={db.abonos}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'settings' && (
            <ProtectedRoute permission="MANAGE_SETTINGS">
              <SettingsView
                dbState={db}
                onUpdateTables={(newTables) => {
                  setDb(prev => ({ ...prev, tables: newTables }));
                }}
                onRestoreState={(restoredState) => {
                  setDb(restoredState);
                }}
                onResetDatabaseSection={(sections) => {
                  setDb(prev => {
                    let nextTables = { ...prev.tables };
                    let nextExpenses = [...prev.expenses];
                    let nextHistory = [...prev.history];
                    let nextClientes = [...prev.clientes];
                    let nextAbonos = [...prev.abonos];
                    let nextProducts = [...prev.products];
                    let nextShifts = [...prev.shifts];
                    let nextSettings = { ...prev.settings };

                    if (sections.all) {
                      // PURGA COMPLETA (Factory Reset)
                      // Reset tables structure to clear defaults
                      const freshTables: Record<string, any> = {};
                      for (let i = 1; i <= 8; i++) {
                        freshTables[`Mesa ${i}`] = { items: [], discount: 0, startTime: null };
                      }
                      for (let i = 1; i <= 4; i++) {
                        freshTables[`Barra ${i}`] = { items: [], discount: 0, startTime: null };
                      }
                      
                      return {
                        settings: {
                          isCashOpen: false,
                          baseCash: 250000,
                          shiftStart: new Date().toISOString()
                        },
                        products: [],
                        history: [],
                        shifts: [],
                        tables: freshTables,
                        expenses: [],
                        clientes: [],
                        abonos: []
                      };
                    }

                    if (sections.sales) {
                      Object.keys(nextTables).forEach(key => {
                        nextTables[key] = { items: [], discount: 0, startTime: null };
                      });
                    }

                    if (sections.tables) {
                      const freshTables: Record<string, any> = {};
                      for (let i = 1; i <= 8; i++) {
                        freshTables[`Mesa ${i}`] = { items: [], discount: 0, startTime: null };
                      }
                      for (let i = 1; i <= 4; i++) {
                        freshTables[`Barra ${i}`] = { items: [], discount: 0, startTime: null };
                      }
                      nextTables = freshTables;
                    }

                    if (sections.cash) {
                      nextExpenses = [];
                      nextSettings.isCashOpen = false;
                      nextSettings.baseCash = 250000;
                      nextShifts = [];
                    }

                    if (sections.history) {
                      nextHistory = [];
                    }

                    if (sections.customers) {
                      nextClientes = [];
                      nextAbonos = [];
                    }

                    if (sections.inventory) {
                      nextProducts = [];
                    }

                    return {
                      ...prev,
                      settings: nextSettings,
                      tables: nextTables,
                      expenses: nextExpenses,
                      history: nextHistory,
                      clientes: nextClientes,
                      abonos: nextAbonos,
                      products: nextProducts,
                      shifts: nextShifts
                    };
                  });
                }}
                onShowToast={showToast}
              />
            </ProtectedRoute>
          )}
        </div>
      </div>

      {/* overlay dialogs */}

      {/* Modal: Client Add/Edit */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/80 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl border border-slate-100 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingCliId ? '✏️ Editar Cliente' : '👤 Registrar Cliente'}
              </h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Consuelo Giraldo"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliName}
                  onChange={(e) => setCliName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">NIT o Cédula</label>
                <input
                  type="text"
                  placeholder="Ej: 52678123"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliNit}
                  onChange={(e) => setCliNit(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 3112456789"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliTel}
                  onChange={(e) => setCliTel(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej: consuelo@gmail.com"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliMail}
                  onChange={(e) => setCliMail(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Ej: Diagonal 12 # 45A - 20"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliDir}
                  onChange={(e) => setCliDir(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Cupo Crédito Autorizado ($)</label>
                <input
                  type="number"
                  placeholder="Ej: 800000"
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliCupo}
                  onChange={(e) => setCliCupo(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Estado de Crédito</label>
                <select
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                  value={cliStatus}
                  onChange={(e) => setCliStatus(e.target.value as any)}
                >
                  <option value="Activo">🟢 Activo</option>
                  <option value="Inactivo">🔴 Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Observaciones</label>
                <textarea
                  placeholder="Notas adicionales sobre el cliente o facturas..."
                  className="w-full bg-slate-50 border-slate-200 text-slate-800 text-xs py-3 rounded-2xl h-18 font-medium"
                  value={cliObs}
                  onChange={(e) => setCliObs(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="w-full border border-slate-200 text-slate-705 font-extrabold py-3.5 rounded-2xl text-xs active:scale-95 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3.5 rounded-2xl text-xs active:scale-95 shadow-md shadow-violet-600/15 transition-all"
                >
                  CONSERVAR DATOS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Abono Deposit */}
      {showAbonoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/80 backdrop-blur-md">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md border border-slate-100 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800">Saldar Abono</h3>
              <button
                onClick={() => setShowAbonoModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const target = db.clientes.find((c) => c.id === abonoCliId);
              if (!target) return null;
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CLIENTE VIP</span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{target.nombre}</h4>
                    <span className="text-xs font-bold text-rose-500 block mt-1">Deuda Pendiente: ${target.deuda.toLocaleString('es-CO')}</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">CANTIDAD EN PESOS ($)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-slate-50 border-slate-200 text-slate-800 text-2xl font-extrabold text-center py-4 rounded-xl"
                      value={abonoValInput}
                      onChange={(e) => setAbonoValInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Nota o Justificante</label>
                    <input
                      type="text"
                      placeholder="Ej: Pago de abono semanal por transferencia"
                      className="w-full bg-slate-50 border-slate-200 text-slate-700 text-xs font-semibold py-3"
                      value={abonoObsInput}
                      onChange={(e) => setAbonoObsInput(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAbonoModal(false)}
                      className="w-full border border-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="button"
                      onClick={handleProcessAbono}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3.5 rounded-xl text-xs active:scale-95 shadow-md shadow-violet-600/15 transition-all"
                    >
                      PROCESAR PAGO
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Client printed account statements */}
      {showAccountStatementModal && activeStatementClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/80 backdrop-blur-md no-print">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-3xl border border-slate-100 shadow-2xl text-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-800">📄 Estado del Cliente</h3>
              <button
                onClick={() => setShowAccountStatementModal(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Header */}
            <div id="print-sheet-area" className="space-y-6">
              <div className="text-center p-4 border-b border-slate-100 border-dashed">
                <h4 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
                  ESTADO DE CUENTA — LUAL POS
                </h4>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  NIT/Cédula: {activeStatementClient.nit} • Tel: {activeStatementClient.tel}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">Fecha de Consulta: {new Date().toLocaleString()}</p>
              </div>

              {/* Grid buffers info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cupo Autorizado</span>
                  <h5 className="text-base font-extrabold text-slate-800 mt-1">${activeStatementClient.cupo.toLocaleString('es-CO')}</h5>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Deuda Pendiente</span>
                  <h5 className="text-base font-extrabold text-rose-600 mt-1">${activeStatementClient.deuda.toLocaleString('es-CO')}</h5>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Saldo Disponible</span>
                  <h5 className="text-base font-extrabold text-emerald-600 mt-1">${(activeStatementClient.cupo - activeStatementClient.deuda).toLocaleString('es-CO')}</h5>
                </div>
              </div>

              {/* Transactions Ledger log list */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">Historial de Movimientos</h4>
                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/20">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Detalle / Concepto</th>
                        <th className="px-4 py-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeStatementMovements.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400">
                            Prueba fiar consumos a este cliente en el POS para poblar su historial.
                          </td>
                        </tr>
                      ) : (
                        activeStatementMovements.map((mov, mIdx) => (
                          <tr key={mIdx}>
                            <td className="px-4 py-3.5 text-xs text-slate-500 font-semibold">
                              {new Date(mov.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-slate-700 font-bold">{mov.concept}</td>
                            <td className={`px-4 py-3.5 text-xs font-mono font-extrabold text-right ${mov.isDebit ? 'text-red-500' : 'text-emerald-600'}`}>
                              {mov.isDebit ? '-' : '+'}${mov.amount.toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Print or Leave options */}
            <div className="flex gap-3 mt-8 pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Printer className="w-4.5 h-4.5" />
                IMPRIMIR ESTADO
              </button>
              <button
                onClick={() => setShowAccountStatementModal(false)}
                className="flex-1 bg-violet-650 bg-violet-600 text-white font-extrabold py-3.5 rounded-2xl text-xs active:scale-95 transition-all"
              >
                CERRAR LISTADO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settlement / Checkout Recaudo */}
      {showCheckoutModal && activeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1d]/85 backdrop-blur-sm no-print">
          <div className="bg-white rounded-[36px] p-8 w-full max-w-xl border border-slate-100 shadow-2xl text-slate-800 animate-scale-up">
            <h3 className="text-xl font-extrabold text-slate-800 text-center mb-5 tracking-tight">Recaudo de Cuenta - {activeId}</h3>

            {/* Ticket Simulator Preview */}
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-4.5 font-mono text-[11px] leading-relaxed text-slate-900 max-h-56 overflow-y-auto mb-6">
              <center>
                {business.logoUrl && (business.logoUrl.startsWith('http') || business.logoUrl.startsWith('data:image')) ? (
                  <img src={business.logoUrl} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1.5" />
                ) : (
                  <span className="text-xl block mb-1">{business.logoUrl || '🍽️'}</span>
                )}
                <b className="text-xs uppercase block">{business.restaurantName || 'LUAL GASTRO POS'}</b>
                <span>Fecha: {new Date().toLocaleString()}</span>
              </center>
              <hr className="my-3 border-t border-slate-400 border-dashed" />

              {db.tables[activeId]?.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {i.qty}x {i.name.substring(0, 18)}
                  </span>
                  <span>${(i.price * i.qty).toLocaleString('es-CO')}</span>
                </div>
              ))}

              <hr className="my-3 border-t border-slate-400 border-dashed" />
              <div className="flex justify-between font-bold">
                <span>SUBTOTAL:</span>
                <span>${activeCheckoutSubtotal.toLocaleString('es-CO')}</span>
              </div>
              {activeCheckoutDiscountPercent > 0 && (
                <div className="flex justify-between font-bold text-red-500">
                  <span>DESCUENTO ({activeCheckoutDiscountPercent}%):</span>
                  <span>-${activeCheckoutDiscountVal.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-500">
                <span>IMPOCONSUMO (8%):</span>
                <span>${((activeCheckoutTotal / 1.08) * 0.08).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-950 mt-1.5 pt-1.5 border-t border-slate-300">
                <span>TOTAL A COBRAR:</span>
                <span>${activeCheckoutTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Pay Methods selector tab bar */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-center">MÉTODO DE PAGO</label>
              <div className="grid grid-cols-4 gap-2 mb-4.5 select-none">
                {([
                  { key: 'Efectivo', label: '💵 Efectivo' },
                  { key: 'Tarjeta', label: '💳 Tarjeta' },
                  { key: 'Transf', label: '📱 Transf.' },
                  { key: 'Credito', label: '📒 Fiado' },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setCheckoutPayMethod(m.key)}
                    className={`text-[10px] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all border ${
                      checkoutPayMethod === m.key
                        ? 'bg-violet-600 text-white border-violet-650 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If Fiado method is active */}
            {checkoutPayMethod === 'Credito' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-5 space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Selecciona Cliente de Cartera</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  value={checkoutCreditCliId || ''}
                  onChange={(e) => setCheckoutCreditCliId(parseInt(e.target.value) || null)}
                >
                  <option value="">-- Elige un cliente --</option>
                  {db.clientes
                    .filter((c) => c.status === 'Activo' && c.cupo - c.deuda > 0)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} (Cupo disponible: ${(c.cupo - c.deuda).toLocaleString('es-CO')})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* If Cash Method option is Active */}
            {checkoutPayMethod === 'Efectivo' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl mb-5 text-emerald-950 animate-fade-in">
                <div className="flex flex-col text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1.5">EFECTIVO RECIBIDO</span>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full font-mono bg-white border border-emerald-300 text-slate-950 rounded-xl px-4 py-3 text-xl font-bold text-center select-all focus:ring-0 focus:border-emerald-500 outline-none"
                    value={checkoutCashReceived}
                    onChange={(e) => calculateChange(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-3 px-1">
                    <span className="text-xs font-bold text-emerald-800">CAMBIO A DEVOLVER:</span>
                    <span className="text-lg font-extrabold text-emerald-700">${checkoutChange.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Triggers */}
            <div className="space-y-2 pt-2 border-t">
              <button
                onClick={handleConfirmCheckout}
                className="w-full bg-violet-600 hover:bg-violet-750 hover:bg-violet-750 text-white font-extrabold py-4 rounded-2xl text-xs active:scale-95 shadow-lg shadow-violet-600/15"
              >
                PROCESAR COBRO &amp; IMPRIMIR RECIBO
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full text-slate-400 hover:text-slate-600 font-extrabold py-2.5 text-xs text-center"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
