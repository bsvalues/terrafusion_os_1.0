import { ExtensionsPanel } from '@/components/extensions/ExtensionsPanel';

export function ExtensionsPage() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Extensions</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage and configure extensions that enhance the capabilities of the platform.
        </p>
      </div>
      
      <ExtensionsPanel />
    </div>
  );
}