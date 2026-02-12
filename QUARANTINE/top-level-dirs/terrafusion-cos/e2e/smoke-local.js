// Lightweight local smoke test that parses the Brand_Assets HTML file on disk
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  '..',
  'Brand_Assets',
  'webgl-transcendence-complete.html'
);
const html = fs.readFileSync(filePath, 'utf8');

const containsHeadline =
  /<h1[^>]*class="hero-headline"[^>]*>\s*Government\. Transcended\.<\/h1>/m.test(html);
const containsBadge = /class="transcendence-badge"/m.test(html);
const containsSpeed = /id="speed-metric"[\s\S]*?>\s*\w+/m.test(html);

console.log('Headline present:', containsHeadline);
console.log('Badge present:', containsBadge);
console.log('Speed metric present:', containsSpeed);

if (!containsHeadline || !containsBadge || !containsSpeed) {
  console.error('Local smoke check failed');
  process.exit(2);
}

console.log('Local smoke test passed');
process.exit(0);
