const fs = require('fs');
const s = fs.readFileSync('express.cjs','utf8');
const lines = s.split(/\r?\n/);
const stackCurly = [];
const stackParen = [];
for(let i=0;i<lines.length;i++){
  const line = lines[i];
  for(let j=0;j<line.length;j++){
    const ch = line[j];
    if(ch==='{') stackCurly.push({line:i+1,col:j+1});
    if(ch==='}'){
      if(stackCurly.length===0){ console.log('Extra closing } at', i+1,j+1); }
      else stackCurly.pop();
    }
    if(ch==='(') stackParen.push({line:i+1,col:j+1, ch: line.slice(j, j+20)});
    if(ch===')'){
      if(stackParen.length===0){ console.log('Extra closing ) at', i+1,j+1); }
      else stackParen.pop();
    }
  }
}
if(stackCurly.length) console.log('Unmatched { count', stackCurly.length, 'examples', stackCurly.slice(-5));
if(stackParen.length) console.log('Unmatched ( count', stackParen.length, 'examples', stackParen.slice(-5));
