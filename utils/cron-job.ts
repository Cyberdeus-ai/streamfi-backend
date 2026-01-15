const { CronJob } = require('cron');

const getQuotesRepliesAndRTs = async () => {
  try {
    return console.log("Cron Job is running!");
  } catch (err) {
    return console.error(err);
  }
}

export const cron = new CronJob('0 */4 * * *', () => {
  getQuotesRepliesAndRTs();
});