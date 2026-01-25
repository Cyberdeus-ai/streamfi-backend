import { GraphQLClient, gql } from 'graphql-request';

const FARCASTER_API_URL = 'https://api.farcaster.xyz/v2';

const GET_POSTS_BY_HASHTAG = gql`
    query GetPostsByHashtag($hashtag: String!, $limit: Int!) {
        posts(first: $limit, where: { hashtag: $hashtag }) {
            edges {
                node {
                    hash
                    text
                    timestamp
                    author {
                        fid
                        username
                        displayName
                    }
                    reactions {
                        count
                    }
                    replies {
                        count
                    }
                    recasts {
                        count
                    }
                    quotes {
                        count
                    }
                }
            }
        }
    }
`;

const GET_POSTS_BY_USER = gql`
    query GetPostsByUser($fid: Int!, $limit: Int!) {
        posts(first: $limit, where: { author: { fid: $fid } }) {
            edges {
                node {
                    hash
                    text
                    timestamp
                    author {
                        fid
                        username
                        displayName
                    }
                    reactions {
                        count
                    }
                    replies {
                        count
                    }
                    recasts {
                        count
                    }
                    quotes {
                        count
                    }
                }
            }
        }
    }
`;

interface FarcasterPost {
    hash: string;
    text: string;
    timestamp: string;
    author: {
        fid: number;
        username: string;
        displayName: string;
    };
    reactions: {
        count: number;
    };
    replies: {
        count: number;
    };
    recasts: {
        count: number;
    };
    quotes: {
        count: number;
    };
}

interface FarcasterResponse {
    posts: {
        edges: Array<{
            node: FarcasterPost;
        }>;
    };
}


export const fetchFarcasterDataByHashtag = async (
    hashtag: string,
    limit: number = 10
): Promise<FarcasterPost[]> => {
    try {
        const client = new GraphQLClient(FARCASTER_API_URL);
        const variables = { hashtag: hashtag.replace('#', ''), limit };
        
        const data = await client.request<FarcasterResponse>(
            GET_POSTS_BY_HASHTAG,
            variables
        );

        return data.posts.edges.map(edge => edge.node);
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
        const client = new GraphQLClient(FARCASTER_API_URL);
        const variables = { fid, limit };
        
        const data = await client.request<FarcasterResponse>(
            GET_POSTS_BY_USER,
            variables
        );

        return data.posts.edges.map(edge => edge.node);
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

// GraphQL query to fetch post engagements (comments, quotes, replies, recasts)
const GET_POST_ENGAGEMENTS = gql`
    query GetPostEngagements($hash: String!) {
        cast(hash: $hash) {
            hash
            replies {
                edges {
                    node {
                        hash
                        text
                        timestamp
                        author {
                            fid
                            username
                            displayName
                            verifications {
                                address
                            }
                            followerCount
                            createdAt
                        }
                    }
                }
            }
            reactions {
                edges {
                    node {
                        type
                        user {
                            fid
                            username
                            displayName
                            verifications {
                                address
                            }
                            followerCount
                            createdAt
                        }
                    }
                }
            }
            recasts {
                edges {
                    node {
                        user {
                            fid
                            username
                            displayName
                            verifications {
                                address
                            }
                            followerCount
                            createdAt
                        }
                    }
                }
            }
            quotes {
                edges {
                    node {
                        hash
                        text
                        timestamp
                        author {
                            fid
                            username
                            displayName
                            verifications {
                                address
                            }
                            followerCount
                            createdAt
                        }
                    }
                }
            }
        }
    }
`;

interface FarcasterEngagementResponse {
    cast: {
        replies: {
            edges: Array<{
                node: {
                    hash: string;
                    text: string;
                    timestamp: string;
                    author: {
                        fid: number;
                        username: string;
                        displayName: string;
                        verifications: Array<{ address: string }>;
                        followerCount: number;
                        createdAt: string;
                    };
                };
            }>;
        };
        reactions: {
            edges: Array<{
                node: {
                    type: string;
                    user: {
                        fid: number;
                        username: string;
                        displayName: string;
                        verifications: Array<{ address: string }>;
                        followerCount: number;
                        createdAt: string;
                    };
                };
            }>;
        };
        recasts: {
            edges: Array<{
                node: {
                    user: {
                        fid: number;
                        username: string;
                        displayName: string;
                        verifications: Array<{ address: string }>;
                        followerCount: number;
                        createdAt: string;
                    };
                };
            }>;
        };
        quotes: {
            edges: Array<{
                node: {
                    hash: string;
                    text: string;
                    timestamp: string;
                    author: {
                        fid: number;
                        username: string;
                        displayName: string;
                        verifications: Array<{ address: string }>;
                        followerCount: number;
                        createdAt: string;
                    };
                };
            }>;
        };
    };
}

/**
 * Fetch detailed engagement data for a Farcaster post
 */
export const fetchFarcasterPostEngagements = async (postHash: string): Promise<{
    comments: Array<{ user: any }>;
    quotes: Array<{ user: any }>;
    replies: Array<{ user: any }>;
    reposts: Array<{ user: any }>;
}> => {
    try {
        const client = new GraphQLClient(FARCASTER_API_URL);
        const data = await client.request<FarcasterEngagementResponse>(
            GET_POST_ENGAGEMENTS,
            { hash: postHash }
        );

        const now = new Date();
        
        const formatUser = (author: any) => {
            const createdAt = new Date(author.createdAt);
            const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                username: author.username,
                handle: author.username,
                isVerified: author.verifications && author.verifications.length > 0,
                followers: author.followerCount || 0,
                joinedDate: createdAt,
                accountAge
            };
        };

        return {
            comments: data.cast.replies.edges.map(edge => ({
                user: formatUser(edge.node.author)
            })),
            quotes: data.cast.quotes.edges.map(edge => ({
                user: formatUser(edge.node.author)
            })),
            replies: data.cast.replies.edges.map(edge => ({
                user: formatUser(edge.node.author)
            })),
            reposts: data.cast.recasts.edges.map(edge => ({
                user: formatUser(edge.node.user)
            }))
        };
    } catch (error) {
        console.error(`Error fetching Farcaster post engagements for ${postHash}:`, error);
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }
};

