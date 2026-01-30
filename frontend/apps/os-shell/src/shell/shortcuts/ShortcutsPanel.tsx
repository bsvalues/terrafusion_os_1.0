import React from 'react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'System',
    items: [
      { keys: ['Win'], description: 'Toggle Start Menu' },
      { keys: ['Ctrl', '`'], description: 'Toggle Start Menu (Alt)' },
      { keys: ['Escape'], description: 'Close Start Menu / Panel' },
      { keys: ['Ctrl', '/'], description: 'Show Keyboard Shortcuts' },
    ],
  },
  {
    title: 'Window Management',
    items: [
      { keys: ['Win', '←'], description: 'Snap Left' },
      { keys: ['Win', '→'], description: 'Snap Right' },
      { keys: ['Win', '↑'], description: 'Maximize Window' },
      { keys: ['Win', '↓'], description: 'Restore / Minimize' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['Tab'], description: 'Navigate Focus' },
      { keys: ['Enter'], description: 'Launch App' },
      { keys: ['Ctrl', '1-7'], description: 'Quick Launch Module' },
    ],
  },
];

const KeyCap: React.FC<{ label: string }> = ({ label }) => (
  <kbd className='px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm min-w-[1.5rem] text-center inline-block'>
    {label}
  </kbd>
);

export const ShortcutsPanel: React.FC = () => {
  return (
    <div className='h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 overflow-y-auto'>
      <div className='max-w-4xl mx-auto'>
        <div className='flex items-center gap-3 mb-8'>
          <div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
            <svg
              className='w-8 h-8 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
              />
            </svg>
          </div>
          <div>
            <h1 className='text-2xl font-bold'>Keyboard Shortcuts</h1>
            <p className='text-gray-500 dark:text-gray-400'>
              Master TerraFusion OS with these power user shortcuts
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title} className='space-y-4'>
              <h2 className='text-lg font-semibold text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-2'>
                {category.title}
              </h2>
              <div className='space-y-3'>
                {category.items.map((item, index) => (
                  <div key={index} className='flex items-center justify-between group'>
                    <span className='text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors'>
                      {item.description}
                    </span>
                    <div className='flex items-center gap-1'>
                      {item.keys.map((key, kIndex) => (
                        <React.Fragment key={kIndex}>
                          <KeyCap label={key} />
                          {kIndex < item.keys.length - 1 && (
                            <span className='text-gray-400 dark:text-gray-600 text-sm'>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg'>
          <div className='flex gap-3'>
            <svg
              className='w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <div>
              <h3 className='font-semibold text-blue-900 dark:text-blue-100'>Pro Tip</h3>
              <p className='text-sm text-blue-800 dark:text-blue-200 mt-1'>
                You can use <KeyCap label='Win' /> + <KeyCap label='Arrow Keys' /> to quickly snap
                windows to different parts of the screen, just like in Windows 11.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
