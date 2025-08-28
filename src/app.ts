import express from 'express';
import { AppDataSource } from "./utils/data-source";
import dotenv from "dotenv";
import bodyParser from "body-parser";
const cors = require("cors");

import router from "./routes";
import { errorHandler } from './middlewares/errorHandler';
import { cron } from './utils/cron-job';

dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', router);
app.use(errorHandler);

const port = process.env.PORT || 5000;

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) =>  console.log('Error: ', error));

cron.start();