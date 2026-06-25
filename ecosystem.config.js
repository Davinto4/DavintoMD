module.exports = {
  apps: [{
    name: "DavintoMD",
    script: "./index.js",
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
    }
  }]
};
