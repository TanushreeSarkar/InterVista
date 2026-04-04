const fs = require('fs');
const files = ['c:/Users/sarka/InterVista/web/src/app/evaluation/[id]/page.tsx', 'c:/Users/sarka/InterVista/web/src/app/interview/[id]/page.tsx'];
for(let f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\\`\\$\\{/g, '`${');
  c = c.replace(/\\`\\`/g, '``');
  c = c.replace(/\\`/g, '`');
  fs.writeFileSync(f, c);
}
console.log('Fixed syntax errors');
