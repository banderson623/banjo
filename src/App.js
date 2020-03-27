import React, { useState, useEffect } from 'react';

import './styles.css';
import './tailwind.css';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const ipcRenderer = electron.ipcRenderer;

const ServerStatus = ({ connected, host, onChange = () => {} }) => {
  const className =
    'mr-2 h-3 w-3 rounded-full ' + (connected ? 'bg-green-700' : 'bg-red-700');

  const words = connected ? 'Connected to ' : '';
  return (
    <div class="flex items-center">
      <div className={className} />
      <div>
        {words}
        <input
          type="text"
          class="appearance-none bg-transparent focus:bg-transparent focus:text-white"
          value={host}
          onChange={(e) => {
            onChange(e.currentTarget.value);
          }}
        />
      </div>
    </div>
  );
};

const Error = ({ error, onDismiss = () => {} }) => {
  if (!error) return false;

  return (
    <div
      class="flex flex-col absolute top-0 bottom-0 left-0 right-0 p-6 justify-center "
      style={{
        backgroundColor: 'rgba(0,0,0,0.75)',
      }}
    >
      <div class="bg-red-800 p-3 rounded shadow text-white">
        <div class="text-red-400 text-sm upperca">Oh no, an error</div>
        <div class="text-xl">{error}</div>
        <button
          class="mt-4  p-1 px-2  text-red-300 bg-red-900 border-red-400 rounded"
          onClick={onDismiss}
        >
          Bummer!
        </button>
      </div>
    </div>
  );
};

const Toggle = ({ state, onToggle = () => {} }) => {
  let className =
    'relative inline-block flex-shrink-0 h-4 w-6 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline ml-2 flex items-center ';
  className += state ? ' bg-green-600' : ' bg-gray-800';

  return (
    <label
      class="flex items-center select-none cursor-pointer"
      title="This will control your copy of spotify when enabled"
      onClick={onToggle}
    >
      Enabled
      <span
        className={className}
        role="checkbox"
        tabindex="0"
        onClick={onToggle}
        aria-checked={state ? 'On' : 'Off'}
      >
        <span
          aria-hidden="true"
          class="inline-block h-3 w-3 rounded-full bg-white shadow transform transition ease-in-out duration-200"
          style={{
            transform: state ? 'translate(8px,0)' : '',
          }}
        ></span>
      </span>
    </label>
  );
};

let timerId = null;

const sendThrottledStateChange = ({
  sync,
  host,
  roomName,
  djRequested,
  name,
}) => {
  if (timerId) clearTimeout(timerId);
  timerId = setTimeout(() => {
    ipcRenderer.send('stateChange', {
      sync,
      host,
      roomName,
      djRequested,
      name,
    });
    timerId = null;
  }, 500);
};

