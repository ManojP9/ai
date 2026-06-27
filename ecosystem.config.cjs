// pm2 process config for the 3C Foods / AI Engineering tracker app.
// Manage with:  pm2 start ecosystem.config.cjs  |  pm2 restart ai-foods  |  pm2 logs ai-foods
// Change the port below (or set PORT in the env) — next start respects PORT.
module.exports = {
  apps: [
    {
      name: "ai-foods",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
  ],
};
