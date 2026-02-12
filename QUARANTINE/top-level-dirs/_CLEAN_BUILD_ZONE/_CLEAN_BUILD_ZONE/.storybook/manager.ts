/**
 * Storybook Manager Configuration
 *
 * Customizes Storybook UI with TerraFusion branding
 */

import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

const terraFusionTheme = create({
  base: 'dark',

  // Brand
  brandTitle: 'TerraFusion OS',
  brandUrl: 'https://terrafusion.gov',
  brandImage: undefined,
  brandTarget: '_self',

  // UI Colors
  colorPrimary: '#00FFFF',
  colorSecondary: '#0080FF',

  // UI
  appBg: '#0A0E1A',
  appContentBg: '#1E293B',
  appBorderColor: 'rgba(0, 255, 255, 0.2)',
  appBorderRadius: 8,

  // Text colors
  textColor: '#FFFFFF',
  textInverseColor: '#0A0E1A',
  textMutedColor: '#94A3B8',

  // Toolbar default and active colors
  barTextColor: '#94A3B8',
  barSelectedColor: '#00FFFF',
  barBg: '#1E293B',

  // Form colors
  inputBg: '#0A0E1A',
  inputBorder: 'rgba(0, 255, 255, 0.2)',
  inputTextColor: '#FFFFFF',
  inputBorderRadius: 4,
});

addons.setConfig({
  theme: terraFusionTheme,
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
