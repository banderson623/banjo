import React from 'react';

export default ({ albumArtUrl, trackName, artistName, children }) => {
  return (
    <div class="w-full flex flex-col items-center justify-center pt-12 pb-4 bg-black">
      <div class="h-40 object-contain rounded shadow overflow-hidden">
        <img class="h-40" src={albumArtUrl} />
      </div>
      <p class="text-2xl text-gray-400 text-shadow mt-4 truncate">
        {trackName}
      </p>
      <p class="text text-gray-600 text-shadow mt-2 truncate">{artistName}</p>
      {children}
    </div>
  );
};
