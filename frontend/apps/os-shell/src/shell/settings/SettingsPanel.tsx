/**
 * TerraFusion OS Settings Panel
 *
 * Comprehensive settings interface for user preferences.
 * Features TerraFusion glass morphism styling and full accessibility.
 *
 * Tabs:
 * - General: System info, language
 * - Appearance: Theme, accent colors
 * - Accessibility: High contrast, motion, font size
 * - Notifications: Toast prefs, auto-dismiss
 * - Shortcuts: Keyboard shortcuts reference
 * - About: Version info, credits
 *
 * @module shell/settings/SettingsPanel
 * @see Priority 8: Settings Panel
 */

import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '../../design-system/tokens/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { useThemeStore } from '../../stores/themeStore';

// ============================================================================
// Types
// ============================================================================

export type SettingsTab =
  | 'general'
  | 'appearance'
  | 'accessibility'
  | 'notifications'
  | 'shortcuts'
  | 'about';

export interface SettingsPanelProps {
  /** Initial tab to display */
  initialTab?: SettingsTab;
  /** Optional className */
  className?: string;
}

// ============================================================================
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  id: SettingsTab;
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, icon, isActive, onClick }) => (
  <button
    role='tab'
    id={`settings-tab-${id}`}
    aria-selected={isActive}
    aria-controls='settings-panel-content'
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 w-full px-4 py-3 rounded-lg',
      'text-left text-sm transition-all duration-150',
      'focus:outline-none focus-visible:ring-2',
      isActive ? 'border' : 'text-white/70 hover:bg-white/5 hover:text-white'
    )}
    style={
      {
        '--tw-ring-color': colors.brand.transcend[500],
        ...(isActive
          ? {
              backgroundColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.1),
              color: colors.brand.transcend[500],
              borderColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.3),
            }
          : {}),
      } as React.CSSProperties
    }
  >
    <span className='text-lg' aria-hidden='true'>
      {icon}
    </span>
    <span>{label}</span>
  </button>
);

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
}) => (
  <div className='flex items-center justify-between py-3'>
    <div className='flex-1'>
      <label htmlFor={id} className='text-sm font-medium text-white cursor-pointer'>
        {label}
      </label>
      {description && <p className='text-xs text-white/50 mt-0.5'>{description}</p>}
    </div>
    <button
      id={id}
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        checked ? '' : 'bg-white/20'
      )}
      style={
        {
          '--tw-ring-color': colors.brand.transcend[500],
          '--tw-ring-offset-color': colors.semantic.background.void,
          backgroundColor: checked ? colors.brand.transcend[500] : undefined,
        } as React.CSSProperties
      }
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      />
    </button>
  </div>
);

// ============================================================================
// Section Components
// ============================================================================

