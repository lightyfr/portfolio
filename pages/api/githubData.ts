import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs/promises';

interface CacheData {
  totalCommits: number;
  totalRepos: number;
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
  //if (memoryCache?.totalCommits && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
  //  return memoryCache.totalCommits;
  //}

  // Check file cache
  const cachedData = await getCachedData();
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    memoryCache = cachedData;
    return cachedData.totalCommits;
  }

  try {
    const response = await fetch('https://github-contributions-api.deno.dev/lightyfr.text');
    const data = await response.text();

    // Extract contribution count from response like "597 contributions in the last year"
    const contributionCount = parseInt(data.split(' ')[0]);

    // Update both caches
    const newCache: CacheData = {
      totalCommits: contributionCount, timestamp: Date.now(),
      totalRepos: 0
    };
    memoryCache = newCache;
    await writeCacheData(newCache);

    return contributionCount;
  } catch (error) {
    console.error('Failed to fetch commit count:', error);
    return cachedData?.totalCommits || 0;
  }
}

async function fetchRepoCount(token: string): Promise<number> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    console.error('Failed to fetch repo count:', response.status);
    return 0;
  }
  const repos = await response.json();
  return repos.length;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('Missing GITHUB_TOKEN');

    const totalRepos = await fetchRepoCount(token);
    const totalCommits = await fetchCommitCount(token);

    const responseData: CacheData = {
      totalRepos,
      totalCommits,
      timestamp: 0
    };

    memoryCache = responseData;
    await writeCacheData(responseData);
    res.status(200).json(responseData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
}