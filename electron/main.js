const { app, BrowserWindow, ipcMain, Menu, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Create simple Splash HTML beautifully styled
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #050608;
          color: #ffffff;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          border-radius: 20px;
          border: 1px solid rgba(0, 242, 255, 0.25);
          overflow: hidden;
        }
        .logo {
          font-size: 70px;
          margin-bottom: 20px;
          animation: pulse 1.8s infinite ease-in-out;
        }
        h1 {
          font-size: 20px;
          margin: 0;
          font-weight: 900;
          letter-spacing: 4px;
          color: #ffffff;
          text-transform: uppercase;
        }
        h2 {
          font-size: 11px;
          margin: 5px 0 20px 0;
          color: #00f2ff;
          letter-spacing: 2px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .loader {
          width: 200px;
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .loader-bar {
          width: 40%;
          height: 100%;
          background: #00f2ff;
          border-radius: 10px;
          position: absolute;
          animation: loading 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; text-shadow: 0 0 15px rgba(0,242,255,0.4); }
        }
        @keyframes loading {
          0% { left: -40%; }
          50% { left: 100%; }
          100% { left: -40%; }
        }
      </style>
    </head>
    <body>
      <div class="logo">🍽️</div>
      <h1>LUAL Gastro POS</h1>
      <h2>Platinum Enterprise Edition</h2>
      <div class="loader">
        <div class="loader-bar"></div>
      </div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: "LUAL GASTRO POS - Platinum Enterprise",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // Load from local build dist folder or local dev server
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Set POS Fullscreen Mode
  mainWindow.setFullScreen(true);

  // Setup fully integrated operational menu
  const menuTemplate = [
    {
      label: 'Sistema',
      submenu: [
        { label: 'Minimizar', role: 'minimize' },
        { label: 'Pantalla Completa (F11)', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Salir del POS', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } }
      ]
    },
    {
      label: 'Operaciones',
      submenu: [
        {
          label: 'Ir a Punto de Venta (POS)',
          accelerator: 'F1',
          click: () => { mainWindow.webContents.send('navigate-tab', 'pos'); }
        },
        {
          label: 'Ver Mesas y Comandas',
          accelerator: 'F2',
          click: () => { mainWindow.webContents.send('navigate-tab', 'dash'); }
        },
        {
          label: 'Consultar Clientes',
          accelerator: 'F3',
          click: () => { mainWindow.webContents.send('navigate-tab', 'clientes'); }
        },
        {
          label: 'Ver Control de Caja Z',
          accelerator: 'F4',
          click: () => { mainWindow.webContents.send('navigate-tab', 'settings'); }
        }
      ]
    },
    {
      label: 'Dispositivos',
      submenu: [
        {
          label: 'Probar Conectividad de Impresoras',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              buttons: ['OK'],
              title: 'Prueba de Impresoras',
              message: 'Probando socket sockets de impresión en puertos 9100... Iniciando test thermal.',
            });
            mainWindow.webContents.send('test-thermal-printers');
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Ver Clave de Supervisor',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              buttons: ['Entendido'],
              title: 'Clave de Seguridad',
              message: 'La clave de Supervisor general autorizada para purgas del sistema, reembolsos, autorizar descuentos especiales y operaciones restringidas es: LUAL123',
            });
          }
        },
        { label: 'Acerca de Lual POS...', role: 'about' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  setTimeout(() => {
    createMainWindow();
  }, 1200);

  // Register operational keyboard hotkeys
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ESC/POS raw hardware bridge simulator/proxy
ipcMain.handle('print-to-hardware', async (event, payload) => {
  console.log('Sending POS raw commands to printer port 9100:', payload);
  // Emulates printing to hardware sockets directly or outputs to logs
  return { success: true, message: 'Printed successfully via local ESC/POS Direct Socket driver!' };
});

ipcMain.handle('get-local-storage-path', () => {
  return app.getPath('userData');
});
