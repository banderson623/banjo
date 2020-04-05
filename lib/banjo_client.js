const spotify = require('spotify-node-applescript');
const socketClient = require('socket.io-client');
const log = require('electron-log');

const Plugins = require('./client_plugins');

if (!process.env || process.env.ENV !== 'dev') {
  console.log = log.log;
}

const POLLING_UPDATE_IN_SECONDS = 5;
const TIME_SYNC_SKEW_ALLOWANCE_IN_SECONDS = 2.5 * POLLING_UPDATE_IN_SECONDS;

class BanjoClient {
  constructor() {
    console.log('construction new banjo client');
    this.socket = null;

    // server state
    this.name;
    this.room;
    this.isDJ = false;
    this.isEnabled = false;
    this.volume = 100;
    this.sendPlaybackEvent = false;
    this.triggerTrackChangeEvent = false;

    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onDjUpdateCallbacks = [];
    this.onErrorCallbacks = [];
    this.onRoomFriendsChangeCallbacks = [];
    this.onTrackChangeCallbacks = [];
    this.onVolumeChangeCallbacks = [];

    // track states
    this.currentPlaybackLocation = 0;
    this.lastPlaybackLocationEvent = 0;
    this.currentTrack = {};
    this.currentState = null;

    this.startObservingSpotify();
    this.getSpotifyState();

    this.pluginsInitialized = false;
    this.plugins = [];
    this.pluginQueue = [];
  }

  initializePlugins() {
    if (this.pluginsInitialized) return;
    this.pluginsInitialized = true;

    this.plugins = new Map(
      Plugins.map((plugin) => [plugin.name, new plugin(this)])
    );

    // Drain the plugin using Queue
    this.pluginQueue.forEach((queueEntry, i) => {
      this.using(...queueEntry);
    });

    this.pluginQueue = [];
  }

  using(pluginName, callback) {
    if (this.pluginsInitialized) {
      if (this.plugins.has(pluginName)) {
        const plugin = this.plugins.get(pluginName);
        callback(plugin);
      } else {
        console.log(
          `no plugin found matching name ${pluginName} knows about ${this.plugins
            .keys()
            .join(', ')}`
        );
      }
    } else {
      this.pluginQueue.push([pluginName, callback]);
    }
  }

