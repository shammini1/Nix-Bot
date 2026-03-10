const { spawn } = require("child_process");
const path = require("path");

function startBot() {
  const child = spawn(process.execPath, [path.join(__dirname, "nix.js")], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code) => {
    if (code === 2) {
      console.log("🔄 Bot requested restart restarting...");
      setTimeout(startBot, 1500);
    } else {
      console.log(`🔄 Bot exited with code ${code}`);
      process.exit(code || 0);
    }
  });
}

startBot();
