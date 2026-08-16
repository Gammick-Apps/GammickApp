const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const APP_URL = 'https://gammick.base44.app';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    fullscreen: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // האתר נטען ישירות כדף העליון ולא בתוך iframe, כדי שהאחסון שלו יהיה
  // first-party. בתוך iframe הוא היה third-party, ממופתח לפי ה-origin
  // של הדף העליון (file://) — ולכן נמחק כשהמפתוח הזה השתנה.
  mainWindow.loadURL(APP_URL);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// נרשם פעם אחת בלבד. קודם הרישום היה בתוך createWindow, כך שכל פתיחת
// חלון נוספת (דרך activate) הייתה מוסיפה מאזין ומדפיסה פעמיים.
// התוכן מגיע מהאתר ונטען כ-data URL. בלי הצהרת כיוון מפורשת כרומיום
// מניח שמאל-לימין, ולכן ההדפסה יצאה הפוכה. אם האתר שולח מסמך שלם
// מכבדים אותו ורק משלימים dir; אחרת עוטפים במסמך תקין.
function buildPrintDocument(content) {
  if (/<html[\s>]/i.test(content)) {
    return content.replace(/<html([^>]*)>/i, (match, attrs) =>
      /\bdir\s*=/i.test(attrs) ? match : `<html${attrs} dir="rtl" lang="he">`
    );
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<style>
  @page { margin: 10mm; }
  body {
    direction: rtl;
    text-align: right;
    font-family: "Segoe UI", Arial, sans-serif;
    margin: 0;
  }
  table { direction: rtl; border-collapse: collapse; }
  th, td { text-align: right; }
</style>
</head>
<body>${content}</body>
</html>`;
}

ipcMain.on("sendPrint", (event, args) => {
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(buildPrintDocument(args)));
  printWindow.webContents.once('did-finish-load', () => {
    printWindow.webContents.print(
      { silent: true, printBackground: true },
      (success) => {
        if (mainWindow) mainWindow.webContents.send("receivePrint", success);
        printWindow.destroy(); // אחרת כל הדפסה משאירה חלון נסתר שלא נסגר לעולם
      }
    );
  });
});

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
