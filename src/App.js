import React, { useState, useEffect, useRef } from 'react';
import ErrorModal from './components/Error';
import ServerStatus from './components/ServerStatus';
import Toggle from './components/Toggle';
import PopupInput from './components/PopupInput';
import TrackDisplay from './components/TrackDisplay';

import './styles.css';
import './tailwind.css';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const ipcRenderer = electron.ipcRenderer;

export default function App() {
  // const roomDetails = useRooms();
  const [sync, setSync] = useState(true);
  const [host, setHost] = useState('banjo.bitbyteyum.com');
  const [name, setName] = useState(null);

  const [artist, setArtist] = useState('Artist Name');
  const [trackName, setTrackName] = useState('Track Name');
  const [albumArtUrl, setAlbumArtUrl] = useState(
    'https://i.scdn.co/image/ab67616d0000b2737fe4a82a08c4f0decbeddbc6'
  );

  const [connected, setConnected] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [error, setError] = useState(null);

  const [roomName, setRoomName] = useState('lobby');
  const [djRequested, setDjRequested] = useState(false);
  const [djName, setDjName] = useState('');
  const [roomFriends, setRoomFriends] = useState([]);

  const canNotifyOfStateChange = () => {
    return !!stateRestored && !!name;
  };

  const requestDJ = () => {
    setDjRequested(true);
  };

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
  }, [stateRestored, name]);

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
      if (state.djRequested !== undefined) setDjRequested(state.djRequested);
    });
  });

  useEffect(() => {
    if (canNotifyOfStateChange()) {
      ipcRenderer.send('stateChange', {
        sync,
        host,
        roomName,
        djRequested,
        name,
      });
    }
  }, [sync, host, roomName, djRequested, name, stateRestored]);

  return (
    <div class="bg-gray-900 w-screen h-screen flex flex-col items-center">
      <ErrorModal
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

      <TrackDisplay
        albumArtUrl={albumArtUrl}
        trackName={trackName}
        artistName={artist}
      ></TrackDisplay>

      <div class="flex flex-col items-center w-full">
        <div class="bg-gray-900 w-full p-2 flex flex-col text-gray-300 text-center">
          <div class="flex justify-between p-2 border-b border-gray-800">
            <div class="flex flex-col items-center">
              <label class="text-gray-700">Room</label>
              <PopupInput
                value={roomName}
                label="Room Name"
                helpText="Join your friends in a custom room"
                onChange={(e) => {
                  setRoomName(e);
                }}
              >
                <div class="p-1 text-xl text-center">{roomName}</div>
              </PopupInput>
            </div>

            <div class="mr-2">
              <div class="text-gray-700">Your DJ</div>
              <div class="my-2 flex items-center text-green-600 text-xl">
                {djName}
              </div>
            </div>
          </div>

          <div class="pt-6 text-gray-600 w-full flex flex-wrap">
            {roomFriends.map((p) => (
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
          <div class="bg-transparent px-2 text-xl w-1/2">
            <PopupInput
              value={name}
              shouldShowPopUp={() => {
                return name === null && stateRestored;
              }}
              label="Enter your name"
              helpText="...can include emojis 🎉"
              onChange={(v) => setName(v)}
            >
              {name}
            </PopupInput>
          </div>
          {djName !== name && (
            <button
              class="whitespace-no-wrap font-bold border-2 rounded border-gray-700 text-gray-700 hover:text-green-400 hover:border-green-400 p-1 px-2 cursor-pointer"
              onClick={requestDJ}
            >
              Become the DJ!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
