import React from 'react';
import { Link } from 'wouter';
import { ChevronRight, Code, Database, Folder, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DevelopmentWorkspaceLayoutProps {
  children: React.ReactNode;
  showFileExplorer?: boolean;
}

const DevelopmentWorkspaceLayout = ({ children, showFileExplorer = false }: DevelopmentWorkspaceLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navigation */}
      <header className="bg-white border-b h-14 flex items-center px-4 shadow-sm">
        <Link href="/" className="text-lg font-semibold flex items-center mr-8">
          <svg className="w-7 h-7 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4F46E5" />
            <path d="M2 17L12 22L22 17" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          TaxI_AI
        </Link>
        
        <nav className="flex space-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          
          <Link href="/development" className="text-indigo-600 border-b-2 border-indigo-600 px-3 py-2 text-sm font-medium flex items-center">
            <Code className="h-4 w-4 mr-1" />
            Development
          </Link>
          
          <Link href="/data" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
            <Database className="h-4 w-4 mr-1" />
            Data
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Left sidebar */}
        <aside className="w-52 border-r bg-gray-50 flex flex-col">
          <nav className="p-4 flex-1">
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Projects
              </h2>
              
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/development" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    All Projects
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/development?filter=active" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Active Projects
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/development?filter=recent" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Recent Projects
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Templates
              </h2>
              
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/development?tab=templates" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Assessment Apps
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/development?tab=templates&filter=demo" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Demo Apps
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/development?tab=templates&filter=framework" 
                    className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 rounded-md px-3 py-2 text-sm font-medium flex items-center"
                  >
                    Framework Templates
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        {/* Main content area */}
        <main className={cn("flex-1 p-6", showFileExplorer && "pl-0")}>
          {showFileExplorer && (
            <div className="flex h-full">
              <div className="w-64 border-r h-full p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Files</h3>
                </div>
                <div className="project-files">
                  {/* File explorer content will be dynamically populated */}
                </div>
              </div>
              <div className="flex-1 p-6">
                {children}
              </div>
            </div>
          )}
          
          {!showFileExplorer && children}
        </main>
      </div>
    </div>
  );
};

export default DevelopmentWorkspaceLayout;