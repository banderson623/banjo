import React, { ipcRenderer } from 'react';

export default ({ sendReaction = () => {} }) => {
  const sendReaction = (reaction) => {
    ipcRenderer.send('reacted', reaction);
  };
  return (
    <div class="p-2 flex w-full">
      {['🔥', '🥴', '😱'].map((r) => (
        <button
          class="appearance-none flex-grow flex-1 bg-gray-900 border border-transparent p-1 mx-1 rounded hover:border-gray-700"
          onClick={() => sendReaction(r)}
        >
          {r}
        </button>
      ))}
    </div>
  );
};
