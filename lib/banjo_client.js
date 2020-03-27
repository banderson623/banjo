const spotify = require('spotify-node-applescript');
const socketClient = require('socket.io-client');

class BanjoClient {
  constructor() {
    console.log('construction new banjo client');
    this.socket = null;

    // server state
    this.name;
    this.room;
    this.isDJ = false;
    this.isEnabled = false;

    this.sendPlaybackEvent = false;
    this.triggerTrackChangeEvent = false;

    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onDjUpdateCallbacks = [];
    this.onErrorCallbacks = [];
    this.onRoomFriendsChangeCallbacks = [];
    this.onTrackChangeCallbacks = [];

    // track states
    this.currentPlaybackLocation = 0;
    this.currentTrack = {};
    this.currentState = null;

    this.startObservingSpotify();
  }

  connect(url) {
    if (this.socket !== null) {
      this.disconnect();
    }

    console.log('connecting to URL', url);
    this.socket = socketClient(url, { reconnect: true });

    this.socket.on('connect', () => {
      this.onConnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('disconnect', () => {
      this.onDisconnectCallbacks.forEach((cb) => cb());
    });

    this.socket.on('roomEvent', (data) => {
      this.onRoomFriendsChangeCallbacks.forEach((cb) => cb(data.people));
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

  becomeDj() {
    this.socket.emit('becomeDJ', {
      room: this.room,
      name: this.name,
    });
  }

  setName(name) {
    this.name = name;
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

  handleHostevent(data) {
    // console.log('got host event', data);
    if (this.isDJ) return;

    const { artist, name, album, id, artwork_url, state, position } = data;

    if (id !== this.currentTrack.id) {
      if (this.isEnabled) {
        spotify.playTrack(id);
      }

      this.onTrackChangeCallbacks.map((cb) =>
        cb({ artist, name, album, artwork_url })
      );
    }

    if (position) {
      if (Math.abs(position - this.currentPlaybackLocation) > 10) {
        console.log(
          'SEEKING - there is enough difference between ',
          position,
          'and',
          this.currentPlaybackLocation
        );

        if (this.isEnabled) {
          spotify.jumpTo(position);
        }
      }
    }

    if (state !== this.currentState && this.isEnabled) {
      switch (state) {
        case 'playing':
          spotify.play();
          break;
        case 'paused':
          spotify.pause();
          break;
        default:
          console.log('unknown state', state);
      }
    }
  }

  handleError(error) {
    console.log('an error occured', error);
    this.onErrorCallbacks.map((cb) => cb(error));
  }

  startObservingSpotify() {
    setInterval(() => {
      if (!this.isEnabled) return;

      spotify.getState((err, data) => {
        if (err) this.handleError(err);
        if (!data) return;

        const { state, position } = data;
        this.currentPlaybackLocation = position;

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
          (this.currentPlaybackLocation % 5 == 0 &&
            this.currentState !== 'paused')
        ) {
          console.log('I AM DJ SENDING SYNC EVENT');
          this.sendPlaybackEvent = false;
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
    }, 1000);
  }
}

module.exports = BanjoClient;
