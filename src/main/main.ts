import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as url from "url";

const isDevelopment = process.env.NODE_ENV !== 'production'
let mainWindow: Electron.BrowserWindow;

process.env.ELECTRON_ENABLE_SECURITY_WARNINGS = 'false';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 768,
    minWidth: 1360,
    minHeight: 768,
    maxWidth: 1920,
    maxHeight: 1080,
    icon: path.join(__dirname, '../static/hades-logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: false,
    transparent: true
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://127.0.0.1:3000");
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "renderer/index.html"),
        protocol: "file:",
        slashes: true,
      })
    );
  }

  if (isDevelopment) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.webContents.on('did-finish-load', async () => {
    var title = 'Hades';
    if (isDevelopment) {
      title += ' [DEVELOPMENT]'
    }

    mainWindow.setTitle(title);
  });

  ipcMain.on('minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('maximize', (event) => {
    let isMaximized = false;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    }
    else {
      mainWindow.maximize();
      isMaximized = true;
    }

    event.sender.send('is-maximize', isMaximized);

  });

  ipcMain.on('close', () => {
    mainWindow.close();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
