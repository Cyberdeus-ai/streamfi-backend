const { CronJob } = require('cron');

import {
  getTweetListHandler,
  fillQuoteListHandler,
  fillReplyListHandler,
  fillRetweetListHandler
} from "../controllers/post.controller";

const getQuotesRepliesAndRTs = async () => {
  try {
    // const tweetList = await getTweetListHandler();
    // if (tweetList && tweetList.length > 0) {
    //   await fillQuoteListHandler(tweetList);
    //   await fillReplyListHandler(tweetList); 
    //   await fillRetweetListHandler(tweetList);
    // }
    return console.log("Cron Job is running!");
  } catch (err) {
    return console.error(err);
  }
}

export const cron = new CronJob('* * * * *', () => {
  getQuotesRepliesAndRTs();
});