  connect(url) {
    if (this.socket !== null) {
      this.disconnect();
    }

    console.log('connecting to URL', url);
    this.socket = socketClient(url, { reconnect: true });

    this.initializePlugins();

    this.socket.on('connect', () => {
      this.onConnectCallbacks.forEach((cb) => cb());
      // this happens if the server connection
      // drops, let them know we are here
      if (this.room) {
        this.joinRoom(this.room);
      }

      this.handleVolumeChange(this.volume);

      this.getSpotifyState();
    });

    this.socket.on('disconnect', () => {
      this.onDisconnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('roomEvent', (data) => {
      const people = data.people.filter((p) => !!p);
      this.onRoomFriendsChangeCallbacks.forEach((cb) => cb(people));
      this.onDjUpdateCallbacks.forEach((cb) => cb(data.dj));

      this.isDJ = data.dj == this.name;
    });

    this.socket.on('hostEvent', (data) => {
      this.handleHostevent(data);
    });
  }

  onError(callback) {
    this.onErrorCallbacks.push(callback);
  }

  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
  }

  disconnect() {
    if (this.socket === null) return;
    this.socket.close();
    this.socket = null;
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
  }

  onDjUpdate(callback) {
    this.onDjUpdateCallbacks.push(callback);
  }

  onTrackChange(callback) {
    this.onTrackChangeCallbacks.push(callback);
  }

  onRoomFriendsChange(callback) {
    this.onRoomFriendsChangeCallbacks.push(callback);
  }

  onVolumeChange(callback) {
    this.onVolumeChangeCallbacks.push(callback);
  }

  becomeDj() {
    this.socket.emit('becomeDJ', {
      room: this.room,
      name: this.name,
    });
  }

  setName(name) {
    this.name = name;
    if (!name) return;
    console.log('socket setName', name);
    this.socket.emit('setName', name);
  }

  joinRoom(room) {
    this.room = room;
    console.log('socket joinRoom', room);
    this.socket.emit('joinRoom', {
      roomName: this.room,
      myName: this.name,
    });
  }

  setEnabled(isEnabled) {
    console.log('set enabled', isEnabled);
    this.isEnabled = isEnabled;
  }

  isDisconnected() {
    return this.socket === null;
  }

  // ---- Private -----

  handleVolumeChange(newVolume) {
    this.onVolumeChangeCallbacks.forEach((cb) => cb(newVolume));
  }

  handleHostevent(data) {
    // console.log('got host event', data);
    if (this.isDJ) return;

    const { artist, name, album, id, artwork_url, state, position } = data;

    if (id !== this.currentTrack.id) {
      if (this.isEnabled) {
        spotify.playTrack(id, (v) => {
          console.log('playTrack callback', v);
        });
      }

      this.onTrackChangeCallbacks.map((cb) =>
        cb({ artist, name, album, artwork_url })
      );
    }

    if (position) {
      if (
        Math.abs(position - this.currentPlaybackLocation) >
        TIME_SYNC_SKEW_ALLOWANCE_IN_SECONDS
      ) {
        console.log(
          'SEEKING - there is enough difference between ',
          position,
          'and',
          this.currentPlaybackLocation
        );

        if (this.isEnabled) {
          spotify.jumpTo(position, (v) => {
            console.log('jump callback', v);
          });
        }
      }
    }

    if (state !== this.currentState && this.isEnabled) {
      switch (state) {
        case 'playing':
          spotify.play((v) => {
            console.log('play callback', v);
          });
          break;
        case 'paused':
          spotify.pause((v) => {
            console.log('pause callback', v);
          });
          break;
        default:
          console.log('unknown state', state);
      }
    }
  }

  handleError(error) {
    console.log('***** an error occured', error);
    this.onErrorCallbacks.map((cb) => cb(JSON.stringify(error)));
  }

  getSpotifyState() {
    spotify.getState((err, data) => {
      if (err) this.handleError(err);
      if (!data) return;

      const { state, position, volume } = data;
      this.currentPlaybackLocation = position;

      if (volume !== this.volume) {
        this.handleVolumeChange(volume);
        this.volume = volume;
      }

      this.sendPlaybackEvent = this.currentState !== state;

      this.currentState = state;
    });

    spotify.getTrack((err, spotifyTrack) => {
      if (err) this.handleError(err);
      if (!spotifyTrack) return;

      const { id } = spotifyTrack;

      this.triggerTrackChangeEvent = this.currentTrack.id !== id;

      this.sendPlaybackEvent =
        this.sendPlaybackEvent || this.triggerTrackChangeEvent;

      this.currentTrack = spotifyTrack;
    });

    if (this.isDJ) {
      if (
        this.sendPlaybackEvent ||
        (this.lastPlaybackLocationEvent !== this.currentPlaybackLocation &&
          this.currentState !== 'paused')
      ) {
        console.log('I AM DJ SENDING SYNC EVENT');
        this.sendPlaybackEvent = false;
        this.lastPlaybackLocationEvent = this.currentPlaybackLocation;
        this.socket.emit('hostEvent', {
          ...this.currentTrack,
          state: this.currentState,
          position: this.currentPlaybackLocation,
        });
      }
    }

    if (this.triggerTrackChangeEvent) {
      this.onTrackChangeCallbacks.map((cb) => cb(this.currentTrack));
      this.triggerTrackChangeEvent = false;
    }
  }

  startObservingSpotify() {
    setInterval(() => {
      if (!this.isEnabled) return;
      this.getSpotifyState();
    }, POLLING_UPDATE_IN_SECONDS * 1000);
  }
}

module.exports = BanjoClient;
