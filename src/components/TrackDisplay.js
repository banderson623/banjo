import React from 'react';
import Reaction from './Reaction';

export default ({ albumArtUrl, trackName, artistName, children }) => {
  return (
    <div class="w-full flex flex-col items-center justify-center pt-12 bg-black">
      <div class="h-40 object-contain rounded shadow overflow-hidden">
        <img class="h-40" src={albumArtUrl} />
      </div>
      <p class="text-2xl text-gray-400 text-shadow mt-4 w-full px-2 text-center">
        {trackName}
      </p>
      <p class="text text-gray-600 text-shadow px-2 mb-2 w-full text-center">
        {artistName}
      </p>
      <Reaction />
    </div>
  );
};
