const { CronJob } = require('cron');
import { fillQuoteListHandler } from "../controllers/post.controller";

const getQuotesRepliesAndRTs = () => {
  
}

export const cron = new CronJob('* * * * *', () => {
  getQuotesRepliesAndRTs();
});