/**
 * Vite Security Plugin
 *
 * Adds security headers and Content Security Policy (CSP) to development server.
 * For production, these headers should be configured at the web server level (Nginx/IIS).
 */

import type { Plugin } from 'vite';

export function securityPlugin(): Plugin {
  return {
    name: 'terrafusion-security-headers',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Security headers for development
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security Policy (CSP) - permissive for development
        // In production, this should be much stricter and configured at web server level
        const cspDirectives = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for dev HMR
          "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for styled-components/CSS-in-JS
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' ws: wss: http://localhost:* https://localhost:*", // WebSocket for HMR + backend API
          "media-src 'self'",
          "object-src 'none'",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');

        res.setHeader('Content-Security-Policy', cspDirectives);

        next();
      });
    },

    configurePreviewServer(server) {
      // Apply same headers to preview server
      server.middlewares.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Stricter CSP for preview (closer to production)
        const cspDirectives = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'", // Still need unsafe-inline for some frameworks
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "media-src 'self'",
          "object-src 'none'",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');

        res.setHeader('Content-Security-Policy', cspDirectives);

        next();
      });
    },
  };
}

/**
 * Production CSP Recommendation (configure at web server level):
 *
 * Content-Security-Policy:
 *   default-src 'self';
 *   script-src 'self' 'sha256-{hash}';  // Use hashes for inline scripts
 *   style-src 'self' 'sha256-{hash}';   // Use hashes for inline styles
 *   img-src 'self' data: https:;
 *   font-src 'self' data:;
 *   connect-src 'self' https://api.terrafusion.gov;
 *   media-src 'self';
 *   object-src 'none';
 *   frame-ancestors 'none';
 *   base-uri 'self';
 *   form-action 'self';
 *   upgrade-insecure-requests;
 *   block-all-mixed-content;
 *
 * Additional Production Headers:
 *   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
 *   Permissions-Policy: geolocation=(), microphone=(), camera=()
 */
