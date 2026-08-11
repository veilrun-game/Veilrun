/* Extract the inline <script> from index.html and syntax-check it.
   Usage: node _check.js   (run from games/proving-ground/) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!blocks.length) { console.error("no inline script found"); process.exit(1); }
blocks.forEach((src, i) => {
  try { new vm.Script(src, { filename: "index.html#inline" + i }); }
  catch (e) { console.error("SYNTAX ERROR in inline script " + i + ":\n" + e.message); process.exit(1); }
});
console.log("node --check: " + blocks.length + " inline script(s) OK (" +
  blocks.reduce((a, b) => a + b.split("\n").length, 0) + " lines)");
