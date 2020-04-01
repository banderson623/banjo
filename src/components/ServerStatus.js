import React from 'react';
import PopupInput from './PopupInput';

export default ({ connected, host, onChange = () => {} }) => {
  const className =
    'mr-2 h-3 w-3 rounded-full ' + (connected ? 'bg-green-700' : 'bg-red-700');

  const words = connected ? 'Connected' : 'Connecting...';
  return (
    <div class="flex items-center">
      <div className={className} />
      <PopupInput
        onChange={onChange}
        value={host}
        label="Banjo Server"
        helpText="You should be using banjo.bitbyteyum.com. Change at your own risk"
      >
        {words}
      </PopupInput>
    </div>
  );
};
