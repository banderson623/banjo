const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const windowStateKeeper = require('electron-window-state');
const BanjoClient = require('../lib/banjo_client');
const store = new Store();

require('events').defaultMaxListeners = 15;

const path = require('path');

let webContents = null;

function createWindow() {
  let mainWindowState = windowStateKeeper({});

  // Create the browser window.
  let win = new BrowserWindow({
    width: 350,
    height: 700,
    x: mainWindowState.x,
    y: mainWindowState.y,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    titleBarStyle: 'hidden',
  });

  mainWindowState.manage(win);

  // and load the index.html of the app.
  win.loadURL('http://localhost:3000');
  // win.webContents.openDevTools();

  webContents = win.webContents;

  // win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
}

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.whenReady().then(() => {
  const lastState = store.get('lastState');
  if (lastState) {
    setTimeout(() => {
      console.log('restoring last state', lastState);
      webContents.send('stateUpdateFromMain', lastState);
    }, 500);
  } else {
    console.log('no last state', lastState);
  }
});

setTimeout(() => {
  ipcMain.on('stateChange', (event, state) => {
    console.log('storing state');
    state.djRequested = false;
    store.set('lastState', state);
  });
}, 5000);

let currentHost = null;
let currentRoom = null;
let currentName = null;

// app.whenReady().then(() => {
const client = new BanjoClient();

client.onRoomFriendsChange((friends) => {
  webContents.send('roomUpdate', { people: friends });
});

client.onDjUpdate((dj) => {
  webContents.send('djUpdate', { dj });
});

client.onDisconnect(() => {
  webContents.send('disconnect', {});
});

client.onConnect(() => {
  webContents.send('connect', {});
});

client.onTrackChange(({ artist, name, artwork_url }) => {
  console.log('track changed', { artist, name, artwork_url });
  webContents.send('trackChanged', { artist, name, artwork_url });
});

ipcMain.on('stateChange', (event, state) => {
  client.setEnabled(state.sync);

  console.log('client state changed', state);

  if (currentHost !== state.host) {
    currentHost = state.host;
    const withHttps = state.host.includes('http')
      ? state.host
      : 'https://' + state.host;
    client.disconnect();
    client.connect(withHttps);
  }

  if (state.name !== currentName) {
    currentName = state.name;
    client.setName(currentName);
  }

  if (state.djRequested) {
    console.log('asking to be the DJ');
    client.becomeDj();
    // Reset after this is recieved
    webContents.send('stateUpdateFromMain', { djRequested: false });
  }

  if (state.roomName !== currentRoom) {
    currentRoom = state.roomName;
    client.joinRoom(currentRoom);
  }
});
// });
