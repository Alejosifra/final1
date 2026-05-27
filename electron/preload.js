const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printToHardware: (payload) => ipcRenderer.invoke('print-to-hardware', payload),
  getLocalStoragePath: () => ipcRenderer.invoke('get-local-storage-path'),
  onNavigateTab: (callback) => ipcRenderer.on('navigate-tab', (event, tab) => callback(tab)),
  onTestPrinters: (callback) => ipcRenderer.on('test-thermal-printers', (event) => callback())
});
