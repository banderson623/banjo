const spotify = require('spotify-node-applescript');
const socketClient = require('socket.io-client');
const serverURL = 'https://banjo-server.herokuapp.com';
// const serverURL = 'http://localhost:4000';
const socket = socketClient(serverURL, { reconnect: true });

const ARGS = process.argv.slice(2).map((a) => a.toLowerCase());
const isDJ = ARGS.includes('--dj');

console.log('arguments', ARGS);

const getArgValue = (argument) => {
  const match = ARGS.find((a) => a.includes(`${argument}=`));
  if (match) {
    return match.split('=')[1];
  }
  return undefined;
};

let currentTrack = null;
let currentTime = 0;
let currentState = null;

let lastTrack = null;
let lastPosition = Number.MAX_SAFE_INTEGER;
const roomName = getArgValue('room') || 'rp-lounge';
const myName = getArgValue('name') || 'Random Goat';
const isSimulated = getArgValue('sim') || false;
let playbackState = {};

socket.on('connect', () => {
  console.log('client connection established');
});

socket.on('hostEvent', (data) => {
  // console.log('got an event from the server', data);

  if (!isDJ) {
    if (data.state == 'playing' && currentTrack !== data.id) {
      if (!isSimulated) {
        spotify.playTrack(data.id);
        currentTrack = data.id;
      } else {
        currentTrack = data.id;
        console.log('would sync switch to track', data.id);
      }
    }

    if (Math.abs(currentTime - data.position) > 10) {
      if (!isSimulated) {
        spotify.jumpTo(data.position, () => {
          console.log('jumped to', data.position);
        });
      } else {
        console.log('would seek to position', data.position);
      }
    } else {
      console.log(
        'not jumping to time, close enough',
        Math.abs(currentTime - data.position)
      );
    }

    currentState = data.state;
  }
});

socket.on('roomEvent', (data) => {
  console.log('got an roomEvent from the server', data);
});

socket.on('disconnect', () => {
  console.log('socket client disconnected');
});

console.log('joining roomName', { roomName, myName });
socket.emit('joinRoom', { roomName, myName });

const trackChange = () => {
  spotify.getTrack((err, spotifyTrack) => {
    if (!spotifyTrack) return;

    const { artist, name, album, id, artwork_url } = spotifyTrack;

    if (id !== lastTrack) {
      lastTrack = id;
      playbackState = { artist, name, album, id, artwork_url };
      console.log(`now playing track: ${name} - ${id}`);
    }
  });
};
trackChange();
setInterval(trackChange, 5000);

if (!isSimulated) {
  setInterval(() => {
    spotify.getState(function (err, data) {
      if (!data) {
        console.log('data unavailable');
        return;
      }
      const { state, position } = data;
      currentTime = position;

      if (lastPosition > position) {
        trackChange();
      }

      if (lastPosition !== position) {
        lastPosition = position;
        if (isDJ) {
          const message = { ...playbackState, state, position };
          socket.emit('hostEvent', message);
          console.log(message);
          console.log(`state: ${state} - position: ${position}`);
        }
      }
    });
  }, 500);
}
