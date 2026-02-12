import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Database, Code2, Laptop, X, Compass, ChevronRight, Rocket, Settings  } from '@mui/icons-material';

/**
 * QuickAccessMenu - A floating menu that provides quick access to important tools
 * This component is designed to be visible on all pages of the application
 */
export const QuickAccessMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      title: 'Database Conversion',
      description: 'Convert databases to TaxI_AI platform',
      icon: <Database className="h-5 w-5" />,
      href: '/database-conversion',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-400',
    },
    {
      title: 'Development Platform',
      description: 'Build custom assessment apps',
      icon: <Code2 className="h-5 w-5" />,
      href: '/development',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-400',
    },
    {
      title: 'Assessment Workbench',
      description: 'Design assessment models',
      icon: <Laptop className="h-5 w-5" />,
      href: '/development/assessment-workbench',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-400',
    },
  ];

  return (
    <div className="fixed bottom-24 left-6 z-50 flex flex-col items-start">
      {/* The menu panel */}
      {isOpen && (
        <div className="mb-4 w-80 rounded-lg bg-white shadow-xl border animate-in slide-in-from-left-5 duration-300 dark:bg-gray-900">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between"><>

              <h3 className="font-medium">Quick Access Tools</h3>
              <Button
</> variant="ghost" size="icon" onClick={toggleMenu} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-2">
            {menuItems.map((item /* , index */) => (
              <Link key={index} href={item.href} onClick={() => setIsOpen(false)}>
                <div className="flex items-start gap-4 rounded-md p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"><>

                  <div className={`rounded-full p-2 ${item.color}`}>{item.icon}</div>

                  <div
</> className="flex-1">
                    <div className="flex items-center justify-between"><>

                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <ChevronRight
</> className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* The toggle button */}
      <Button
        onClick={toggleMenu}
        className={`rounded-full shadow-lg animate-pulse ${isOpen ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
        size="icon"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
      </Button>

      {/* Label */}
      {!isOpen && (
        <div className="bg-black text-white text-xs rounded px-2 py-1 mt-2 animate-bounce">
          Access Tools
        </div>
      )}
    </div>
  );
};

export default QuickAccessMenu;
