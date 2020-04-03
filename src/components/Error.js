import React from 'react';

export default ({ error, onDismiss = () => {} }) => {
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
