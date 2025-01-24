import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs/promises';

interface CacheData {
  totalCommits: number;
  timestamp: number;
}

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const cachePath = path.join(process.cwd(), 'data', 'github-cache.json');

// In-memory cache
let memoryCache: CacheData | null = null;

async function getCachedData(): Promise<CacheData | null> {
  try {
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeCacheData(data: CacheData): Promise<void> {
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write cache:', error);
  }
}

async function fetchCommitCount(token: string): Promise<number> {
  // Check memory cache first
  if (memoryCache?.totalCommits && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
    return memoryCache.totalCommits;
  }

  // Check file cache
  const cachedData = await getCachedData();
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    memoryCache = cachedData;
    return cachedData.totalCommits;
  }

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            viewer {
              contributionsCollection {
                totalCommitContributions
              }
            }
          }
        `
      }),
    });

    const data = await response.json();
    const totalCommits = data.data.viewer.contributionsCollection.totalCommitContributions;

    // Update both caches
    const newCache: CacheData = { totalCommits, timestamp: Date.now() };
    memoryCache = newCache;
    await writeCacheData(newCache);

    return totalCommits;
  } catch (error) {
    console.error('Failed to fetch commit count:', error);
    return cachedData?.totalCommits || 0;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) throw new Error('Missing GITHUB_TOKEN');

        const commitCount = await fetchCommitCount(token);
        const responseData: CacheData = {
            totalCommits: commitCount,
            timestamp: Date.now()
        };

        await writeCacheData(responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }
}