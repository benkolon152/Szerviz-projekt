const fs = require("fs");
const s = fs.readFileSync("express.cjs", "utf8");
const lines = s.split(/\r?\n/);
let pc = 0,
  cc = 0,
  bc = 0,
  tc = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === "(") pc++;
    if (ch === ")") pc--;
    if (ch === "{") cc++;
    if (ch === "}") cc--;
    if (ch === "[") bc++;
    if (ch === "]") bc--;
    if (ch === "`") tc++;
  }
  if (i > 980 && i < 1060)
    console.log(
      i + 1 + " ",
      "(p:" + pc + " c:" + cc + " b:" + bc + " t:" + tc + ") ",
      line,
    );
}
console.log("FINAL", { parens: pc, curly: cc, brackets: bc, ticks: tc });
