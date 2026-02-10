import { createClient } from 'graphql-ws';
import WebSocket from 'ws';
import { AppDataSource } from '../../utils/data-source';
import { Campaign, User, Join } from '../../entities';
import { fetchFarcasterDataByHashtag, fetchFarcasterPostEngagements } from '../third-party/farcaster';
import { fetchLensDataByHashtag, fetchLensPostEngagements } from '../third-party/lens';
import { searchMindsPosts, fetchMindsPostEngagements } from '../third-party/minds';
import scoreConfig from '../../utils/score-settings';
import { pubsub } from '../resolvers';
import { saveActivity } from '../../services/activity.service';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const campaignRepo = AppDataSource.getRepository(Campaign);
const userRepo = AppDataSource.getRepository(User);
const joinRepo = AppDataSource.getRepository(Join);

interface UserProfile {
    username: string;
    handle: string;
    isVerified: boolean;
    followers: number;
    joinedDate: Date;
    accountAge: number;
}

interface EngagementData {
    comments: Array<{ user: UserProfile }>;
    quotes: Array<{ user: UserProfile }>;
    replies: Array<{ user: UserProfile }>;
    reposts: Array<{ user: UserProfile }>;
}

const processedPosts = new Set<string>();

const calculateEngagerQualityPoints = (user: UserProfile, campaignBigAccounts: string[]): number => {
    if (!user || !user.handle) return 0;

    let points = 0;

    if (user.isVerified) {
        points += scoreConfig.verification || 10;
    }

    const normalizedHandle = user.handle.toLowerCase();
    if (campaignBigAccounts && campaignBigAccounts.some(account => account.toLowerCase() === normalizedHandle)) {
        points += scoreConfig.bigAccounts || 5;
    }

    if (user.accountAge && user.accountAge >= 365) {
        points += scoreConfig.accountAge || 3;
    }

    return points;
};

const calculatePromoterPoints = (engagement: EngagementData, campaign: Campaign): number => {
    if (!engagement) return 0;

    const commentPoints = campaign.comment || scoreConfig.engage.reply || 2;
    const quotePoints = campaign.quote || scoreConfig.engage.quote || 3;
    const replyPoints = campaign.comment || scoreConfig.engage.reply || 2;
    const repostPoints = campaign.repost || scoreConfig.engage.retweet || 1;

    let totalPoints = 0;

    totalPoints += (engagement.comments?.length || 0) * commentPoints;
    totalPoints += (engagement.quotes?.length || 0) * quotePoints;
    totalPoints += (engagement.replies?.length || 0) * replyPoints;
    totalPoints += (engagement.reposts?.length || 0) * repostPoints;

    if (engagement.comments) {
        for (const comment of engagement.comments) {
            if (comment && comment.user) {
                totalPoints += calculateEngagerQualityPoints(comment.user, campaign.big_accounts || []);
            }
        }
    }

    if (engagement.quotes) {
        for (const quote of engagement.quotes) {
            if (quote && quote.user) {
                totalPoints += calculateEngagerQualityPoints(quote.user, campaign.big_accounts || []);
            }
        }
    }

    if (engagement.replies) {
        for (const reply of engagement.replies) {
            if (reply && reply.user) {
                totalPoints += calculateEngagerQualityPoints(reply.user, campaign.big_accounts || []);
            }
        }
    }

    if (engagement.reposts) {
        for (const repost of engagement.reposts) {
            if (repost && repost.user) {
                totalPoints += calculateEngagerQualityPoints(repost.user, campaign.big_accounts || []);
            }
        }
    }

    return totalPoints;
};

const postMatchesCampaign = (postContent: string, hashtags: string[], tickers: string[]): boolean => {
    if (!postContent) return false;

    const normalizedContent = postContent.toLowerCase();

    if (hashtags && hashtags.length > 0) {
        for (const hashtag of hashtags) {
            const normalizedHashtag = hashtag.replace('#', '').toLowerCase();
            if (normalizedContent.includes(`#${normalizedHashtag}`) || normalizedContent.includes(normalizedHashtag)) {
                return true;
            }
        }
    }

    if (tickers && tickers.length > 0) {
        for (const ticker of tickers) {
            const normalizedTicker = ticker.replace('$', '').toLowerCase();
            if (normalizedContent.includes(`$${normalizedTicker}`) || normalizedContent.includes(normalizedTicker)) {
                return true;
            }
        }
    }

    return false;
};

