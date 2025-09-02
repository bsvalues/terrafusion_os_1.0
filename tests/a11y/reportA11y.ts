import fs from 'node:fs'; 
import path from 'node:path';

export function writeA11yViolations(count: number) {
  const p = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(p)) fs.mkdirSync(p);
  fs.writeFileSync(path.join(p, 'a11y.json'), JSON.stringify({ violations: count }));
}