import React, {useState} from 'react';
import {Settings, Eye, Volume2, Type, Monitor, Keyboard, X} from '@mui/icons-material';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Separator} from '@/components/ui/separator';
import {useAccessibility, FocusTrap} from './accessibility-provider';

export function AccessibilitySettings() {const { settings, updateSettings, announce} = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: any) =>{updateSettings({ [key]: value});
    announce(`${key} setting changed to ${value}`, 'polite');
  };

  const resetToDefaults = () => {updateSettings({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      focusVisible: true,
      screenReaderAnnouncements: true,});
    announce('Accessibility settings reset to defaults', 'polite');
  };

  const AccessibilityIcon = () => (<div className="relative"><Settings className="h-5 w-5" /><span className="sr-only">Accessibility Settings</span></div>);

  return (<Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild><Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-2 hover:bg-terrafusion-cyan/10"
          aria-label="Open accessibility settings"
        ><AccessibilityIcon /><span className="hidden sm:inline">Accessibility</span></Button></DialogTrigger><DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-terrafusion-cyan/20"
        aria-describedby="accessibility-settings-description"
      ><FocusTrap active={isOpen}><DialogHeader><DialogTitle className="text-xl font-bold text-white font-orbitron flex items-center gap-2"><><Settings className="h-5 w-5 text-terrafusion-cyan" />Accessibility Settings</DialogTitle><DialogDescription
</>id="accessibility-settings-description" className="text-gray-300">
              Customize your accessibility preferences to improve your experience with Terrafusion.</DialogDescription></DialogHeader><div className="space-y-6 py-4">{/* Visual Settings */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-lg font-semibold text-white flex items-center gap-2"><><Eye className="h-5 w-5 text-terrafusion-cyan" />Visual Settings</CardTitle><CardDescription
</>className="text-gray-300">
                  Adjust visual display options for better readability</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div className="space-y-1"><><Label htmlFor="high-contrast" className="text-white font-medium">High Contrast Mode</Label><p
</>className="text-sm text-gray-400">
                      Increase color contrast for better visibility</p></div><><Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                    aria-describedby="high-contrast-description"
                  /></div><Separator
</>
className="bg-slate-700" /><div className="space-y-2"><><Label htmlFor="font-size" className="text-white font-medium">Font Size</Label><Select
</>

                    value={settings.fontSize}
                    onValueChange={(value) => handleSettingChange('fontSize', value)}
                  ><SelectTrigger 
                      id="font-size"
                      className="bg-slate-700 border-slate-600 text-white"
                      aria-label="Select font size"
                    ><><SelectValue /></SelectTrigger><SelectContent
</>
className="bg-slate-800 border-slate-600"><><SelectItem value="small" className="text-white hover:bg-slate-700">Small (14px)</SelectItem><SelectItem
</>value="medium" className="text-white hover:bg-slate-700">
                        Medium (16px)</SelectItem><><SelectItem value="large" className="text-white hover:bg-slate-700">Large (18px)</SelectItem><SelectItem
</>value="extra-large" className="text-white hover:bg-slate-700">
                        Extra Large (20px)</SelectItem></SelectContent></Select><p className="text-sm text-gray-400">Adjust text size throughout the application</p></div></CardContent></Card>{/* Motion & Animation Settings */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-lg font-semibold text-white flex items-center gap-2"><><Monitor className="h-5 w-5 text-terrafusion-cyan" />Motion & Animation</CardTitle><CardDescription
</>className="text-gray-300">
                  Control animations and motion effects</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between"><div className="space-y-1"><><Label htmlFor="reduced-motion" className="text-white font-medium">Reduce Motion</Label><p
</>className="text-sm text-gray-400">
                      Minimize animations and transitions that may cause discomfort</p></div><Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                    aria-describedby="reduced-motion-description"
                  /></div></CardContent></Card>{/* Keyboard & Focus Settings */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-lg font-semibold text-white flex items-center gap-2"><><Keyboard className="h-5 w-5 text-terrafusion-cyan" />Keyboard & Focus</CardTitle><CardDescription
</>className="text-gray-300">
                  Enhance keyboard navigation and focus indicators</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between"><div className="space-y-1"><><Label htmlFor="focus-visible" className="text-white font-medium">Enhanced Focus Indicators</Label><p
</>className="text-sm text-gray-400">
                      Show clear visual indicators when navigating with keyboard</p></div><Switch
                    id="focus-visible"
                    checked={settings.focusVisible}
                    onCheckedChange={(checked) => handleSettingChange('focusVisible', checked)}
                    aria-describedby="focus-visible-description"
                  /></div></CardContent></Card>{/* Screen Reader Settings */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-lg font-semibold text-white flex items-center gap-2"><><Volume2 className="h-5 w-5 text-terrafusion-cyan" />Screen Reader Support</CardTitle><CardDescription
</>className="text-gray-300">
                  Configure announcements and screen reader compatibility</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between"><div className="space-y-1"><><Label htmlFor="screen-reader-announcements" className="text-white font-medium">Screen Reader Announcements</Label><p
</>className="text-sm text-gray-400">
                      Enable live announcements for status changes and updates</p></div><Switch
                    id="screen-reader-announcements"
                    checked={settings.screenReaderAnnouncements}
                    onCheckedChange={(checked) => handleSettingChange('screenReaderAnnouncements', checked)}
                    aria-describedby="screen-reader-announcements-description"
                  /></div></CardContent></Card>{/* Reset Button */}<div className="flex justify-between items-center pt-4"><><Button
                variant="outline"
                onClick={resetToDefaults}
                className="border-slate-600 text-white hover:bg-slate-700"
              >Reset to Defaults</Button><Button
</>onClick={() => setIsOpen(false)}
                className="bg-gradient-to-r from-terrafusion-cyan to-blue-500 hover:from-terrafusion-cyan/80 hover:to-blue-600"
              >
                Done</Button></div></div></FocusTrap></DialogContent></Dialog>);
}

// Keyboard shortcut component for accessibility
export function AccessibilityShortcuts() {const { announce} = useAccessibility();

  React.useEffect(() => {const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + A: Open accessibility settings
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        const settingsButton = document.querySelector('[aria-label="Open accessibility settings"]') as HTMLElement;
        if (settingsButton) {
          settingsButton.click();
          announce('Accessibility settings opened', 'polite');}
      }

      // Alt + H: Navigate to main content
      if (event.altKey && event.key === 'h') {event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          announce('Navigated to main content', 'polite');}
      }

      // Alt + N: Navigate to navigation
      if (event.altKey && event.key === 'n') {event.preventDefault();
        const navigation = document.querySelector('[role="navigation"]');
        if (navigation) {
          (navigation as HTMLElement).focus();
          announce('Navigated to main navigation', 'polite');}
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [announce]);

  return null;
}

// Accessible loading component
interface AccessibleLoadingProps {isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;}

export function AccessibleLoading({isLoading, children, loadingText = "Loading..."}: AccessibleLoadingProps) {const { announce, isReducedMotion} = useAccessibility();

  React.useEffect(() => {if (isLoading) {
      announce(loadingText, 'polite');}
  }, [isLoading, loadingText, announce]);

  if (isLoading) {
    return (<div 
        className="flex items-center justify-center p-8"
        role="status"
        aria-live="polite"
        aria-label={loadingText}
      ><div 
          className={`h-8 w-8 border-4 border-terrafusion-cyan border-t-transparent rounded-full ${
            isReducedMotion ? '' : 'loading-spinner'}`}
          aria-hidden="true" /><><span className="ml-3 text-white">{loadingText}</span><span
</>
className="sr-only">{loadingText}</span></div>);
  }

  return<>{children}</>;
}