import { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import { findPostList, findTweetList, savePost, insertPostList, updatePost } from '../services/post.service';
import {
    getQuotesByTweetId,
    getQuotesContinuationByTweetId,
    getRepliesByTweetId,
    getRepliesContinuationByTweetId,
    getRetweetsByTweetId,
    getRetweetsContinuationByTweetId,
    getTweetsByUser,
    getTweetsContinuationByUser
} from '../utils/scraper';
import { insertContinuationList, updateContinuation } from '../services/continuation.service';

export const getTweetListHandler = async () => {
    try {
        const tweetList = await findTweetList();
        return tweetList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const fillTweetListHandler = async (hashtags: string[], tickers: string[], handles: string[], userId: any, campaignId: any) => {
    try {
        const postListArrays = await Promise.all(
            handles.map(async (handle) => {
                let tweetList: any[] = [];
                let res = await getTweetsByUser(handle);
                res.results?.forEach((item: any) => {
                    tweetList.push(item);
                });
                let continuation_token = res.continuation_token;
                while (1) {
                    res = await getTweetsContinuationByUser(handle, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.results ===undefined || res.results?.length < 1) break;
                    res.results.forEach((item: any) => {
                        tweetList.push(item);
                    });
                }
                const filtered = tweetList.filter((tweet: any) => {
                    const flag1 = hashtags.length > 0 ? hashtags.some((hashtag) => tweet.text.includes(hashtag)) : true;
                    const flag2 = hashtags.length > 0 ? hashtags.some((hashtag) => tweet.user.description.includes(hashtag)) : true;
                    const flag3 = tickers.length > 0 ? tickers.some((ticker) => tweet.text.includes(ticker)) : true;
                    const flag4 = tickers.length > 0 ? tickers.some((ticker) => tweet.user.description.includes(ticker)) : true;
                    return (flag1 || flag2) && (flag3 || flag4);
                });

                return filtered.map((filter: any) => {
                    return {
                        tweet_id: filter.tweet_id,
                        type: "tweet",
                        user: userId,
                        campaign: campaignId,
                        timestamp: moment(filter.timestamp * 1000)
                    }
                });
            })
        );

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            await insertPostList(postList);
            await insertContinuationList(postList.map((post: any) => {
                return { post: post.id };
            }))
        }
    } catch (err) {
        console.error(err);
    }
}

export const fillQuoteListHandler = async (tweetList: any[], engagerList: any[]) => {
    try {
        const postListArrays = await Promise.all(
            tweetList.map(async (post: any, index: number) => {
                let list: any[] = [];
                let res;
                let continuation_token;
                if (post.continuation.quote_id === null) {
                    res = await getQuotesByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.continuation.quote_id;
                while (1) {
                    res = await getQuotesContinuationByTweetId(post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.results === undefined || res.results?.length < 1) break;
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.id, { quote_id: continuation_token });
                return list.filter((item: any) => {
                    return engagerList.findIndex((engager) => {
                        return engager.xaccount.username === item.user.username
                    }) > -1;
                })?.map((filtered: any) => {
                    return {
                        tweet_id: tweetList[index].tweet_id,
                        type: 'quote',
                        timestamp: filtered.timestamp,
                        user: engagerList.find((engager) => {
                            return engager.xaccount.username === filtered.user.username
                        }).id,
                        campaign: tweetList[index].campaign.id
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
        return;
    }
}

export const fillReplyListHandler = async (tweetList: any[], engagerList: any[]): Promise<void> => {
    try {
        const postListArrays = await Promise.all(
            tweetList.map(async (post: any, index: number) => {
                let list: any[] = [];
                let res;
                let continuation_token;
                if (post.continuation.quote_id === null) {
                    res = await getRepliesByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.continuation.reply_id;
                while (1) {
                    res = await getRepliesContinuationByTweetId(post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.replies === undefined || res.replies?.length < 1) break;
                    res.replies.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.id, { reply_id: continuation_token });
                return list.filter((item: any) => {
                    return engagerList.findIndex((engager) => {
                        return engager.xaccount.username === item.user.username
                    }) > -1;
                })?.map((filtered: any) => {
                    return {
                        tweet_id: tweetList[index].tweet_id,
                        type: 'reply',
                        timestamp: filtered.timestamp,
                        user: engagerList.find((engager) => {
                            return engager.xaccount.username === filtered.user.username
                        }).id,
                        campaign: tweetList[index].campaign.id
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
        return;
    }
}

export const fillRetweetListHandler = async (tweetList: any[], engagerList: any[]): Promise<void> => {
    try {
        const postListArrays = await Promise.all(
            tweetList.map(async (post: any, index: number) => {
                let list: any[] = [];
                let res;
                let continuation_token;
                if (post.continuation.quote_id === null) {
                    res = await getRetweetsByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.continuation.retweet_id;
                while (1) {
                    res = await getRetweetsContinuationByTweetId(post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.retweets?.length < 1) return [];
                    res.retweets.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.id, { retweet_id: continuation_token });
                return list.filter((item: any) => {
                    return engagerList.findIndex((engager) => {
                        return engager.xaccount.username === item.user.username
                    }) > -1;
                })?.map((filtered: any) => {
                    return {
                        tweet_id: tweetList[index].tweet_id,
                        type: 'retweet',
                        timestamp: filtered.timestamp,
                        user: engagerList.find((engager) => {
                            return engager.xaccount.username === filtered.user.username
                        }).id,
                        campaign: tweetList[index].campaign.id
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) await insertPostList(postList);
    } catch (err) {
        console.error(err);
        return;
    }
}

export const createPostHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const newPost = await savePost({
            tweet_id: req.body.tweet_id,
            type: req.body.type,
            user: req.body.userId,
            campaign: req.body.campaignId,
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