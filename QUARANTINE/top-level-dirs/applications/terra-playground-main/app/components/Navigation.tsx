'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Projects', href: '/projects', icon: '📁' },
  { name: 'Tasks', href: '/tasks', icon: '✓' },
  { name: 'Reports', href: '/reports', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 border-r border-gray-700 w-64 min-h-screen">
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-8">
<>
          <h2 className="text-xl font-bold text-white">Terrafusion</h2>
          <button
</>
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <span className="sr-only">Open menu</span>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`${isOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-1">
            {navigation.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
} 