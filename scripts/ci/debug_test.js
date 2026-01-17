const fs = require('fs');
console.log("Writing debug file");
fs.writeFileSync("debug_sanity.txt", "It works!");
console.log("Written.");
