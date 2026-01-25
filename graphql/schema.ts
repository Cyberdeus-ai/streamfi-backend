import { gql } from 'graphql-tag';

export const typeDefs = gql`
    type UserProfile {
        username: String!
        handle: String!
        isVerified: Boolean!
        followers: Int!
        joinedDate: String!
        accountAge: Int!
    }

    type Comment {
        id: String!
        content: String!
        user: UserProfile!
        createdAt: String!
    }

    type Quote {
        id: String!
        content: String!
        user: UserProfile!
        createdAt: String!
    }

    type Reply {
        id: String!
        content: String!
        user: UserProfile!
        createdAt: String!
    }

    type Repost {
        id: String!
        user: UserProfile!
        createdAt: String!
    }

    type PostEngagements {
        comments: [Comment!]!
        quotes: [Quote!]!
        replies: [Reply!]!
        reposts: [Repost!]!
    }

    type Post {
        id: String!
        platform: String!
        content: String!
        author: UserProfile!
        hashtags: [String!]!
        tickers: [String!]!
        engagements: PostEngagements!
        createdAt: String!
    }

    type CampaignData {
        campaignId: ID!
        posts: [Post!]!
        totalEngagements: Int!
    }

    type PointsUpdate {
        promoterId: ID!
        campaignId: ID!
        platform: String!
        points: Int!
        newTotalPoints: Int!
        timestamp: String!
    }

    type Query {
        getCampaignPosts(
            campaignId: ID!
        ): [Post!]!

        getPostEngagements(
            campaignId: ID!
            postId: String!
        ): PostEngagements!

        getCampaignData(
            campaignId: ID!
        ): CampaignData!
    }

    type Subscription {
        newPost(campaignId: ID!, platform: String!): Post!
        newEngagement(campaignId: ID!, platform: String!): PostEngagements!
        pointsUpdated(campaignId: ID!): PointsUpdate!
    }
`;
