import { PubSub } from 'graphql-subscriptions';
import { AppDataSource } from '../utils/data-source';
import { Campaign, Join } from '../entities';
import { fetchFarcasterDataByHashtag, fetchFarcasterPostEngagements } from './third-party/farcaster';
import { fetchLensDataByHashtag, fetchLensPostEngagements } from './third-party/lens';
import { searchMindsPosts, fetchMindsPostEngagements } from './third-party/minds';

export const pubsub = new PubSub();

const campaignRepo = AppDataSource.getRepository(Campaign);

const fetchPostsByPlatform = async (platform: string, hashtags: string[], tickers: string[], promoterHandles: string[]) => {
    if (!platform || !hashtags || !tickers || !promoterHandles) {
        return [];
    }

    const searchTerms = [...hashtags, ...tickers];
    
    try {
        switch (platform.toLowerCase()) {
            case 'farcaster': {
                const posts = [];
                for (const term of searchTerms) {
                    try {
                        const data = await fetchFarcasterDataByHashtag(term);
                        if (data && Array.isArray(data)) {
                            posts.push(...data.map((post: any) => ({
                                ...post,
                                author: {
                                    ...post.author,
                                    handle: post.author?.username || ''
                                }
                            })));
                        }
                    } catch (error) {
                        console.error(`Error fetching Farcaster posts for ${term}:`, error);
                    }
                }
                return posts.filter((post: any) => 
                    post && post.author && post.author.handle &&
                    promoterHandles.some(handle => 
                        post.author.handle.toLowerCase() === handle.toLowerCase()
                    )
                );
            }
            case 'lens': {
                const posts = [];
                for (const term of searchTerms) {
                    try {
                        const data = await fetchLensDataByHashtag(term);
                        if (data && Array.isArray(data)) {
                            posts.push(...data.map((post: any) => ({
                                ...post,
                                author: {
                                    handle: post.by?.handle?.fullHandle || ''
                                }
                            })));
                        }
                    } catch (error) {
                        console.error(`Error fetching Lens posts for ${term}:`, error);
                    }
                }
                return posts.filter((post: any) => 
                    post && post.author && post.author.handle &&
                    promoterHandles.some(handle => 
                        post.author.handle.toLowerCase() === handle.toLowerCase()
                    )
                );
            }
            case 'minds': {
                const posts = [];
                for (const term of searchTerms) {
                    try {
                        const data = await searchMindsPosts(term);
                        if (data && Array.isArray(data)) {
                            posts.push(...data.map((post: any) => ({
                                ...post,
                                author: {
                                    handle: post.ownerObj?.username || ''
                                }
                            })));
                        }
                    } catch (error) {
                        console.error(`Error fetching Minds posts for ${term}:`, error);
                    }
                }
                return posts.filter((post: any) => 
                    post && post.author && post.author.handle &&
                    promoterHandles.some(handle => 
                        post.author.handle.toLowerCase() === handle.toLowerCase()
                    )
                );
            }
            default:
                return [];
        }
    } catch (error) {
        console.error('Error in fetchPostsByPlatform:', error);
        return [];
    }
};

const fetchEngagementsByPlatform = async (platform: string, postId: string) => {
    if (!platform || !postId) {
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }

    try {
        switch (platform.toLowerCase()) {
            case 'farcaster':
                return await fetchFarcasterPostEngagements(postId) || { comments: [], quotes: [], replies: [], reposts: [] };
            case 'lens':
                return await fetchLensPostEngagements(postId) || { comments: [], quotes: [], replies: [], reposts: [] };
            case 'minds':
                return await fetchMindsPostEngagements(postId) || { comments: [], quotes: [], replies: [], reposts: [] };
            default:
                return { comments: [], quotes: [], replies: [], reposts: [] };
        }
    } catch (error) {
        console.error('Error in fetchEngagementsByPlatform:', error);
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }
};