const GeneralSection: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>
          {t('settings.general.systemInfo', 'System Information')}
        </h3>
        <div className='bg-white/5 rounded-lg p-4 space-y-2'>
          <div className='flex justify-between'>
            <span className='text-white/60'>OS Version</span>
            <span className='text-white'>TerraFusion OS 1.0</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-white/60'>Build</span>
            <span className='text-white'>2025.01.04</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-white/60'>Environment</span>
            <span className='text-white'>Production</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>Language</h3>
        <div className='flex gap-3'>
          {['en', 'es'].map((lang) => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={cn(
                'px-4 py-2 rounded-lg border transition-all',
                i18n.language?.startsWith(lang)
                  ? ''
                  : 'border-white/20 text-white/70 hover:border-white/40'
              )}
              style={
                i18n.language?.startsWith(lang)
                  ? {
                      borderColor: colors.brand.transcend[500],
                      backgroundColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.1),
                      color: colors.brand.transcend[500],
                    }
                  : undefined
              }
            >
              {lang === 'en' ? 'English' : 'Español'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AppearanceSection: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();

  const themes: Array<{ id: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
    { id: 'light', label: t('settings.appearance.light', 'Light'), icon: '☀️' },
    { id: 'dark', label: t('settings.appearance.dark', 'Dark'), icon: '🌙' },
    { id: 'system', label: t('settings.appearance.system', 'System'), icon: '💻' },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>
          {t('settings.appearance.theme', 'Theme')}
        </h3>
        <div className='grid grid-cols-3 gap-3'>
          {themes.map((th) => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              aria-label={th.label}
              aria-pressed={theme === th.id}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                theme === th.id ? '' : 'border-white/20 text-white/70 hover:border-white/40'
              )}
              style={
                theme === th.id
                  ? {
                      borderColor: colors.brand.transcend[500],
                      backgroundColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.1),
                      color: colors.brand.transcend[500],
                    }
                  : undefined
              }
            >
              <span className='text-2xl'>{th.icon}</span>
              <span className='text-sm'>{th.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AccessibilitySection: React.FC = () => {
  const { t } = useTranslation();
  const {
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    fontSize,
    setFontSize,
  } = useThemeStore();

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>
          {t('settings.accessibility.visual', 'Visual')}
        </h3>
        <div className='space-y-1 divide-y divide-white/10'>
          <ToggleSwitch
            id='high-contrast'
            label={t('settings.accessibility.highContrast', 'High Contrast')}
            description='Increase contrast for better visibility'
            checked={highContrast}
            onChange={toggleHighContrast}
          />
          <ToggleSwitch
            id='reduced-motion'
            label={t('settings.accessibility.reduceMotion', 'Reduce Motion')}
            description='Minimize animations and transitions'
            checked={reducedMotion}
            onChange={toggleReducedMotion}
          />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>
          {t('settings.accessibility.typography', 'Typography')}
        </h3>
        <div>
          <div className='flex justify-between mb-2'>
            <label htmlFor='font-size' className='text-sm text-white/70'>
              {t('settings.accessibility.fontSize', 'Font Size')}
            </label>
            <span className='text-sm' style={{ color: colors.brand.transcend[500] }}>
              {fontSize}%
            </span>
          </div>
          <input
            id='font-size'
            type='range'
            min='75'
            max='200'
            step='5'
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className='w-full'
            style={{ accentColor: colors.brand.transcend[500] }}
            aria-label={t('settings.accessibility.fontSize', 'Font Size')}
          />
          <div className='flex justify-between text-xs text-white/40 mt-1'>
            <span>75%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationsSection: React.FC = () => {
  const notifications = useSettingsStore((state) => state.notifications);
  const {
    setNotificationEnabled,
    setShowToasts,
    setAutoDismissMs,
    setPlaySound,
    setShowModuleLaunch,
    setShowSystemEvents,
  } = useSettingsStore();

  const autoDismissOptions = [
    { value: 0, label: 'Never' },
    { value: 3000, label: '3 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>Notification Settings</h3>
        <div className='space-y-1 divide-y divide-white/10'>
          <ToggleSwitch
            id='notifications-enabled'
            label='Enable Notifications'
            description='Show all notifications'
            checked={notifications.enabled}
            onChange={setNotificationEnabled}
          />
          <ToggleSwitch
            id='show-toasts'
            label='Show Toast Popups'
            description='Display notification toasts on screen'
            checked={notifications.showToasts}
            onChange={setShowToasts}
          />
          <ToggleSwitch
            id='play-sound'
            label='Play Sound'
            description='Play sound when notification arrives'
            checked={notifications.playSound}
            onChange={setPlaySound}
          />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>Auto-Dismiss</h3>
        <div className='grid grid-cols-2 gap-2'>
          {autoDismissOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setAutoDismissMs(option.value)}
              aria-pressed={notifications.autoDismissMs === option.value}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm transition-all',
                notifications.autoDismissMs === option.value
                  ? ''
                  : 'border-white/20 text-white/70 hover:border-white/40'
              )}
              style={
                notifications.autoDismissMs === option.value
                  ? {
                      borderColor: colors.brand.transcend[500],
                      backgroundColor: colors.utils.withOpacity(colors.brand.transcend[500], 0.1),
                      color: colors.brand.transcend[500],
                    }
                  : undefined
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold text-white mb-4'>Notification Types</h3>
        <div className='space-y-1 divide-y divide-white/10'>
          <ToggleSwitch
            id='show-module-launch'
            label='Module Launch'
            description='Notify when modules are opened'
            checked={notifications.showModuleLaunch}
            onChange={setShowModuleLaunch}
          />
          <ToggleSwitch
            id='show-system-events'
            label='System Events'
            description='Notify for system updates and alerts'
            checked={notifications.showSystemEvents}
            onChange={setShowSystemEvents}
          />
        </div>
      </div>
    </div>
  );
};

const ShortcutsSection: React.FC = () => {
  const { keyboardShortcuts } = useSettingsStore();

  const categories = [
    { id: 'modules', label: 'Modules', icon: '📦' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'windows', label: 'Windows', icon: '🪟' },
    { id: 'system', label: 'System', icon: '⚙️' },
  ] as const;

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold text-white mb-2'>Keyboard Shortcuts</h3>
        <p className='text-sm text-white/50 mb-4'>Quick access to TerraFusion OS features</p>
      </div>

      {categories.map((category) => {
        const shortcuts = keyboardShortcuts.filter((s) => s.category === category.id);
        if (shortcuts.length === 0) return null;

        return (
          <div key={category.id}>
            <h4 className='text-sm font-medium text-white/70 mb-3 flex items-center gap-2'>
              <span>{category.icon}</span>
              {category.label}
            </h4>
            <div className='bg-white/5 rounded-lg divide-y divide-white/10'>
              {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className='flex items-center justify-between px-4 py-3'>
                  <span className='text-sm text-white/80'>{shortcut.action}</span>
                  <kbd
                    className='px-2 py-1 bg-white/10 rounded text-xs font-mono'
                    style={{ color: colors.brand.transcend[500] }}
                  >
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AboutSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className='space-y-6'>
      <div className='text-center py-8'>
        <div
          className='w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center'
          style={{
            background: colors.gradient.primary,
            boxShadow: `0 0 30px ${colors.utils.withOpacity(colors.brand.transcend[500], 0.3)}`,
          }}
        >
          <span className='text-3xl font-bold' style={{ color: colors.semantic.background.void }}>
            TF
          </span>
        </div>
        <h2 className='text-2xl font-bold text-white'>TerraFusion OS</h2>
        <p className='text-white/60 mt-1'>Government-Grade Desktop Experience</p>
      </div>

      <div className='bg-white/5 rounded-lg p-4 space-y-3'>
        <div className='flex justify-between'>
          <span className='text-white/60'>Version</span>
          <span className='text-white'>1.0.0</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-white/60'>Build Date</span>
          <span className='text-white'>January 4, 2025</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-white/60'>License</span>
          <span className='text-white'>Proprietary</span>
        </div>
      </div>

      <div className='text-center text-sm text-white/40'>
        <p>{t('settings.about.copyright', '© 2025 TerraFusion. All rights reserved.')}</p>
        <p className='mt-2'>Built with ❤️ for government excellence</p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  initialTab = 'general',
  className,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: 'general', label: t('settings.tabs.general', 'General'), icon: '⚙️' },
    { id: 'appearance', label: t('settings.tabs.appearance', 'Appearance'), icon: '🎨' },
    { id: 'accessibility', label: t('settings.tabs.accessibility', 'Accessibility'), icon: '♿' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'about', label: t('settings.tabs.about', 'About'), icon: 'ℹ️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'accessibility':
        return <AccessibilitySection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'shortcuts':
        return <ShortcutsSection />;
      case 'about':
        return <AboutSection />;
      default:
        return null;
    }
  };

  return (
    <div
      data-testid='settings-panel'
      className={cn('flex h-full min-h-[500px]', 'text-white', className)}
      style={{
        backgroundColor: colors.semantic.background.void,
      }}
    >
      {/* Sidebar */}
      <nav
        className='w-56 border-r border-white/10 p-4 flex flex-col gap-1'
        role='tablist'
        aria-orientation='vertical'
        aria-label='Settings navigation'
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>

      {/* Content */}
      <main
        id='settings-panel-content'
        role='tabpanel'
        aria-labelledby={`settings-tab-${activeTab}`}
        className='flex-1 p-8 overflow-y-auto'
      >
        {renderContent()}
      </main>
    </div>
  );
};

export default SettingsPanel;
