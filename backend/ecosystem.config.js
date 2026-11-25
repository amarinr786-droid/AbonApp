// ecosystem.config.js — configuración de PM2 para producción en EC2
module.exports = {
  apps: [
    {
      name: "abonapp-api",
      script: "src/index.js",
      cwd: __dirname,
      node_args: "--env-file-if-exists=.env",
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
