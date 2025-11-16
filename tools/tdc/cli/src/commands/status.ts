/**
 * TDC Status Command
 * Show health status of all TerraFusion services
 */

import chalk from 'chalk';
import fetch from 'node-fetch';
import ora from 'ora';

interface ServiceStatus {
  name: string;
  url: string;
  healthy: boolean;
  responseTime?: number;
}

export async function statusCommand(): Promise<void> {
  const spinner = ora('Checking TerraFusion services...').start();

  const services: ServiceStatus[] = [];

  // Check .NET API (port 5000)
  services.push(await checkService('TerraFusion API', 'http://localhost:5000/health'));

  // Check .NET Consciousness (port 3004)
  services.push(await checkService('Consciousness Engine', 'http://localhost:3004/health'));

  // Check Rust IDE Backend (port 8787)
  services.push(await checkService('Rust IDE Backend', 'http://localhost:8787/api/health'));

  // Check Portal Frontend (port 5173)
  services.push(await checkService('Portal Frontend', 'http://localhost:5173'));

  spinner.stop();

  console.log(chalk.bold('\n⚡ TerraFusion OS Status\n'));

  for (const service of services) {
    const icon = service.healthy ? '✅' : '❌';
    const time = service.responseTime ? chalk.gray(`(${service.responseTime}ms)`) : '';
    console.log(`${icon} ${service.name.padEnd(25)} ${time}`);
  }

  const allHealthy = services.every(s => s.healthy);
  console.log(
    `\n${allHealthy ? chalk.green('● All systems operational') : chalk.yellow('● Some services unavailable')}\n`
  );
}

async function checkService(name: string, url: string): Promise<ServiceStatus> {
  try {
    const start = Date.now();
    const response = await fetch(url, { timeout: 2000 });
    const responseTime = Date.now() - start;

    return {
      name,
      url,
      healthy: response.ok,
      responseTime,
    };
  } catch {
    return {
      name,
      url,
      healthy: false,
    };
  }
}
