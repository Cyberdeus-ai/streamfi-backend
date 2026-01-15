import express from "express";
import bodyParser from "body-parser"
import dotenv from "dotenv";

import { AppDataSource } from "./utils/data-source";

const cors = require("cors");
dotenv.config();

import router from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { cron } from "./utils/cron-job";
import path from "path";
const app: express.Application = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', router);
app.use(errorHandler);
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 5000;

AppDataSource.initialize().then(() => {
    console.log("Database connected");
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    cron.start();
}).catch((error) => {
    console.error('Error: ', error);
});