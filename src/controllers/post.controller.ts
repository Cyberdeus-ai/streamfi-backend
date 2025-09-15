import moment from 'moment';
import { setScoreByPostTypeHandler } from './score.controller';
import { findTweetList, insertPostList, findCampaignByPost } from '../services/post.service';
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
import { updateOversightList } from '../services/oversight.service';

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
                    if (res.results === undefined || res.results?.length < 1) break;
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
                        user: { id: userId },
                        campaign: { id: campaignId },
                        timestamp: moment(filter.timestamp * 1000)
                    }
                });
            })
        );

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            const resPostList = await insertPostList(postList);
            await insertContinuationList(resPostList.map((post: any) => {
                return { post: { id: post.id } };
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
                if (post.quote_id === null) {
                    res = await getQuotesByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.quote_id;

                res = await getQuotesContinuationByTweetId(post.tweet_id, continuation_token);
                continuation_token = res.continuation_token;
                if (res.results !== undefined || res.results?.length > 0) {
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
                        tweet_id: post.tweet_id,
                        type: 'quote',
                        timestamp: moment(filtered.timestamp * 1000),
                        user: {
                            id: engagerList.find((engager) => {
                                return engager.xaccount.username === filtered.user.username
                            }).id
                        },
                        campaign: { id: post.campaign_id }
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            botDetection(postList);
            await insertPostList(postList);
            await setScoreByPostTypeHandler(postList, "quote");
        }
    } catch (err) {
        console.error(err);
        return;
    }
}

export const fillReplyListHandler = async (tweetList: any[], engagerList: any[]): Promise<void> => {
    try {
        const postListArrays = await Promise.all(
            tweetList.map(async (post: any) => {
                let list: any[] = [];
                let res;
                let continuation_token;
                if (post.reply_id === null) {
                    res = await getRepliesByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.reply_id;

                res = await getRepliesContinuationByTweetId(post.tweet_id, continuation_token);
                continuation_token = res.continuation_token;
                if (res.replies !== undefined || res.replies?.length > 0) {
                    res.replies?.forEach((item: any) => {
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
                        tweet_id: post.tweet_id,
                        type: 'reply',
                        timestamp: moment(filtered.timestamp * 1000),
                        user: {
                            id: engagerList.find((engager) => {
                                return engager.xaccount.username === filtered.user.username
                            }).id
                        },
                        campaign: { id: post.campaign_id }
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            botDetection(postList);
            await insertPostList(postList);
            await setScoreByPostTypeHandler(postList, "reply");
        }
    } catch (err) {
        console.error(err);
        return;
    }
}

export const fillRetweetListHandler = async (tweetList: any[], engagerList: any[]): Promise<void> => {
    try {
        const postListArrays = await Promise.all(
            tweetList.map(async (post: any) => {
                let list: any[] = [];
                let res;
                let continuation_token;
                if (post.retweet_id === null) {
                    res = await getRetweetsByTweetId(post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.retweet_id;

                res = await getRetweetsContinuationByTweetId(post.tweet_id, continuation_token);
                continuation_token = res.continuation_token;
                if (res.retweets !== undefined || res.retweets?.length > 0) {
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
                        tweet_id: post.tweet_id,
                        type: 'retweet',
                        timestamp: moment(filtered.timestamp * 1000),
                        user: {
                            id: engagerList.find((engager) => {
                                return engager.xaccount.username === filtered.user.username
                            }).id
                        },
                        campaign: { id: post.campaign_id }
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            botDetection(postList);
            await insertPostList(postList);
            await setScoreByPostTypeHandler(postList, "retweet");
        }
    } catch (err) {
        console.error(err);
        return;
    }
}

function botDetection(postList: any[]) {
    let userPostList: any[] = [];
    let badUserList: any[] = [];
    postList.forEach((post: any) => {
        const index = userPostList.findIndex((userPost: any) => {
            userPost.user.id === post.user.id
        });
        if (index > -1) {
            const delta = new Date(userPostList[index].timestamp).getTime() - new Date(post.timestamp).getTime();
            if (delta < 1000) badUserList.push(post.user.id);
        }
        userPostList.push(post);
    });

    updateOversightList(badUserList.map((user: number) => ({
        id: user,
        bot_detection: "high_frequency"
    })), "bot_detection");
}