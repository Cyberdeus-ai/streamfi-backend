import { createPostList, findTweetList } from '../services/post.service';
import { findEngagerList } from '../services/user.service';
import { getQuotesByTweetId, getTweetsBySearch } from '../utils/scrapter';

export const fillTweetListHandler = async (query: string, userId: any, campaignId: any): Promise<void> => {
     try {
        const tweets = await getTweetsBySearch(query);
        const tweetIdList = JSON.parse(tweets)?.results.filter((tweet: any) => tweet.retweet === false).map((filtered: any) => filtered.tweet_id);
        await createPostList(tweetIdList.map((id: number) => {
            return {
                tweet_id: id,
                type: "tweet",
                user: userId,
                campaign: campaignId
            } 
        }));
     } catch (err) {
        console.error(err);
     }
}

export const fillQuoteListHandler = async (): Promise<void> => {
    const engagerList = await findEngagerList();

    const TweetList = await findTweetList();

    await Promise.all(TweetList.map(async (post: any) => {
        await getQuotesByTweetId(post.tweet_id);
    }));
}