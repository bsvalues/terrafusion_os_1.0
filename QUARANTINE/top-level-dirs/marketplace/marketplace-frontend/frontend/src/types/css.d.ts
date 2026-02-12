/**
 * TypeScript CSS Module Declarations
 * 
 * Allows TypeScript to recognize CSS/SCSS file imports as side-effect modules
 * Required for: import './Component.css'
 */

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}
