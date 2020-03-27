const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const Store = require('electron-store');
const windowStateKeeper = require('electron-window-state');
const BanjoClient = require('../lib/banjo_client');
const store = new Store();
const path = require('path');
const log = require('electron-log');

if (!process.env || process.env.ENV !== 'dev') {
  console.log = log.log;
}

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
  webContents = win.webContents;

  if (process.env && process.env.ENV && process.env.ENV == 'dev') {
    console.log('using react-scripts server');
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  }
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  console.log('registering protocol!');
  protocol.registerHttpProtocol(
    'banjo',
    (request) => {
      console.log('got request', request);
      const action = request.url.split('::')[1];
      console.log('i think this is the action', action);
    },
    (error) => {
      if (error) console.error('Failed to register protocol');
    }
  );
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
      webContents.send('stateRestored', {});
    }, 500);
  } else {
    setTimeout(() => {
      console.log('no last state', lastState);
      webContents.send('stateRestored', {});
    }, 500);
  }
});

setTimeout(() => {
  ipcMain.on('stateChange', (event, state) => {
    console.log('storing state');
    state.djRequested = false;
    store.set('lastState', state);
  });
}, 500);

let currentHost = null;
let currentRoom = null;
let currentName = null;

const resetMainContextVariables = () => {
  currentHost = null;
  currentRoom = null;
  currentName = null;
};

const interactWithServerBasedOnState = ({
  sync,
  host,
  djRequested,
  roomName,
  name,
}) => {
  client.setEnabled(sync);

  if (currentHost !== host) {
    currentHost = host;
    const withHttps = host.includes('http') ? host : 'https://' + host;
    client.disconnect();
    client.connect(withHttps);
  }

  if (name !== currentName) {
    currentName = name;
    client.setName(currentName);
  }

  if (djRequested) {
    console.log('asking to be the DJ');
    client.becomeDj();
    // Reset after this is recieved
    webContents.send('stateUpdateFromMain', { djRequested: false });
  }

  if (roomName !== currentRoom) {
    currentRoom = roomName;
    client.joinRoom(currentRoom);
  }
};

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

client.onError((err) => {
  webContents.send('error', { err });
});

client.onTrackChange(({ artist, name, artwork_url }) => {
  webContents.send('trackChanged', { artist, name, artwork_url });
});

ipcMain.on('forceReconnectWithServer', (event, state) => {
  console.log('forcing reconnect with server', state);
  resetMainContextVariables();
  interactWithServerBasedOnState(state);
});

ipcMain.on('stateChange', (event, state) => {
  console.log('interact with server', state);
  interactWithServerBasedOnState(state);
});
// });
