export { default as terraFusionTheme, generateCSSVariables } from './TerraFusionTheme';
export type { TerraFusionTheme } from './TerraFusionTheme';

export {
  TerraFusionGlobalStyles,
  TFContainer,
  TFCard,
  TFButton,
  TFInput,
  TFText,
  TFHeading,
  TFGrid,
  TFFlex,
  TFBadge,
  TFSpinner,
  TFProgress
} from './TerraFusionComponents';

// Re-export everything for easy imports
export * from './TerraFusionTheme';
export * from './TerraFusionComponents';