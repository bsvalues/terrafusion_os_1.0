const fs = require('fs');

const file = 'frontend/src/components/ui/Combobox.stories.tsx';
let content = fs.readFileSync(file, 'utf8');

const pattern = /aria-expanded=\{open\}/g;
const before = (content.match(pattern) || []).length;

content = content.replace(pattern, 'aria-expanded={open ? "true" : "false"}');

const after = (content.match(pattern) || []).length;

fs.writeFileSync(file, content);

console.log(`✅ Fixed: ${before - after} instances`);
console.log(`Remaining aria-expanded={open}: ${after}`);
