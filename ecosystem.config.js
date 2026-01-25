module.exports = {
    apps: [
        {
            name: "backend",
            script: "npm run dev:all"
        }
    ],

    deploy: {
        production: {
            user: "root",
            host: "84.32.131.44",
            ref: "origin/main",
            repo: "https://github.com/Cyberdeus/streamfi-backend.git",
            path: "/root/var/streamfi-backend",
            "post-deploy": "npm install && pm2 startOrRestart ecosystem.config.js --name BACKEND"
        }
    }
}