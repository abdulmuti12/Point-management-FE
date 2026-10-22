module.exports = {
  apps: [
    {
      name: 'fe-point',
      cwd: '/var/www/html/Point-management-FE',
      script: 'npm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      out_file: '/var/www/html/Point-management-FE/logs/fe-point-out.log',
      error_file: '/var/www/html/Point-management-FE/logs/fe-point-err.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
