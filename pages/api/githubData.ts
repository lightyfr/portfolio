import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs/promises';
import { Octokit } from '@octokit/rest';

interface CacheData {
  totalCommits: number;
  totalRepos: number;
  timestamp: number;
}

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const cachePath = path.join(process.cwd(), 'data', 'github-cache.json');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// In-memory cache
const memoryCache = new Map<string, CacheData>();

async function fetchGitHubData(): Promise<{ commits: number, repos: number}> {
  const repos = await octokit.repos.listForAuthenticatedUser();
  let totalCommits = 0;
  
  const response = await fetch('https://github-contributions-api.deno.dev/lightyfr.text');
  const data = await response.text();
  const contributionCount = parseInt(data.split(' ')[0]);

  return {
    commits: contributionCount,
    repos: repos.data.length,
  };
}

async function refreshCache(): Promise<CacheData> {
  const { commits, repos } = await fetchGitHubData();
  const newData: CacheData = {
    totalCommits: commits,
    totalRepos: repos,
    timestamp: Date.now()
  };

  memoryCache.set('github', newData);
  await fs.writeFile(cachePath, JSON.stringify(newData));
  return newData;
}

async function getCachedData(): Promise<CacheData | null> {
  // Check memory cache first
  const memData = memoryCache.get('github');
  if (memData) return memData;

  // Fall back to file cache
  try {
    const data = await fs.readFile(cachePath, 'utf-8');
    const parsed = JSON.parse(data) as CacheData;
    memoryCache.set('github', parsed);
    return parsed;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get cached data first
  const cachedData = await getCachedData();

  if (cachedData) {
    const freshData = await refreshCache();
    // Trigger background refresh if stale
    if (Date.now() - cachedData.timestamp > CACHE_DURATION) {
      refreshCache().catch(console.error);
    }
    return res.status(200).json(cachedData);
  }

  // If no cache exists, wait for fresh data
  const freshData = await refreshCache();
  return res.status(200).json(freshData);
}