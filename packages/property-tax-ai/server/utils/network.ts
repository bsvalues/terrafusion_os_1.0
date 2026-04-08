import { createServer } from 'net';

/**
 * Find an available port starting from the given port number
 * @param startPort The port number to start checking from
 * @returns A promise that resolves to an available port number
 */
export async function getPort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 1000; port++) {
    try {
      const available = await isPortAvailable(port);
      if (available) {
        return port;
      }
    } catch (err) {
      // Continue to the next port
      continue;
    }
  }
  throw new Error(`Could not find an available port in range ${startPort}-${startPort + 1000}`);
}

/**
 * Check if a port is available
 * @param port The port number to check
 * @returns A promise that resolves to true if the port is available, false otherwise
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}