export const resolvers = {
    Query: {
        getCampaignPosts: async (_: any, args: any) => {
            try {
                const { campaignId } = args;
                if (!campaignId || isNaN(parseInt(campaignId))) {
                    return [];
                }

                const campaign = await campaignRepo.findOne({
                    where: { id: parseInt(campaignId) },
                    relations: ['user']
                });

                if (!campaign || !campaign.web3_social) {
                    return [];
                }

                const joinRepo = AppDataSource.getRepository(Join);
                const joins = await joinRepo.find({
                    where: { campaign: { id: campaign.id } },
                    relations: ['promoter', 'promoter.xaccount']
                });

                const promoterHandles = joins
                    .map(join => join.promoter?.xaccount?.username)
                    .filter(Boolean) as string[];

                if (promoterHandles.length === 0) {
                    return [];
                }

                return await fetchPostsByPlatform(
                    campaign.web3_social,
                    campaign.hashtags || [],
                    campaign.tickers || [],
                    promoterHandles
                );
            } catch (error) {
                console.error('Error in getCampaignPosts:', error);
                return [];
            }
        },

        getPostEngagements: async (_: any, args: any) => {
            try {
                const { campaignId, postId } = args;
                if (!campaignId || !postId || isNaN(parseInt(campaignId))) {
                    return { comments: [], quotes: [], replies: [], reposts: [] };
                }

                const campaign = await campaignRepo.findOne({
                    where: { id: parseInt(campaignId) }
                });

                if (!campaign || !campaign.web3_social) {
                    return { comments: [], quotes: [], replies: [], reposts: [] };
                }

                return await fetchEngagementsByPlatform(campaign.web3_social, postId);
            } catch (error) {
                console.error('Error in getPostEngagements:', error);
                return { comments: [], quotes: [], replies: [], reposts: [] };
            }
        },

        getCampaignData: async (_: any, args: any) => {
            try {
                const { campaignId } = args;
                if (!campaignId || isNaN(parseInt(campaignId))) {
                    return {
                        campaignId,
                        posts: [],
                        totalEngagements: 0
                    };
                }

                const campaign = await campaignRepo.findOne({
                    where: { id: parseInt(campaignId) },
                    relations: ['user']
                });

                if (!campaign || !campaign.web3_social) {
                    return {
                        campaignId,
                        posts: [],
                        totalEngagements: 0
                    };
                }

                const joinRepo = AppDataSource.getRepository(Join);
                const joins = await joinRepo.find({
                    where: { campaign: { id: campaign.id } },
                    relations: ['promoter', 'promoter.xaccount']
                });

                const promoterHandles = joins
                    .map(join => join.promoter?.xaccount?.username)
                    .filter(Boolean) as string[];

                if (promoterHandles.length === 0) {
                    return {
                        campaignId,
                        posts: [],
                        totalEngagements: 0
                    };
                }

                const posts = await fetchPostsByPlatform(
                    campaign.web3_social,
                    campaign.hashtags || [],
                    campaign.tickers || [],
                    promoterHandles
                );

                const allPosts = [];
                for (const post of posts) {
                    if (post && post.id) {
                        try {
                            const engagements = await fetchEngagementsByPlatform(campaign.web3_social, post.id);
                            allPosts.push({ ...post, engagements });
                        } catch (error) {
                            console.error(`Error fetching engagements for post ${post.id}:`, error);
                        }
                    }
                }

                const totalEngagements = allPosts.reduce((sum, post) => {
                    if (post && post.engagements) {
                        return sum + 
                            (post.engagements.comments?.length || 0) + 
                            (post.engagements.quotes?.length || 0) + 
                            (post.engagements.replies?.length || 0) + 
                            (post.engagements.reposts?.length || 0);
                    }
                    return sum;
                }, 0);

                return {
                    campaignId,
                    posts: allPosts,
                    totalEngagements
                };
            } catch (error) {
                console.error('Error in getCampaignData:', error);
                return {
                    campaignId: args.campaignId || '',
                    posts: [],
                    totalEngagements: 0
                };
            }
        }
    },

    Subscription: {
        newPost: {
            subscribe: (_: any, args: any) => {
                try {
                    const { campaignId, platform } = args;
                    if (!campaignId || !platform) {
                        throw new Error('campaignId and platform are required');
                    }
                    return pubsub.asyncIterator([`NEW_POST_${campaignId}_${platform}`]);
                } catch (error) {
                    console.error('Error in newPost subscription:', error);
                    throw error;
                }
            }
        },
        newEngagement: {
            subscribe: (_: any, args: any) => {
                try {
                    const { campaignId, platform } = args;
                    if (!campaignId || !platform) {
                        throw new Error('campaignId and platform are required');
                    }
                    return pubsub.asyncIterator([`NEW_ENGAGEMENT_${campaignId}_${platform}`]);
                } catch (error) {
                    console.error('Error in newEngagement subscription:', error);
                    throw error;
                }
            }
        },
        pointsUpdated: {
            subscribe: (_: any, args: any) => {
                try {
                    const { campaignId } = args;
                    if (!campaignId) {
                        throw new Error('campaignId is required');
                    }
                    return pubsub.asyncIterator([`POINTS_UPDATED_${campaignId}`]);
                } catch (error) {
                    console.error('Error in pointsUpdated subscription:', error);
                    throw error;
                }
            }
        }
    }
};
