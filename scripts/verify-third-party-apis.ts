import dotenv from 'dotenv';
import { fetchFarcasterDataByHashtag } from '../graphql/third-party/farcaster';

dotenv.config();

const LENS_URL = 'https://api.lens.xyz/graphql';
const MINDS_URL = 'https://www.minds.com/api/v1';

async function gqlOk(url: string): Promise<{ ok: boolean; err?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, err: `HTTP ${res.status}` };
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, err: 'response not JSON' };
    }
    const obj = json as { errors?: unknown[]; data?: unknown };
    if (obj.errors && obj.errors.length) {
      const msg = (obj.errors[0] as { message?: string })?.message ?? String(obj.errors[0]);
      return { ok: false, err: msg };
    }
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, err: msg };
  }
}

async function getOk(url: string): Promise<{ ok: boolean; err?: string }> {
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, err: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, err: msg };
  }
}

async function run() {
  const results: { name: string; ok: boolean; err?: string }[] = [];

  try {
    const posts = await fetchFarcasterDataByHashtag('base', 1);
    results.push({ name: 'Farcaster', ok: Array.isArray(posts) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name: 'Farcaster', ok: false, err: msg });
  }

  const l = await gqlOk(LENS_URL);
  results.push({ name: 'Lens', ok: l.ok, err: l.err });

  const m = await getOk(`${MINDS_URL}/search?q=test&type=activity&limit=1`);
  results.push({ name: 'Minds', ok: m.ok, err: m.err });

  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL';
    const extra = r.err ? ` — ${r.err}` : '';
    console.log(`${r.name}: ${status}${extra}`);
  }
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

run();
