import React from 'react';

export default ({ state, onToggle = () => {} }) => {
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
