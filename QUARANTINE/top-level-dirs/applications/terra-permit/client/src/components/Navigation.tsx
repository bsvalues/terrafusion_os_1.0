import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, 
  History, 
  FileText, 
  BarChart2, 
  Settings,
  Brain,
  Cog,
  Network,
  Activity,
  FileCheck,
  LineChart,
  LayoutDashboard,
  Database,
  Shield,
  Command,
  Lock,
  Zap
 } from '@mui/icons-material';
import TerraFusionLogo from './TerraFusionLogo';

const Navigation: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { href: '/', icon: Zap, label: 'Terrafusion-AI', tourId: 'nav-dashboard' },
    { href: '/history', icon: History, label: 'History', tourId: 'nav-history' },
    { href: '/reports', icon: BarChart2, label: 'Reports', tourId: 'nav-reports' },
    { href: '/settings', icon: Settings, label: 'Settings', tourId: 'nav-settings' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.nav 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
      data-tour="navigation"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-start mb-6 ml-2"
      >
        <TerraFusionLogo />
      </motion.div>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-wrap gap-3 border-b pb-5 pt-2 border-gray-200"
      >
        {navItems.map((navItem /* , index */) => (
          <motion.div
            key={navItem.href}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href={navItem.href}
              data-tour={navItem.tourId}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
                isActive(navItem.href)
                  ? 'nav-item-active'
                  : 'nav-item text-gray-800 hover:text-gray-900'
              }`}
            >
              <motion.div
                whileHover={!isActive(navItem.href) ? { rotate: 15 } : {}}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <navItem.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(navItem.href) ? 'text-white' : 'text-primary'
                  }`}
                />
              </motion.div>
              <span className={isActive(navItem.href) ? '' : 'high-contrast-text'}>
                {navItem.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.nav>
  );
};

export default Navigation;