const isPosterAPromoter = async (posterHandle: string, campaignId: number): Promise<{ isPromoter: boolean; promoter?: User; join?: Join }> => {
    if (!posterHandle || !campaignId) {
        return { isPromoter: false };
    }

    try {
        const joins = await joinRepo.find({
            where: { campaign: { id: campaignId } },
            relations: ['promoter', 'promoter.xaccount']
        });

        for (const join of joins) {
            if (join.promoter?.xaccount?.username?.toLowerCase() === posterHandle.toLowerCase()) {
                return { isPromoter: true, promoter: join.promoter, join };
            }
        }

        return { isPromoter: false };
    } catch (error) {
        console.error('Error checking if poster is promoter:', error);
        return { isPromoter: false };
    }
};

const updateFlowRate = async (campaign: Campaign) => {
    if (!campaign || !campaign.id || !campaign.pool) {
        return;
    }

    try {
        const joins = await joinRepo.find({
            where: { campaign: { id: campaign.id } },
            relations: ['promoter']
        });

        const totalPoints = joins.reduce((sum, join) => sum + (join.points || 0), 0);

        if (totalPoints === 0) {
            return;
        }

        const updatePromises = joins.map(async (join) => {
            if (join.promoter) {
                const promoterShare = (join.points || 0) / totalPoints;
                join.promoter.flow_rate = promoterShare * 100;
                await userRepo.save(join.promoter);
            }
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error updating flow rate:', error);
    }
};

const processCampaignForPlatform = async (campaign: Campaign, platform: string, fetchPostsFn: any, fetchEngagementsFn: any) => {
    if (!campaign || !campaign.id || !campaign.web3_social || campaign.web3_social !== platform) {
        return;
    }

    const searchTerms = [...(campaign.hashtags || []), ...(campaign.tickers || [])];
    if (searchTerms.length === 0) {
        return;
    }

    const allPosts = [];

    try {
        for (const term of searchTerms) {
            try {
                const posts = await fetchPostsFn(term);
                if (posts && Array.isArray(posts)) {
                    allPosts.push(...posts);
                }
            } catch (error) {
                console.error(`Error fetching posts for term ${term}:`, error);
            }
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    for (const post of allPosts) {
        if (!post || !post.id || !post.content || !post.author || !post.author.handle) {
            continue;
        }

        const postKey = `${platform}_${post.id}_${campaign.id}`;
        if (processedPosts.has(postKey)) {
            continue;
        }

        if (!postMatchesCampaign(post.content, campaign.hashtags || [], campaign.tickers || [])) {
            continue;
        }

        const { isPromoter, promoter, join } = await isPosterAPromoter(post.author.handle, campaign.id);

        if (!isPromoter || !promoter || !join) {
            continue;
        }

        try {
            await pubsub.publish(`NEW_POST_${campaign.id}_${platform}`, { newPost: post });
        } catch (error) {
            console.error('Error publishing new post event:', error);
        }

        let engagements: EngagementData;
        try {
            engagements = await fetchEngagementsFn(post.id);
            if (!engagements) {
                engagements = { comments: [], quotes: [], replies: [], reposts: [] };
            }
        } catch (error) {
            console.error(`Error fetching engagements for post ${post.id}:`, error);
            engagements = { comments: [], quotes: [], replies: [], reposts: [] };
        }

        try {
            await pubsub.publish(`NEW_ENGAGEMENT_${campaign.id}_${platform}`, { newEngagement: engagements });
        } catch (error) {
            console.error('Error publishing engagement event:', error);
        }

        const points = calculatePromoterPoints(engagements, campaign);

        if (points > 0) {
            const queryRunner = AppDataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
                join.points = (join.points || 0) + points;
                await queryRunner.manager.save(join);

                promoter.points = (promoter.points || 0) + points;
                await queryRunner.manager.save(promoter);

                await saveActivity({
                    user: promoter,
                    campaign: campaign,
                    type: 'comment',
                    points: points,
                    time: new Date()
                });

                await queryRunner.commitTransaction();
                processedPosts.add(postKey);

                await updateFlowRate(campaign);

                try {
                    await pubsub.publish(`POINTS_UPDATED_${campaign.id}`, {
                        pointsUpdated: {
                            promoterId: promoter.id,
                            campaignId: campaign.id,
                            platform: platform,
                            points: points,
                            newTotalPoints: promoter.points,
                            timestamp: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    console.error('Error publishing points update event:', error);
                }
            } catch (error) {
                await queryRunner.rollbackTransaction();
                console.error('Error processing points update:', error);
            } finally {
                await queryRunner.release();
            }
        }
    }
};

const setupFarcasterSubscription = async () => {
    const FARCASTER_WS_URL = process.env.FARCASTER_WS_URL || 'wss://api.farcaster.xyz/graphql';
    
    try {
        const client = createClient({
            url: FARCASTER_WS_URL,
            webSocketImpl: WebSocket,
        });

        const now = new Date();
        const activeCampaigns = await campaignRepo.find({
            where: {
                web3_social: 'farcaster',
                start_date: LessThanOrEqual(now),
                end_date: MoreThanOrEqual(now)
            },
            relations: ['user', 'pool']
        });

        for (const campaign of activeCampaigns) {
            const searchTerms = [...(campaign.hashtags || []), ...(campaign.tickers || [])];
            
            for (const term of searchTerms) {
                client.subscribe(
                    {
                        query: `
                            subscription OnNewCast($hashtag: String!) {
                                cast(hashtag: $hashtag) {
                                    id
                                    content
                                    author {
                                        handle
                                        username
                                    }
                                    createdAt
                                }
                            }
                        `,
                        variables: { hashtag: term.replace('#', '') }
                    },
                    {
                        next: async (data: any) => {
                            if (data?.data?.cast) {
                                await processCampaignForPlatform(
                                    campaign,
                                    'farcaster',
                                    fetchFarcasterDataByHashtag,
                                    fetchFarcasterPostEngagements
                                );
                            }
                        },
                        error: (err: unknown) => console.error('Farcaster subscription error:', err),
                        complete: () => console.log('Farcaster subscription completed')
                    }
                );
            }
        }
        console.log('Farcaster GraphQL subscriptions initialized');
    } catch (error) {
        console.error('Error setting up Farcaster subscriptions:', error);
    }
};

const setupLensSubscription = async () => {
    const LENS_WS_URL = process.env.LENS_WS_URL || 'wss://api.lens.xyz/graphql';
    
    try {
        const client = createClient({
            url: LENS_WS_URL,
            webSocketImpl: WebSocket,
        });

        const now = new Date();
        const activeCampaigns = await campaignRepo.find({
            where: {
                web3_social: 'lens',
                start_date: LessThanOrEqual(now),
                end_date: MoreThanOrEqual(now)
            },
            relations: ['user', 'pool']
        });

        for (const campaign of activeCampaigns) {
            const searchTerms = [...(campaign.hashtags || []), ...(campaign.tickers || [])];
            
            for (const term of searchTerms) {
                client.subscribe(
                    {
                        query: `
                            subscription OnNewPublication($query: String!) {
                                publication(request: { query: $query, type: PUBLICATION }) {
                                    ... on Post {
                                        id
                                        createdAt
                                        metadata {
                                            content
                                        }
                                        by {
                                            handle {
                                                fullHandle
                                            }
                                        }
                                    }
                                }
                            }
                        `,
                        variables: { query: term }
                    },
                    {
                        next: async (data: any) => {
                            if (data?.data?.publication) {
                                await processCampaignForPlatform(
                                    campaign,
                                    'lens',
                                    fetchLensDataByHashtag,
                                    fetchLensPostEngagements
                                );
                            }
                        },
                        error: (err: unknown) => console.error('Lens subscription error:', err),
                        complete: () => console.log('Lens subscription completed')
                    }
                );
            }
        }
        console.log('Lens GraphQL subscriptions initialized');
    } catch (error) {
        console.error('Error setting up Lens subscriptions:', error);
    }
};

const setupMindsSubscription = async () => {
    const MINDS_WS_URL = process.env.MINDS_WS_URL || 'wss://api.minds.com/graphql';
    
    try {
        const client = createClient({
            url: MINDS_WS_URL,
            webSocketImpl: WebSocket,
        });

        const now = new Date();
        const activeCampaigns = await campaignRepo.find({
            where: {
                web3_social: 'minds',
                start_date: LessThanOrEqual(now),
                end_date: MoreThanOrEqual(now)
            },
            relations: ['user', 'pool']
        });

        for (const campaign of activeCampaigns) {
            const searchTerms = [...(campaign.hashtags || []), ...(campaign.tickers || [])];
            
            for (const term of searchTerms) {
                client.subscribe(
                    {
                        query: `
                            subscription OnNewPost($query: String!) {
                                post(query: $query) {
                                    id
                                    message
                                    owner {
                                        username
                                    }
                                    time_created
                                }
                            }
                        `,
                        variables: { query: term }
                    },
                    {
                        next: async (data: any) => {
                            if (data?.data?.post) {
                                await processCampaignForPlatform(
                                    campaign,
                                    'minds',
                                    searchMindsPosts,
                                    fetchMindsPostEngagements
                                );
                            }
                        },
                        error: (err: unknown) => console.error('Minds subscription error:', err),
                        complete: () => console.log('Minds subscription completed')
                    }
                );
            }
        }
        console.log('Minds GraphQL subscriptions initialized');
    } catch (error) {
        console.error('Error setting up Minds subscriptions:', error);
    }
};

export const startWeb3SocialsRealtime = async () => {
    try {
        await setupFarcasterSubscription();
        await setupLensSubscription();
        await setupMindsSubscription();
        console.log('Web3 Socials real-time GraphQL subscriptions started');
    } catch (error) {
        console.error('Error starting Web3 Socials real-time subscriptions:', error);
    }
};

