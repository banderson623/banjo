import React, { useRef, useEffect } from 'react';
import REACTIONS, { REACTION_BASE_PATH } from '../reactions';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const ipcRenderer = electron.ipcRenderer;

export default () => {
  const audioElement = useRef();

  const onReaction = (reaction) => {
    ipcRenderer.send('reacted', reaction);
    playReaction(reaction);
  };

  const playReaction = (reaction) => {
    const url =
      process.env.PUBLIC_URL +
      REACTION_BASE_PATH +
      REACTIONS[reaction].audioUrl;

    if (url) {
      const audio = new Audio(url);
      console.log('trying to play ' + url, audio);
      audio.addEventListener('canplaythrough', (event) => {
        console.log('can play', event);
        audio.play();
      });
    }

    console.log('playing', url);
  };

  useEffect(() => {
    ipcRenderer.on('reaction', (event, reaction) => {
      console.log('got reaction from room', reaction);
    });
  }, [ipcRenderer]);

  return (
    <div
      class="p-1 flex w-full shadow-inner mt-1"
      style={{
        backgroundColor: 'rgb(15, 19, 26)',
      }}
    >
      {Object.keys(REACTIONS).map((r) => (
        <button
          class="appearance-none text-gray-500 flex-grow flex-1  border border-transparent p-1 mx-1 rounded hover:border-gray-700"
          onClick={() => onReaction(r)}
        >
          {REACTIONS[r].label || r}
        </button>
      ))}
      <audio ref={audioElement} />
    </div>
  );
};
