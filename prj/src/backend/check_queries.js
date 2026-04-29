const fs = require('fs');
const s = fs.readFileSync('express.cjs','utf8');
const lines = s.split(/\r?\n/);
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('await pool.query(')){
    let found=false;
    for(let j=i;j<Math.min(lines.length,i+15);j++){
      if(lines[j].includes(');')){found=true; break;}
    }
    if(!found) console.log('Possible missing close for pool.query at line', i+1, ':', lines[i]);
  }
}
