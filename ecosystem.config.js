module.exports = {
    apps: [
        {
            name: 'streamfi-backend',
            script: 'npm run dev'
        }
    ],

    deploy: {
        production: {
            user: 'root',
            host: '84.32.22.56',
            ref: 'origin/main',
            repo: 'https://github.com/Cyberdeus-ai/streamfi-backend.git',
            path: '~/streamfi-backend',
            'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --name BACKEND'
        },
    },
};