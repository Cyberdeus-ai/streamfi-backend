import axios, { AxiosInstance } from 'axios';

const MINDS_API_URL = 'https://www.minds.com/api/v1';

interface MindsPost {
    guid: string;
    message: string;
    time_created: number;
    owner_guid: string;
    ownerObj: {
        guid: string;
        username: string;
        name: string;
    };
    comments: number;
    impressions: number;
    thumbs_up: number;
    thumbs_down: number;
    reminds: number;
    quotes: number;
}

interface MindsUser {
    guid: string;
    username: string;
    name: string;
    subscribers_count: number;
    impressions: number;
}

/**
 * Fetch Minds posts by user handle
 * @param handle - The Minds username
 * @param limit - Maximum number of posts to fetch (default: 10)
 * @returns Array of Minds posts
 */
export const fetchMindsDataByUser = async (
    handle: string,
    limit: number = 10
): Promise<MindsPost[]> => {
    try {
        // First, get the user GUID
        const userResponse = await axios.get(`${MINDS_API_URL}/channel/${handle}`);
        const user: MindsUser = userResponse.data;

        if (!user || !user.guid) {
            console.error(`User ${handle} not found on Minds`);
            return [];
        }

        // Fetch posts by user GUID
        const postsResponse = await axios.get(`${MINDS_API_URL}/newsfeed/personal/${user.guid}`, {
            params: {
                limit: limit,
                offset: 0
            }
        });

        const posts = postsResponse.data?.entities || [];
        return posts.map((post: any) => ({
            guid: post.guid,
            message: post.message || '',
            time_created: post.time_created,
            owner_guid: post.owner_guid,
            ownerObj: {
                guid: post.ownerObj?.guid || '',
                username: post.ownerObj?.username || '',
                name: post.ownerObj?.name || ''
            },
            comments: post.comments || 0,
            impressions: post.impressions || 0,
            thumbs_up: post.thumbs_up || 0,
            thumbs_down: post.thumbs_down || 0,
            reminds: post.reminds || 0,
            quotes: post.quotes || 0
        }));
    } catch (error) {
        console.error(`Error fetching Minds data for user ${handle}:`, error);
        return [];
    }
};

/**
 * Search Minds posts by query/hashtag
 * @param query - Search query or hashtag
 * @param limit - Maximum number of posts to fetch (default: 10)
 * @returns Array of Minds posts
 */
export const searchMindsPosts = async (
    query: string,
    limit: number = 10
): Promise<MindsPost[]> => {
    try {
        const response = await axios.get(`${MINDS_API_URL}/search`, {
            params: {
                q: query,
                type: 'activity',
                limit: limit,
                offset: 0
            }
        });

        const posts = response.data?.entities || [];
        return posts.map((post: any) => ({
            guid: post.guid,
            message: post.message || '',
            time_created: post.time_created,
            owner_guid: post.owner_guid,
            ownerObj: {
                guid: post.ownerObj?.guid || '',
                username: post.ownerObj?.username || '',
                name: post.ownerObj?.name || ''
            },
            comments: post.comments || 0,
            impressions: post.impressions || 0,
            thumbs_up: post.thumbs_up || 0,
            thumbs_down: post.thumbs_down || 0,
            reminds: post.reminds || 0,
            quotes: post.quotes || 0
        }));
    } catch (error) {
        console.error(`Error searching Minds posts for query ${query}:`, error);
        return [];
    }
};

/**
 * Calculate engagement points from Minds posts
 * @param posts - Array of Minds posts
 * @param commentPoints - Points per comment (default: 2)
 * @param repostPoints - Points per remind/repost (default: 1)
 * @param quotePoints - Points per quote (default: 3)
 * @returns Total engagement points
 */
export const calculateMindsPoints = (
    posts: MindsPost[],
    commentPoints: number = 2,
    repostPoints: number = 1,
    quotePoints: number = 3
): number => {
    let totalPoints = 0;

    for (const post of posts) {
        const comments = post.comments || 0;
        const reposts = post.reminds || 0;
        const quotes = post.quotes || 0;

        totalPoints += (comments * commentPoints) + (reposts * repostPoints) + (quotes * quotePoints);
    }

    return totalPoints;
};

/**
 * Fetch detailed engagement data for a Minds post
 */
export const fetchMindsPostEngagements = async (postGuid: string): Promise<{
    comments: Array<{ user: any }>;
    quotes: Array<{ user: any }>;
    replies: Array<{ user: any }>;
    reposts: Array<{ user: any }>;
}> => {
    try {
        // Fetch comments
        const commentsResponse = await axios.get(`${MINDS_API_URL}/entities/${postGuid}/comments`);
        const comments = commentsResponse.data?.entities || [];

        // Fetch reminds (reposts)
        const remindsResponse = await axios.get(`${MINDS_API_URL}/entities/${postGuid}/reminds`);
        const reminds = remindsResponse.data?.entities || [];

        const now = new Date();
        
        const formatUser = (ownerObj: any) => {
            const createdAt = new Date(ownerObj.time_created * 1000);
            const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                username: ownerObj.username,
                handle: ownerObj.username,
                isVerified: ownerObj.verified || false,
                followers: ownerObj.subscribers_count || 0,
                joinedDate: createdAt,
                accountAge
            };
        };

        return {
            comments: comments.map((comment: any) => ({
                user: formatUser(comment.ownerObj || {})
            })),
            quotes: [], // Minds may not have separate quotes
            replies: comments.map((comment: any) => ({
                user: formatUser(comment.ownerObj || {})
            })),
            reposts: reminds.map((remind: any) => ({
                user: formatUser(remind.ownerObj || {})
            }))
        };
    } catch (error) {
        console.error(`Error fetching Minds post engagements for ${postGuid}:`, error);
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }
};

