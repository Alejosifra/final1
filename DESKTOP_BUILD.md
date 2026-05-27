# Lual Gastro POS - Guía de Empaquetado para Windows (.exe) y Respaldo

Este documento contiene las instrucciones precisas para empaquetar tu aplicación **Lual Gastro POS** como un programa instalable nativo de Windows (`.exe`), así como el procedimiento para guardar tu proyecto y tus conversaciones.

---

## 🖥️ Opción 1: Empaquetar con Electron (Recomendado/Estándar)

Electron te permite encapsular tu aplicación web construida con React + Vite dentro de un navegador Chromium embebido como una aplicación nativa de escritorio.

### Paso 1: Instala las dependencias necesarias
Abre la terminal en la carpeta raíz de tu proyecto descargado localmente y ejecuta:
```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### Paso 2: Crea el archivo de entrada principal de Electron
Crea un archivo llamado `main.js` en la raíz de tu proyecto con el siguiente contenido:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true, // Oculta la barra de menú superior clásica
    icon: path.join(__dirname, 'dist', 'favicon.ico') // Asegúrate de tener un icono
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

### Paso 3: Configura tu `package.json`
Modifica las propiedades de tu `package.json` en local para especificar el archivo de entrada y los scripts de compilación:

1. Añade el campo `"main": "main.js"`.
2. Añade la configuración básica de `electron-builder` al final de tu `package.json`:
   ```json
   "build": {
     "appId": "com.lual.gastropos",
     "productName": "Lual Gastro POS",
     "directories": {
       "output": "dist-electron"
     },
     "files": [
       "dist/**/*",
       "main.js"
     ],
     "win": {
       "target": "nsis",
       "icon": "dist/favicon.ico"
     }
   }
   ```
3. Añade los scripts de ejecución en la sección `"scripts"`:
   ```json
   "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
   "electron:build": "npm run build && electron-builder --win"
   ```

### Paso 4: Construir el Instalador de Windows (`.exe`)
Ejecuta la herramienta de compilación:
```bash
npm run electron:build
```
Al finalizar, encontrarás el archivo instalador ejecutable (`Lual Gastro POS Setup.exe`) listo para distribuir en la nueva carpeta `dist-electron/`.

---

## ⚡ Opción 2: Empaquetar con Tauri (Súper ligero)

Tauri utiliza el lenguaje Rust y la biblioteca nativa web de Windows (WebView2). Esto genera ejecutables extremadamente pequeños (menores a 10 MB) y de excelente rendimiento.

1. Instala la CLI de Tauri localmente:
   ```bash
   npm install --save-dev @tauri-apps/cli
   ```
2. Inicializa Tauri:
   ```bash
   npx tauri init
   ```
   *Responde las preguntas de configuración:*
   - ¿Cuál es la ruta de tus recursos web? `../dist`
   - ¿Cuál es la URL de tu servidor de desarrollo? `http://localhost:3000`
3. Genera la aplicación lista de producción:
   ```bash
   npx tauri build
   ```
   Tauri generará un instalador `.msi` o `.exe` súper liviano listo para Windows.

---

## 📦 Opción 3: Instalar como Aplicación Web Progresiva (PWA)

Ya que tu aplicación está construida con React de manera muy óptima, puedes instalarla en Windows **sin empaquetar ningún código**:
1. Abre tu aplicación desde tu navegador **Google Chrome** o **Microsoft Edge**.
2. Al lado de la barra de direcciones superior, haz clic en el icono de la **computadora con una flecha hacia abajo** (Instalar aplicación) o ve al menú de tres puntos (...) y selecciona **"Instalar Lual Gastro POS"**.
3. Esto creará un acceso directo en tu escritorio e iniciará la aplicación en una ventana limpia e independiente sin marcos de navegador, comportándose al 100% como un programa nativo.

---

## 💾 ¿Cómo exportar y guardar todo tu proyecto con este Chat?

Para descargar todo el trabajo que hemos hecho con el código fuente y mantener las explicaciones a mano:

1. **Exportar el código completo**: 
   - Dirígete al botón **Export** o el menú de **Settings** (Configuración) en la esquina superior derecha del editor en la plataforma.
   - Selecciona **"Download ZIP"** para descargar todo el código de tu aplicación con los nuevos módulos de reportes y clientes listos.
   - También puedes elegir **"Export to GitHub"** para guardarlo en un repositorio privado o público con un solo clic.

2. **Respaldar este Chat**:
   - Como este documento `DESKTOP_BUILD.md` se acaba de crear y guardar directamente en la carpeta raíz de tu proyecto, **ya viene incluido de forma permanente en la descarga de tu archivo ZIP**.
   - Para conservar el historial detallado de conversaciones, puedes presionar `Ctrl + A` (o `Cmd + A`) en esta ventana de chat para copiar las conversaciones, o simplemente se guardarán automáticamente en tu panel de proyectos activos si dejas el espacio de trabajo en la nube tal como está.
