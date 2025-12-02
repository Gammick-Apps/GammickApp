const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
  let ses = session.defaultSession;

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    fullscreen: true,
    webPreferences: {
      webSecurity: false,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  ipcMain.on("sendPrint", (event, args) => {
    let printWindow = new BrowserWindow({ show: false });
    printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(args));
    printWindow.webContents.once('did-finish-load', () => {
      printWindow.webContents.print(
        { silent: true, printBackground: true },
        (success, errorType) => {
          mainWindow.webContents.send("receivePrint", success);
        }
      );
    });
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
});

// הוספת מאזין לאירוע סגירה דרך ipc
ipcMain.on('close', () => {
  if (!app.isPackaged) app.quit();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
