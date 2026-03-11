const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const p = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('NixBot is running ✅');
}).listen(p);

function startBot() {
  const child = spawn(process.execPath, [path.join(__dirname, "nix.js")], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code) => {
    if (code === 2) {
      setTimeout(startBot, 1000);
    } else {
      process.exit(code || 0);
    }
  });
}

startBot();
