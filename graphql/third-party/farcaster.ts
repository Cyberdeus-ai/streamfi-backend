import axios, { AxiosInstance } from 'axios';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';
const NEYNAR_SNAPCHAIN = 'https://snapchain-api.neynar.com/v1';

function getApiKey(): string {
    const key = process.env.NEYNAR_API_KEY;
    if (!key) {
        throw new Error('NEYNAR_API_KEY is not set');
    }
    return key;
}

function client(): AxiosInstance {
    return axios.create({
        baseURL: NEYNAR_BASE,
        headers: { 'x-api-key': getApiKey() },
    });
}

function snapchainClient(): AxiosInstance {
    return axios.create({
        baseURL: NEYNAR_SNAPCHAIN,
        headers: { 'x-api-key': getApiKey() },
    });
}

interface NeynarCast {
    hash: string;
    text: string;
    timestamp: string;
    author: {
        fid: number;
        username: string;
        display_name?: string;
    };
    reactions?: {
        likes_count?: number;
        recasts_count?: number;
    };
    replies?: { count?: number };
}

function toFarcasterPost(c: NeynarCast): FarcasterPost {
    return {
        hash: c.hash,
        text: c.text,
        timestamp: c.timestamp,
        author: {
            fid: c.author.fid,
            username: c.author.username,
            displayName: c.author.display_name ?? c.author.username,
        },
        reactions: { count: c.reactions?.likes_count ?? 0 },
        replies: { count: c.replies?.count ?? 0 },
        recasts: { count: c.reactions?.recasts_count ?? 0 },
        quotes: { count: 0 },
    };
}

export interface FarcasterPost {
    hash: string;
    text: string;
    timestamp: string;
    author: {
        fid: number;
        username: string;
        displayName: string;
    };
    reactions: { count: number };
    replies: { count: number };
    recasts: { count: number };
    quotes: { count: number };
}

export const fetchFarcasterDataByHashtag = async (
    hashtag: string,
    limit: number = 10
): Promise<FarcasterPost[]> => {
    try {
        const channelId = hashtag.replace('#', '').toLowerCase();
        const res = await client().get('/feed/channels/', {
            params: { channel_ids: channelId, limit },
        });
        const casts: NeynarCast[] = res.data?.casts ?? [];
        return casts.map(toFarcasterPost);
    } catch (error) {
        console.error(`Error fetching Farcaster data for hashtag ${hashtag}:`, error);
        return [];
    }
};

export const fetchFarcasterDataByUser = async (
    fid: number,
    limit: number = 10
): Promise<FarcasterPost[]> => {
    try {
        const res = await client().get('/feed/user/casts/', {
            params: { fid, limit },
        });
        const casts: NeynarCast[] = res.data?.casts ?? [];
        return casts.map(toFarcasterPost);
    } catch (error) {
        console.error(`Error fetching Farcaster data for user ${fid}:`, error);
        return [];
    }
};

export const calculateFarcasterPoints = (
    posts: FarcasterPost[],
    commentPoints: number = 2,
    repostPoints: number = 1,
    quotePoints: number = 3
): number => {
    let totalPoints = 0;
    for (const post of posts) {
        const comments = post.replies?.count || 0;
        const reposts = post.recasts?.count || 0;
        const quotes = post.quotes?.count || 0;
        totalPoints += (comments * commentPoints) + (reposts * repostPoints) + (quotes * quotePoints);
    }
    return totalPoints;
};

function formatEngagementUser(u: { username?: string; follower_count?: number; registered_at?: string; verifications?: string[] }): { user: any } {
    const createdAt = u.registered_at ? new Date(u.registered_at) : new Date();
    const now = new Date();
    const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
        user: {
            username: u.username ?? '',
            handle: u.username ?? '',
            isVerified: Array.isArray(u.verifications) && u.verifications.length > 0,
            followers: u.follower_count ?? 0,
            joinedDate: createdAt,
            accountAge,
        },
    };
}

/**
 * Fetch detailed engagement data for a Farcaster post.
 * postHash can be "fid:hash" (e.g. "3:0xabc...") or just hash; Neynar replies/reactions need fid+hash.
 */
export const fetchFarcasterPostEngagements = async (postHash: string): Promise<{
    comments: Array<{ user: any }>;
    quotes: Array<{ user: any }>;
    replies: Array<{ user: any }>;
    reposts: Array<{ user: any }>;
}> => {
    try {
        let fid: number | null = null;
        let hash = postHash.trim();
        if (hash.includes(':')) {
            const [fidStr, hashPart] = hash.split(':');
            fid = parseInt(fidStr, 10);
            hash = hashPart.trim();
        }
        if (!hash.startsWith('0x')) {
            hash = '0x' + hash;
        }

        const comments: Array<{ user: any }> = [];
        const reposts: Array<{ user: any }> = [];

        if (fid != null && !isNaN(fid)) {
            try {
                const repliesRes = await snapchainClient().get('/castsByParent', {
                    params: { fid, hash, pageSize: 50 },
                });
                const messages = repliesRes.data?.messages ?? [];
                for (const msg of messages) {
                    const d = msg?.data;
                    if (d?.fid != null) {
                        comments.push({
                            user: {
                                username: String(d.fid),
                                handle: String(d.fid),
                                isVerified: false,
                                followers: 0,
                                joinedDate: new Date(),
                                accountAge: 0,
                            },
                        });
                    }
                }
            } catch (_) {
                // ignore
            }

            try {
                const reactionsRes = await client().get('/reactions/cast/', {
                    params: { hash, types: 'likes,recasts', limit: 50 },
                });
                const reactions = reactionsRes.data?.reactions ?? [];
                for (const r of reactions) {
                    const u = r?.user ?? r;
                    reposts.push(formatEngagementUser({
                        username: u.username,
                        follower_count: u.follower_count,
                        registered_at: u.registered_at,
                        verifications: u.verifications,
                    }));
                }
            } catch (_) {
                // ignore
            }
        }

        return {
            comments,
            quotes: [],
            replies: comments,
            reposts,
        };
    } catch (error) {
        console.error(`Error fetching Farcaster post engagements for ${postHash}:`, error);
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }
};
