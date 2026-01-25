import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { AppDataSource } from './utils/data-source';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { startWeb3SocialsRealtime } from './graphql/services/web3-socials.service';

dotenv.config();

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const domain = process.env.DOMAIN || 'pollenfi.xyz';
const sslKeyPath = process.env.SSL_KEY_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/privkey.pem` : path.join(__dirname, '../certs/key.pem'));
const sslCertPath = process.env.SSL_CERT_PATH || (isProduction ? `/etc/letsencrypt/live/${domain}/fullchain.pem` : path.join(__dirname, '../certs/cert.pem'));

let server: https.Server | http.Server;
let useHttps = false;

if (isProduction || (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath))) {
    try {
        const httpsOptions = {
            key: fs.readFileSync(sslKeyPath),
            cert: fs.readFileSync(sslCertPath),
        };
        server = https.createServer(httpsOptions, app);
        useHttps = true;
    } catch (error) {
        console.warn('Failed to load SSL certificates, falling back to HTTP:', error);
        server = http.createServer(app);
    }
} else {
    server = http.createServer(app);
    if (!isProduction) {
        console.warn('SSL certificates not found. Using HTTP. Run: npm run generate-certs');
    }
}

const graphqlPort = process.env.GRAPHQL_PORT || 5001;

AppDataSource.initialize().then(async () => {
    console.log("Database connected (GraphQL Server)");

    const schema = makeExecutableSchema({ typeDefs, resolvers });

    const wsServer = new WebSocketServer({
        server: server,
        path: '/graphql',
    });

    const serverCleanup = useServer({ schema }, wsServer);

    const apolloServer = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer: server }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    await apolloServer.start();

    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        bodyParser.json(),
        expressMiddleware(apolloServer) as any,
    );

    await startWeb3SocialsRealtime();

    server.listen(graphqlPort, () => {
        const protocol = useHttps ? 'https' : 'http';
        const wsProtocol = useHttps ? 'wss' : 'ws';
        console.log(`🚀 GraphQL Server running on port ${graphqlPort} (${useHttps ? 'HTTPS' : 'HTTP'})`);
        console.log(`🚀 GraphQL endpoint: ${protocol}://localhost:${graphqlPort}/graphql`);
        console.log(`🚀 Subscriptions: ${wsProtocol}://localhost:${graphqlPort}/graphql`);
    });
}).catch((error) => {
    console.error('GraphQL Server Error: ', error);
});

