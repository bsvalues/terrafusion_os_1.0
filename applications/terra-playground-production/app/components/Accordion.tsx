'use client';

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: AccordionItem[];
  value?: string[];
  onChange?: (value: string[]) => void;
  variant?: 'default' | 'bordered' | 'separated';
  multiple?: boolean;
}

const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      value,
      onChange,
      variant = 'default',
      multiple = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [expandedItems, setExpandedItems] = useState<string[]>(value || []);

    const handleItemClick = (itemId: string) => {
      if (items.find((item) => item.id === itemId)?.disabled) return;

      const newExpandedItems = multiple
        ? expandedItems.includes(itemId)
          ? expandedItems.filter((id) => id !== itemId)
          : [...expandedItems, itemId]
        : expandedItems.includes(itemId)
        ? []
        : [itemId];

      setExpandedItems(newExpandedItems);
      onChange?.(newExpandedItems);
    };

    const variantClasses = {
      default: 'divide-y divide-gray-700',
      bordered: 'space-y-2',
      separated: 'space-y-4',
    };

    const itemClasses = {
      default: '',
      bordered: 'border border-gray-700 rounded-lg',
      separated: 'bg-gray-800 rounded-lg',
    };

    const headerClasses = {
      default: 'py-4',
      bordered: 'p-4',
      separated: 'p-4',
    };

    const contentClasses = {
      default: 'pb-4',
      bordered: 'px-4 pb-4',
      separated: 'px-4 pb-4',
    };

    const disabledClasses = 'opacity-50 cursor-not-allowed';

    return (
      <div ref={ref} className={`${variantClasses[variant]} ${className}`} {...props}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`${itemClasses[variant]} ${item.disabled ? disabledClasses : ''}`}
          >
            <button
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between ${headerClasses[variant]}`}
              disabled={item.disabled}
            ><>

              <span className="text-sm font-medium text-white">{item.title}</span>
              <motion
</>.svg
                className="w-5 h-5 text-gray-400"
                animate={{
                  rotate: expandedItems.includes(item.id) ? 180 : 0,
                }}
                transition={{ duration: 0.2 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </motion.svg>
            </button>
            <AnimatePresence>
              {expandedItems.includes(item.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`overflow-hidden ${contentClasses[variant]}`}
                >
                  {item.content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';

export default Accordion; 