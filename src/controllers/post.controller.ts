import moment from 'moment';
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
import { insertScoreList, findLatestScoreList, updateIsLatest } from '../services/score.service';
import scoreConfig from '../utils/score-settings';

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
                    res = await getQuotesByTweetId(post.post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.quote_id;
                while (1) {
                    res = await getQuotesContinuationByTweetId(post.post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.results === undefined || res.results?.length < 1) break;
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.post.id, { quote_id: continuation_token });
                return list.filter((item: any) => {
                    return engagerList.findIndex((engager) => {
                        return engager.xaccount.username === item.user.username
                    }) > -1;
                })?.map((filtered: any) => {
                    return {
                        tweet_id: tweetList[index].tweet_id,
                        type: 'quote',
                        timestamp: filtered.timestamp,
                        user: {
                            id: engagerList.find((engager) => {
                                return engager.xaccount.username === filtered.user.username
                            }).id
                        },
                        campaign: { id: tweetList[index].campaign.id }
                    }
                });
            }));

        const postList = postListArrays.flat();
        if (postList && postList.length > 0) {
            await insertPostList(postList);
            const latestScoreList = await findLatestScoreList();
            const latestTotal = latestScoreList.reduce((total: number, score: any) => Number(total) + Number(score.value), 0);
            const total = postList.length * scoreConfig.engage.quote + latestTotal;
            await updateIsLatest();
            await insertScoreList(latestScoreList.map(async (score: any) => {
                const newValue = postList.findIndex((post: any) => score.user.id === post.user.id) > -1 ? scoreConfig.engage.quote : 0;
                const value = Number(score.value) + Number(newValue);
                return {
                    user: { id: score.user.id },
                    value: value,
                    percentage: Math.round(value / total * 10000)
                }
            }));
        }
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
                if (post.reply_id === null) {
                    res = await getRepliesByTweetId(post.post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.reply_id;
                while (1) {
                    res = await getRepliesContinuationByTweetId(post.post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.replies === undefined || res.replies?.length < 1) break;
                    res.replies.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.post.id, { reply_id: continuation_token });
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
        if (postList && postList.length > 0) {
            await insertPostList(postList);
            const latestScoreList = await findLatestScoreList();
            const latestTotal = latestScoreList.reduce((total: number, score: any) => Number(total) + Number(score.value), 0);
            const total = postList.length * scoreConfig.engage.reply + latestTotal;
            await updateIsLatest();
            await insertScoreList(latestScoreList.map(async (score: any) => {
                const newValue = postList.findIndex((post: any) => score.user.id === post.user.id) > -1 ? scoreConfig.engage.reply : 0;
                const value = Number(score.value) + Number(newValue);
                return {
                    user: { id: score.user.id },
                    value: value,
                    percentage: Math.round(value / total * 10000)
                }
            }));
        }
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
                if (post.retweet_id === null) {
                    res = await getRetweetsByTweetId(post.post.tweet_id);
                    res.results?.forEach((item: any) => {
                        list.push(item);
                    });
                    continuation_token = res.continuation_token;
                } else continuation_token = post.retweet_id;
                while (1) {
                    res = await getRetweetsContinuationByTweetId(post.post.tweet_id, continuation_token);
                    continuation_token = res.continuation_token;
                    if (res.retweets === undefined || res.retweets?.length < 1) return [];
                    res.retweets.forEach((item: any) => {
                        list.push(item);
                    });
                }
                await updateContinuation(post.post.id, { retweet_id: continuation_token });
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
        if (postList && postList.length > 0) {
            await insertPostList(postList);
            const latestScoreList = await findLatestScoreList();
            const latestTotal = latestScoreList.reduce((total: number, score: any) => Number(total) + Number(score.value), 0);
            const total = postList.length * scoreConfig.engage.retweet + latestTotal;
            await updateIsLatest();
            await insertScoreList(latestScoreList.map(async (score: any) => {
                const newValue = postList.findIndex((post: any) => score.user.id === post.user.id) > -1 ? scoreConfig.engage.retweet : 0;
                const value = Number(score.value) + Number(newValue);
                return {
                    user: { id: score.user.id },
                    value: value,
                    percentage: Math.round(value / total * 10000)
                }
            }));
        }
    } catch (err) {
        console.error(err);
        return;
    }
}