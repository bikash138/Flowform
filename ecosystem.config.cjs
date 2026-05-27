/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: "flowform-web",
      cwd: "./apps/web",
      script: "pnpm",
      args: "start",
      shell: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "flowform-api",
      cwd: "./apps/api",
      script: "pnpm",
      args: "start",
      shell: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
