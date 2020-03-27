const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 350,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
    },
    // frame: false,
    // titleBarStyle: 'hidden',
  });

  // and load the index.html of the app.
  win.loadURL('http://localhost:3000');

  win.webContents.openDevTools();
  // win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
}

app.whenReady().then(createWindow);

// app.whenReady().then(() => {
ipcMain.on('stateChange', (event, arg) => {
  console.log(event, arg); // prints "ping"
});
// });
