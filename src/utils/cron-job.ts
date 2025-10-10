const { CronJob } = require('cron');

import {
  getTweetListHandler,
  fillQuoteListHandler,
  fillReplyListHandler,
  fillRetweetListHandler
} from "../controllers/post.controller";

import { getEngagerListHandler } from '../controllers/user.controller';

const getQuotesRepliesAndRTs = async () => {
  try {
    // const tweetList = await getTweetListHandler();
    // const engagerList = await getEngagerListHandler();
    // if (tweetList && tweetList.length > 0) {
    //   await fillReplyListHandler(tweetList, engagerList);
    //   await fillRetweetListHandler(tweetList, engagerList);
    //   await fillQuoteListHandler(tweetList, engagerList);
    // }
    return console.log("Cron Job is running!");
  } catch (err) {
    return console.error(err);
  }
}

export const cron = new CronJob('0 * * * *', () => {
  getQuotesRepliesAndRTs();
});