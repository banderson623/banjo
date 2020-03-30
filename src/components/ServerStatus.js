import React from 'react';

export default ({ connected, host, onChange = () => {} }) => {
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
