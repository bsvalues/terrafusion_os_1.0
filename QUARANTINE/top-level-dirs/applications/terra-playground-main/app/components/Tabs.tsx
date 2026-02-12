'use client';

import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: Tab[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      value,
      onChange,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState(value || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
      if (!tabs.find((tab) => tab.id === tabId)?.disabled) {
        setActiveTab(tabId);
        onChange?.(tabId);
      }
    };

    const variantClasses = {
      default: 'border-b border-gray-700',
      pills: 'space-x-2',
      underline: 'border-b border-gray-700',
    };

    const tabClasses = {
      default: 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-gray-300',
      pills: 'px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-gray-700',
      underline: 'border-b-2 border-transparent px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-gray-300',
    };

    const activeTabClasses = {
      default: 'border-blue-500 text-white',
      pills: 'bg-gray-700 text-white',
      underline: 'border-blue-500 text-white',
    };

    const disabledTabClasses = 'opacity-50 cursor-not-allowed';

    return (
      <div ref={ref} className={className} {...props}>
        <div className={variantClasses[variant]}>
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  ${tabClasses[variant]}
                  ${activeTab === tab.id ? activeTabClasses[variant] : ''}
                  ${tab.disabled ? disabledTabClasses : ''}
                `}
                disabled={tab.disabled}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {tabs.find((tab) => tab.id === activeTab)?.content}
          </motion.div>
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs; 