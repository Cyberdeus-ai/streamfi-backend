import { Request, Response, NextFunction } from 'express';
import { findPostList, findTweetList, savePost, insertPostList, updatePost } from '../services/post.service';
import { getQuotesByTweetId, getRepliesByTweetId, getRetweetsByTweetId, getTweetsBySearch } from '../utils/scrapter';

export const getTweetListHandler = async () => {
    try {
        const tweetList = await findTweetList();
        return tweetList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const fillTweetListHandler = async (query: string, userId: any, campaignId: any): Promise<void> => {
    try {
        const tweets = await getTweetsBySearch(query);
        const filteredList = JSON.parse(tweets)?.results.filter((tweet: any) => tweet.retweet === false)?.map(
            (filtered: any) => {
                return {
                    tweet_id: filtered.tweet_id,
                    type: "tweet",
                    tweet_account: filtered.user.username,
                    user: userId,
                    campaign: campaignId,
                    timestamp: new Date(filtered.timestamp * 1000)
                }
            }
        );
        await insertPostList(filteredList);
    } catch (err) {
        console.error(err);
    }
}

export const fillQuoteListHandler = async (tweetList: any[]): Promise<void> => {
    try {
        const res = await Promise.all(tweetList.map(async (post: any) => {
            return await getQuotesByTweetId(post.tweet_id);
        }));

        console.log("Quotes: ", res);

        let postList = [];

        if (res && res.length > 0) {
            postList = res.flatMap((item: any, index: any) => {
                if (JSON.parse(item).results && JSON.parse(item).results.length > 0) {
                    return JSON.parse(item)?.results?.map((quote: any) => {
                        return {
                            tweet_id: tweetList[index].tweet_id,
                            type: 'quote',
                            timestamp: quote.timestamp,
                            tweet_account: quote.user.username,
                            campaign: tweetList[index].campaign_id
                        };
                    });
                } else {
                    return [];
                }
            });
        }

        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
        return;
    }
}

export const fillReplyListHandler = async (tweetList: any[]): Promise<void> => {
    try {
        const res = await Promise.all(tweetList.map(async (post: any) => {
            return await getRepliesByTweetId(post.tweet_id);
        }));

        console.log("Replies: ", res);

        let postList = [];

        if (res && res.length > 0) {
            postList = res.flatMap((item: any, index: any) => {
                if (JSON.parse(item).replies && JSON.parse(item).replies.length > 0) {
                    return JSON.parse(item).replies?.map((reply: any) => {
                        return {
                            tweet_id: tweetList[index].tweet_id,
                            type: 'reply',
                            timestamp: new Date(reply.timestamp * 1000),
                            tweet_account: reply.user.username,
                            campaign: tweetList[index].campaign_id
                        };
                    });
                } else {
                    return [];
                }
            });
        }

        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
    }
}

export const fillRetweetListHandler = async (tweetList: any[]): Promise<void> => {
    try {
        const res = await Promise.all(tweetList.map(async (post: any) => {
            return await getRetweetsByTweetId(post.tweet_id);
        }));

        console.log("Retweets: ", res);

        let postList = [];

        if (res && res.length > 0) {
            postList = res.flatMap((item: any, index: any) => {
                if (JSON.parse(item).retweets && JSON.parse(item).retweets.length > 0) {
                    return JSON.parse(item)?.retweets?.map((retweet: any) => {
                        return {
                            tweet_id: tweetList[index].tweet_id,
                            type: 'retweet',
                            timestamp: new Date(retweet.timestamp * 1000),
                            tweet_account: retweet.user.username,
                            campaign: tweetList[index].campaign_id
                        };
                    });
                } else {
                    return [];
                }
            });
        }

        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
    }
}

export const createPostHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const newPost = await savePost({
            tweet_id: req.body.tweet_id,
            type: req.body.type,
            tweet_account: req.body.username,
            user: req.body.userId,
            campaign: req.body.campaignId,
            timestamp: new Date(req.body.timestamp * 1000)
        });

        res.status(200).json({
            result: true,
            newPost
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const getPostListHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const postList = await findPostList();

        res.status(200).json({
            result: true,
            postList
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}