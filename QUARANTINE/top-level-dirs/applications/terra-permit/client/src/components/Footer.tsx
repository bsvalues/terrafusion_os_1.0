import React from 'react';
import { Link } from 'wouter';
import { Github  } from '@mui/icons-material';
import TerraFusionLogo from './TerraFusionLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1 flex items-center justify-center md:justify-start">
            <Link href="/" className="flex items-center gap-2">
              <TerraFusionLogo className="h-8" variant="light" />
            </Link>
            <p className="ml-4 text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TerraFusionPermit. All rights reserved.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-center md:justify-start space-x-6 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
          <Link href="/documentation" className="hover:text-gray-900">Documentation</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;