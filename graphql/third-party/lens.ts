import { GraphQLClient, gql } from 'graphql-request';

const LENS_API_URL = 'https://api.lens.xyz/graphql';

const SEARCH_PUBLICATIONS = gql`
    query SearchPublications($query: String!, $limit: LimitScalar!) {
        search(request: {
            query: $query
            type: PUBLICATION
            limit: $limit
        }) {
            ... on PublicationSearchResult {
                items {
                    ... on Post {
                        id
                        createdAt
                        metadata {
                            content
                        }
                        by {
                            id
                            handle {
                                fullHandle
                            }
                        }
                        stats {
                            comments
                            mirrors
                            quotes
                            reactions
                        }
                    }
                    ... on Comment {
                        id
                        createdAt
                        metadata {
                            content
                        }
                        by {
                            id
                            handle {
                                fullHandle
                            }
                        }
                        stats {
                            comments
                            mirrors
                            quotes
                            reactions
                        }
                    }
                    ... on Quote {
                        id
                        createdAt
                        metadata {
                            content
                        }
                        by {
                            id
                            handle {
                                fullHandle
                            }
                        }
                        stats {
                            comments
                            mirrors
                            quotes
                            reactions
                        }
                    }
                }
            }
        }
    }
`;

const GET_PUBLICATION_ENGAGEMENTS = gql`
    query GetPublicationEngagements($publicationId: PublicationId!) {
        publication(request: { publicationId: $publicationId }) {
            ... on Post {
                id
                comments(request: { limit: 50 }) {
                    items {
                        id
                        by {
                            id
                            handle {
                                fullHandle
                            }
                            onChainIdentity {
                                worldcoin {
                                    isHuman
                                }
                            }
                            stats {
                                followers
                            }
                            createdAt
                        }
                    }
                }
                mirrors(request: { limit: 50 }) {
                    items {
                        id
                        by {
                            id
                            handle {
                                fullHandle
                            }
                            onChainIdentity {
                                worldcoin {
                                    isHuman
                                }
                            }
                            stats {
                                followers
                            }
                            createdAt
                        }
                    }
                }
                quotes(request: { limit: 50 }) {
                    items {
                        id
                        by {
                            id
                            handle {
                                fullHandle
                            }
                            onChainIdentity {
                                worldcoin {
                                    isHuman
                                }
                            }
                            stats {
                                followers
                            }
                            createdAt
                        }
                    }
                }
            }
        }
    }
`;

interface LensPublication {
    id: string;
    createdAt: string;
    metadata: {
        content: string;
    };
    by: {
        id: string;
        handle: {
            fullHandle: string;
        };
    };
    stats: {
        comments: number;
        mirrors: number;
        quotes: number;
        reactions: number;
    };
}

interface LensSearchResponse {
    search: {
        items: LensPublication[];
    };
}

interface LensEngagementResponse {
    publication: {
        comments: {
            items: Array<{
                id: string;
                by: {
                    id: string;
                    handle: { fullHandle: string };
                    onChainIdentity?: {
                        worldcoin?: { isHuman: boolean };
                    };
                    stats: { followers: number };
                    createdAt: string;
                };
            }>;
        };
        mirrors: {
            items: Array<{
                id: string;
                by: {
                    id: string;
                    handle: { fullHandle: string };
                    onChainIdentity?: {
                        worldcoin?: { isHuman: boolean };
                    };
                    stats: { followers: number };
                    createdAt: string;
                };
            }>;
        };
        quotes: {
            items: Array<{
                id: string;
                by: {
                    id: string;
                    handle: { fullHandle: string };
                    onChainIdentity?: {
                        worldcoin?: { isHuman: boolean };
                    };
                    stats: { followers: number };
                    createdAt: string;
                };
            }>;
        };
    };
}

export const fetchLensDataByHashtag = async (
    hashtag: string,
    limit: number = 50
): Promise<LensPublication[]> => {
    try {
        const client = new GraphQLClient(LENS_API_URL);
        const query = `#${hashtag.replace('#', '')}`;
        const variables = { query, limit };
        
        const data = await client.request<LensSearchResponse>(
            SEARCH_PUBLICATIONS,
            variables
        );

        return data.search.items;
    } catch (error) {
        console.error(`Error fetching Lens data for hashtag ${hashtag}:`, error);
        return [];
    }
};

export const fetchLensPostEngagements = async (publicationId: string): Promise<{
    comments: Array<{ user: any }>;
    quotes: Array<{ user: any }>;
    replies: Array<{ user: any }>;
    reposts: Array<{ user: any }>;
}> => {
    try {
        const client = new GraphQLClient(LENS_API_URL);
        const data = await client.request<LensEngagementResponse>(
            GET_PUBLICATION_ENGAGEMENTS,
            { publicationId }
        );

        const now = new Date();
        
        const formatUser = (by: any) => {
            const createdAt = new Date(by.createdAt);
            const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
                username: by.handle.fullHandle,
                handle: by.handle.fullHandle,
                isVerified: by.onChainIdentity?.worldcoin?.isHuman || false,
                followers: by.stats?.followers || 0,
                joinedDate: createdAt,
                accountAge
            };
        };

        return {
            comments: data.publication.comments.items.map(item => ({
                user: formatUser(item.by)
            })),
            quotes: data.publication.quotes.items.map(item => ({
                user: formatUser(item.by)
            })),
            replies: [], // Lens doesn't distinguish replies from comments
            reposts: data.publication.mirrors.items.map(item => ({
                user: formatUser(item.by)
            }))
        };
    } catch (error) {
        console.error(`Error fetching Lens post engagements for ${publicationId}:`, error);
        return { comments: [], quotes: [], replies: [], reposts: [] };
    }
};

