import { defineConfig } from 'npm:vite@5.2.11';
import react from 'npm:@vitejs/plugin-react@4.2.1';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: '.', 
  resolve: { alias: { '@': path.resolve(Deno.cwd(), './src') } },
  server: {
    host: '0.0.0.0',
    port: 3007,
    strictPort: true,
  }
});
