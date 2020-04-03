import React, { useState, useEffect } from 'react';

export default ({
  children,
  shown,
  shouldShowPopUp = () => false,
  label,
  helpText,
  value,
  onChange = () => {},
}) => {
  const [isShown, setShown] = useState(false);
  const [currentValue, setValue] = useState(value);

  useEffect(() => {
    if (!isShown) {
      setShown(shouldShowPopUp());
    }
  }, [isShown, shouldShowPopUp]);

  useEffect(() => {
    if (value !== currentValue) {
      setValue(value);
      console.log('setting value', currentValue);
    }
  }, [value]);

  if (!isShown)
    return (
      <div
        onClick={() => {
          setShown(true);
        }}
      >
        {children}
      </div>
    );

  return (
    <div>
      {children}
      <div
        class="flex flex-col fixed top-0 bottom-0 left-0 right-0 p-6 justify-center"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <div class="bg-blue-800 p-3 rounded shadow text-white">
          <label class="text-blue-200 text-xl">
            {label}
            <input
              class="text-xl w-full mt-2 bg-blue-700 rounded p-1 text-blue-100"
              value={currentValue}
              onChange={(e) => {
                setValue(e.currentTarget.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onChange(currentValue);
                  setShown(false);
                }
              }}
            />
            {helpText && <p class="mt-2 text-sm text-blue-400">{helpText}</p>}
          </label>
          <div class="mt-4 flex justify-end text-base">
            <button
              class="mx-1 p-1 px-2 text-blue-900 bg-blue-700 rounded hover:bg-blue-600"
              onClick={() => {
                setShown(false);
              }}
            >
              Cancel
            </button>
            <button
              class="mx-1 p-1 px-2 text-white bg-blue-500 rounded hover:bg-blue-300"
              onClick={() => {
                onChange(currentValue);
                setShown(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
