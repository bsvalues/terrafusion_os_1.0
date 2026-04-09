import { useState } from 'react';
import { useExtension } from '@/providers/extension-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings as SettingsIcon, Command, Package } from 'lucide-react';

export function ExtensionsPanel() {
  const { 
    extensions, 
    webviews,
    isLoading, 
    error, 
    activateExtension, 
    deactivateExtension, 
    updateExtensionSettings,
    executeCommand
  } = useExtension();

  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [settingsValues, setSettingsValues] = useState<Record<string, any>>({});

  const handleExtensionToggle = async (extensionId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateExtension(extensionId);
      } else {
        await activateExtension(extensionId);
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
    }
  };

  const openSettings = (extensionId: string) => {
    const extension = extensions.find(ext => ext.id === extensionId);
    if (!extension || !extension.settings) return;

    // Initialize settings values with current values or defaults
    const initialValues: Record<string, any> = {};
    for (const setting of extension.settings) {
      initialValues[setting.id] = setting.value !== undefined ? setting.value : setting.default;
    }

    setSettingsValues(initialValues);
    setSettingsOpen(extensionId);
  };

  const handleSettingsChange = (id: string, value: any) => {
    setSettingsValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const saveSettings = async () => {
    if (!settingsOpen) return;

    try {
      await updateExtensionSettings(settingsOpen, settingsValues);
      setSettingsOpen(null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleViewExtension = (extensionId: string) => {
    setSelectedExtension(extensionId);
  };

  const handleExecuteCommand = async (extensionId: string, commandId: string) => {
    try {
      await executeCommand(commandId);
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading extensions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Error loading extensions: {error}</p>
      </div>
    );
  }

  const currentExtension = selectedExtension ? 
    extensions.find(ext => ext.id === selectedExtension) : null;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Extensions</h1>
      </div>

      {selectedExtension ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setSelectedExtension(null)}
              className="text-sm font-medium text-primary flex items-center"
            >
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Extensions
            </button>
          </div>

          {currentExtension && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{currentExtension.name}</CardTitle>
                    <CardDescription className="mt-1">{currentExtension.description}</CardDescription>
                  </div>
                  <Badge variant={currentExtension.isActive ? "default" : "outline"} className={currentExtension.isActive ? "bg-green-500" : ""}>
                    {currentExtension.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <Tabs defaultValue="overview" className="px-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</h3>
                      <p className="mt-1 text-base">{currentExtension.version}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Webviews</h3>
                      <div className="mt-1">
                        {webviews.filter(w => w.extensionId === currentExtension.id).length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {webviews
                              .filter(w => w.extensionId === currentExtension.id)
                              .map(webview => (
                                <li key={webview.id} className="text-base">{webview.title}</li>
                              ))
                            }
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">No webviews available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commands" className="space-y-4">
                  {currentExtension.commands && currentExtension.commands.length > 0 ? (
                    <div className="grid gap-3">
                      {currentExtension.commands
                        .filter(cmd => !cmd.hidden)
                        .map(command => (
                          <div 
                            key={command.id} 
                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <div>
                              <h4 className="text-sm font-medium">{command.title}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{command.id}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleExecuteCommand(currentExtension.id, command.id)}
                            >
                              <Command className="h-4 w-4 mr-1" />
                              Execute
                            </Button>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No commands available</p>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  {currentExtension.settings && currentExtension.settings.length > 0 ? (
                    <Button 
                      variant="outline" 
                      onClick={() => openSettings(currentExtension.id)}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  ) : (
                    <p className="text-gray-500 italic">No configurable settings available</p>
                  )}
                </TabsContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t pt-6">
                <div className="flex items-center">
                  <Switch 
                    id={`toggle-${currentExtension.id}`}
                    checked={currentExtension.isActive}
                    onCheckedChange={(value) => handleExtensionToggle(currentExtension.id, currentExtension.isActive)}
                    className="mr-2"
                  />
                  <Label htmlFor={`toggle-${currentExtension.id}`}>
                    {currentExtension.isActive ? 'Activated' : 'Activate'}
                  </Label>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {extensions.map(extension => (
            <Card key={extension.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{extension.name}</CardTitle>
                  <Badge variant={extension.isActive ? "default" : "outline"} className={`ml-2 ${extension.isActive ? "bg-green-500" : ""}`}>
                    {extension.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {extension.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Package className="h-4 w-4 mr-1" />
                  <span>v{extension.version}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewExtension(extension.id)}
                >
                  View Details
                </Button>
                <div className="flex items-center">
                  <Switch 
                    id={`toggle-${extension.id}`}
                    checked={extension.isActive}
                    onCheckedChange={(value) => handleExtensionToggle(extension.id, extension.isActive)}
                    className="mr-2"
                  />
                  <Label htmlFor={`toggle-${extension.id}`} className="text-sm">
                    {extension.isActive ? 'Enabled' : 'Enable'}
                  </Label>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      {settingsOpen && (
        <Dialog open={!!settingsOpen} onOpenChange={(open) => !open && setSettingsOpen(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Extension Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {extensions
                .find(ext => ext.id === settingsOpen)
                ?.settings?.map(setting => (
                  <div key={setting.id} className="space-y-2">
                    <Label htmlFor={setting.id}>{setting.label}</Label>
                    {setting.type === 'boolean' ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={setting.id} 
                          checked={!!settingsValues[setting.id]} 
                          onCheckedChange={(checked) => handleSettingsChange(setting.id, checked)}
                        />
                        <Label htmlFor={setting.id}>Enabled</Label>
                      </div>
                    ) : setting.type === 'number' ? (
                      <Input 
                        id={setting.id}
                        type="number"
                        value={settingsValues[setting.id] || ''}
                        onChange={(e) => handleSettingsChange(setting.id, parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <Input 
                        id={setting.id}
                        value={settingsValues[setting.id] || ''}
                        onChange={(e) => handleSettingsChange(setting.id, e.target.value)}
                      />
                    )}
                  </div>
                ))
              }
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSettingsOpen(null)}>Cancel</Button>
              <Button onClick={saveSettings}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}