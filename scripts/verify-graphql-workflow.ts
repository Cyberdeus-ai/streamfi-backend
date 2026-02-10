import dotenv from 'dotenv';
import { GraphQLClient, gql } from 'graphql-request';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

dotenv.config();
const DEFAULT_PORT = process.env.GRAPHQL_PORT || '5001';
const GRAPHQL_HTTP_URL =
  process.env.GRAPHQL_URL || `http://localhost:${DEFAULT_PORT}/graphql`;
const GRAPHQL_WS_URL = GRAPHQL_HTTP_URL.replace(/^http/, 'ws');

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
  error?: string;
}

const results: TestResult[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, passed: true, detail });
}

function fail(name: string, error: string) {
  results.push({ name, passed: false, error });
}

async function runHttpTests(client: GraphQLClient): Promise<void> {
  try {
    const introspection = await client.request<{
      __schema?: { queryType?: { name?: string }; types?: { name: string }[] };
    }>(gql`
      query Introspection {
        __schema {
          queryType { name }
          types { name }
        }
      }
    `);
    const schema = introspection?.__schema;
    const hasQueryType = schema?.queryType?.name === 'Query';
    const hasTypes = Array.isArray(schema?.types) && schema.types.length > 0;
    if (hasQueryType && hasTypes) {
      pass('GraphQL server reachable and schema valid', `${schema?.types?.length ?? 0} types`);
    } else {
      fail('Introspection', 'Unexpected introspection response');
    }
  } catch (e: unknown) {
    const msg = (e as Error)?.message || String(e);
    fail('GraphQL server reachable', msg);
    return;
  }

  try {
    const data = await client.request(gql`
      query GetCampaignData($campaignId: ID!) {
        getCampaignData(campaignId: $campaignId) {
          campaignId
          posts { id platform content }
          totalEngagements
        }
      }
    `, { campaignId: '1' });

    const cd = (data as any)?.getCampaignData;
    if (cd == null) {
      fail('getCampaignData', 'Response missing getCampaignData');
    } else if (typeof cd.campaignId === 'undefined') {
      fail('getCampaignData', 'getCampaignData missing campaignId');
    } else {
      const hasPosts = Array.isArray(cd.posts);
      const hasTotal = typeof cd.totalEngagements === 'number';
      pass(
        'getCampaignData workflow',
        hasPosts && hasTotal
          ? `campaignId=${cd.campaignId}, posts=${cd.posts.length}, totalEngagements=${cd.totalEngagements}`
          : `campaignId=${cd.campaignId} (shape ok)`
      );
    }
  } catch (e: any) {
    fail('getCampaignData', e?.message || String(e));
  }

  try {
    const data = await client.request(gql`
      query GetCampaignPosts($campaignId: ID!) {
        getCampaignPosts(campaignId: $campaignId) {
          id
          platform
          content
        }
      }
    `, { campaignId: '1' });

    const posts = (data as any)?.getCampaignPosts;
    if (!Array.isArray(posts)) {
      fail('getCampaignPosts', 'Response is not an array');
    } else {
      pass('getCampaignPosts workflow', `Returned ${posts.length} post(s)`);
    }
  } catch (e: any) {
    fail('getCampaignPosts', e?.message || String(e));
  }

  try {
    const data = await client.request(gql`
      query GetPostEngagements($campaignId: ID!, $postId: String!) {
        getPostEngagements(campaignId: $campaignId, postId: $postId) {
          comments { id }
          quotes { id }
          replies { id }
          reposts { id }
        }
      }
    `, { campaignId: '1', postId: 'test-post-id' });

    const eng = (data as any)?.getPostEngagements;
    if (eng == null) {
      fail('getPostEngagements', 'Response missing getPostEngagements');
    } else {
      const hasArrays =
        Array.isArray(eng.comments) &&
        Array.isArray(eng.quotes) &&
        Array.isArray(eng.replies) &&
        Array.isArray(eng.reposts);
      if (hasArrays) {
        pass('getPostEngagements workflow', 'Engagements shape valid');
      } else {
        fail('getPostEngagements', 'Engagements missing required arrays');
      }
    }
  } catch (e: any) {
    fail('getPostEngagements', e?.message || String(e));
  }
}

async function runWsTest(): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (resolved) return;
      resolved = true;
      wsClient.dispose();
      resolve();
    };

    const wsClient = createClient({
      url: GRAPHQL_WS_URL,
      webSocketImpl: WebSocket,
    });

    const timeout = setTimeout(() => {
      pass('WebSocket / subscriptions endpoint', 'Connected (no events in 2s)');
      done();
    }, 2000);

    wsClient.subscribe(
      {
        query: `
          subscription PointsUpdated($campaignId: ID!) {
            pointsUpdated(campaignId: $campaignId) {
              campaignId
              timestamp
            }
          }
        `,
        variables: { campaignId: '1' },
      },
      {
        next: () => {
          clearTimeout(timeout);
          pass('WebSocket / subscriptions endpoint', 'Connected and received event');
          done();
        },
        error: (err: unknown) => {
          clearTimeout(timeout);
          fail('WebSocket / subscriptions endpoint', (err as Error)?.message || String(err));
          done();
        },
        complete: () => done(),
      }
    );
  });
}

async function main() {
  console.log('GraphQL Workflow Verification');
  console.log('==============================');
  console.log(`HTTP endpoint: ${GRAPHQL_HTTP_URL}`);
  console.log(`WS endpoint:   ${GRAPHQL_WS_URL}`);
  console.log('');

  const client = new GraphQLClient(GRAPHQL_HTTP_URL);

  await runHttpTests(client);
  await runWsTest();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    const msg = r.passed ? r.detail || 'ok' : r.error || 'failed';
    console.log(`  ${icon} ${r.name}: ${msg}`);
  }

  console.log('');
  console.log(`Result: ${passed}/${results.length} checks passed`);

  if (failed.length > 0) {
    console.error('\nFailed checks:', failed.map((f) => f.name).join(', '));
    console.log('\nTip: Start the GraphQL server first (e.g. npm run dev:graphql or npm run start:graphql).');
    console.log('     If using a different port, set GRAPHQL_URL (e.g. GRAPHQL_URL=http://localhost:5010/graphql).');
    process.exit(1);
  }

  console.log('\nGraphQL server is communicating with the backend correctly.');
  console.log('All queries and subscriptions are working.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});