export default function App() {
  // const roomDetails = useRooms();
  const [sync, setSync] = useState(true);
  const [host, setHost] = useState('localhost');
  const [name, setName] = useState('Your Name');

  const [artist, setArtist] = useState('Artist Name');
  const [trackName, setTrackName] = useState('Track Name');
  const [albumArtUrl, setAlbumArtUrl] = useState(
    'https://i.scdn.co/image/ab67616d0000b2737fe4a82a08c4f0decbeddbc6'
  );

  const [connected, setConnected] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [error, setError] = useState(null);

  const [roomName, setRoomName] = useState('vox-revenue-pals');
  const [djRequested, setDjRequested] = useState(false);
  const [djName, setDjName] = useState('');
  const [roomFriends, setRoomFriends] = useState([]);

  useEffect(() => {
    ipcRenderer.on('roomUpdate', (event, state) => {
      console.log('received roomUpdate', state);
      if (state && state.people) {
        setRoomFriends(state.people);
      }
    });

    ipcRenderer.on('djUpdate', (event, state) => {
      console.log('received djUpdate', state);
      if (state && state.dj) {
        setDjName(state.dj);
      }
    });
  });

  useEffect(() => {
    ipcRenderer.on('stateRestored', () => {
      console.log('marking state as restored');
      setStateRestored(true);
    });
  });

  useEffect(() => {
    ipcRenderer.on('disconnect', () => {
      setConnected(false);
    });
    ipcRenderer.on('connect', () => {
      setConnected(true);
    });
  });

  useEffect(() => {
    ipcRenderer.on('trackChanged', (event, { artist, name, artwork_url }) => {
      console.log('got track changed', { artist, name, artwork_url });
      setAlbumArtUrl(artwork_url);
      setArtist(artist);
      setTrackName(name);
    });
  });

  useEffect(() => {
    ipcRenderer.on('stateUpdateFromMain', (event, state) => {
      console.log('stateUpdateFromMain', state);
      if (state.sync !== undefined) setSync(state.sync);
      if (state.host) setHost(state.host);
      if (state.roomName) setRoomName(state.roomName);
      if (state.name) setName(state.name);
      if (state.djName) setDjName(state.djName);
      if (state.djRequested) setDjRequested(state.djRequested);
    });
  });

  useEffect(() => {
    // on send an event after the state has first been restored
    if (!stateRestored) {
      console.log('skipping this since state is not restored');
    }

    sendThrottledStateChange({ sync, host, roomName, djRequested, name });
  }, [sync, host, roomName, djRequested, name, stateRestored]);

  return (
    <div class="bg-gray-900 w-screen h-screen flex flex-col items-center">
      <Error
        error={error}
        onDismiss={() => {
          setError(null);
        }}
      />
      <div class="absolute right-0 left-0 flex text-xs  items-center pt-6 px-2 py-1 justify-between text-gray-600">
        <ServerStatus
          host={host}
          onChange={(h) => setHost(h)}
          connected={connected}
        />
        <div class="flex items-center">
          <Toggle
            state={sync}
            onToggle={() => {
              console.log(
                'got sync toggle event: ',
                sync,
                'state restored starte',
                stateRestored
              );
              if (stateRestored) {
                setSync(!sync);
              }
            }}
          />
        </div>
      </div>

      <div class="w-full flex flex-col items-center justify-center pt-12 pb-3 bg-black">
        <div class="h-40 object-contain rounded shadow overflow-hidden">
          <img class="h-40" src={albumArtUrl} />
        </div>
        <p class="text-2xl text-gray-400 text-shadow mt-4 truncate">
          {trackName}
        </p>
        <p class="text text-gray-600 text-shadow mt-2 truncate">{artist}</p>
      </div>

      <div class="flex flex-col items-center w-full">
        <div class="bg-gray-900 w-full p-2 flex flex-col text-gray-300 text-center">
          <div class="flex justify-between p-2 border-b border-gray-800">
            <div class="flex flex-col items-center">
              <label class="text-gray-700">Room</label>
              <input
                class="appearance-none bg-transparent rounded p-1 text-xl text-center"
                value={roomName}
                onChange={(e) => {
                  setRoomName(e.currentTarget.value);
                }}
                type="text"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.15)',
                }}
              />
            </div>

            <div class="mr-2">
              <div class="text-gray-700">Your DJ</div>
              <div class="my-2 flex items-center text-green-600 text-xl">
                {djName}
              </div>
            </div>
          </div>

          <div class="pt-6 text-gray-600 w-full flex flex-wrap">
            {roomFriends
              .sort((a, b) => Math.random() - 0.5)
              .map((p) => (
                <div
                  class="m-1 px-2 py-1 rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                >
                  {p}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div class="bg-black w-full items-center text-gray-300 absolute bottom-0">
        <div class="flex justify-between p-1">
          <input
            class="appearance-none bg-transparent px-2 text-xl w-1/2"
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            type="text"
          />
          <button
            class="whitespace-no-wrap font-bold border-2 rounded border-gray-700 text-gray-700 hover:text-green-400 hover:border-green-400 p-1 px-2 cursor-pointer"
            onClick={(e) => {
              setDjRequested(true);
            }}
          >
            Become the DJ!
          </button>
        </div>
      </div>
    </div>
  );
}
