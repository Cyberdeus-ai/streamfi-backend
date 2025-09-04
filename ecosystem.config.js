module.exports = {
  apps: [
    // Express Backend
    {
      name: 'streamfi-backend',
      cwd: '~/streamfi-backend',
      script: 'npm',
      args: 'run dev',
      repo: 'git@github.com/Cyberdeus-ai/streamfi-backend.git',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        DATABASE_URL: 'postgres://postgres:password@84.32.22.56:5432/template1',
      },
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    // Next.js Frontend
    {
      name: 'streamfi-frontend',
      cwd: '~/streamfi-frontend',
      script: 'npm',
      args: 'run dev',
      repo: 'git@github.com/Cyberdeus-ai/streamfi-frontend.git',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      autorestart: true,
      watch: true,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],

  deploy: {
    production: {
      'user': 'root',
      'host': '84.32.22.56',
      'ref': 'origin/main',
      'repo': 'git@github.com/Cyberdeus-ai/streamfi-backend.git',
      'path': '~/streamfi-backend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js'
    },
    frontend: {
      'user': 'root',
      'host': '84.32.22.56',
      'ref': 'origin/main',
      'repo': 'git@github.com/Cyberdeus-ai/streamfi-frontend.git',
      'path': '~/streamfi-frontend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js'
    },
  },
};
