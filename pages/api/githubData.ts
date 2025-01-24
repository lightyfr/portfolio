import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs/promises';
import { Octokit } from '@octokit/rest';
import { siteConfig } from "@/data/userConfig";

interface CacheData {
  totalCommits: number;
  totalRepos: number;
  totalStars?: number;
  timestamp: number;
}

interface GitHubData {
  repos: number;
  stars: number;
  commits: number;
  followers: number;
}

interface ErrorResponse {
  error: string;
}

interface GitHubAPIResponse {
  totalStars?: number;
  commits: number;
  totalRepos: number;
}

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const cachePath = path.join(process.cwd(), 'data', 'github-cache.json');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// In-memory cache
const memoryCache = new Map<string, CacheData>();

async function fetchGitHubData(): Promise<{ commits: number, repos: number, totalStars?: number }> {
  const repos = await octokit.repos.listForAuthenticatedUser();
  
  const response = await fetch(`https://github-contributions-api.deno.dev/${siteConfig.github.username}.txt`);
  const data = await response.text();
  console.log(data);
  const contributionCount = parseInt(data.split(' ')[0]);

  return {
    commits: contributionCount,
    totalStars: repos.data.reduce((acc, repo) => acc + (repo.stargazers_count ?? 0), 0),
    repos: repos.data.length,
  };
}

async function refreshCache(): Promise<CacheData> {
  const { commits, repos, totalStars } = await fetchGitHubData();
  const newData: CacheData = {
    totalCommits: commits,
    totalStars: totalStars,
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

function isCacheExpired(timestamp: number): boolean {
  return Date.now() - timestamp >= CACHE_DURATION;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GitHubAPIResponse | ErrorResponse>) {
  try {
    // Try to get cached data first
    const cachedData = await getCachedData();

    if (cachedData) {
      // If cache exists, start background refresh if expired
      if (isCacheExpired(cachedData.timestamp)) {
        refreshCache().catch(err => 
          console.error('Background cache refresh failed:', err)
        );
      }
      
      // Return cached data immediately
      return res.status(200).json({
        commits: cachedData.totalCommits,
        totalStars: cachedData.totalStars,
        totalRepos: cachedData.totalRepos
      });
    }

    // No cache exists, must wait for initial fetch
    const newData = await refreshCache();
    return res.status(200).json({
      totalStars: newData.totalStars,
      commits: newData.totalCommits,
      totalRepos: newData.totalRepos
    });

  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return res.status(500).json({ error: 'Failed to fetch GitHub data' });
  }
}

export async function getGitHubData(): Promise<GitHubData> {
  const username = siteConfig.github.username;
  
  // Get user data
  const { data: userData } = await octokit.users.getByUsername({
    username,
  });

  // Get repos
  const { data: repos } = await octokit.repos.listForUser({
    username,
    per_page: 100,
  });

  // Calculate total stars
  const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count ?? 0), 0);

  // Get total commits across all repos
  const commits: number[] = await Promise.all(
    repos.map(async (repo) => {
      try {
        const { data: repoCommits } = await octokit.repos.listCommits({
          owner: username,
          repo: repo.name,
          per_page: 1,
        });
        return repoCommits[0]?.sha ? 1 : 0;
      } catch {
        return 0;
      }
    })
  );
  const totalCommits = commits.reduce((acc, count) => acc + count, 0);

  return {
    repos: repos.length,
    stars: totalStars,
    commits: totalCommits,
    followers: userData.followers,
  };
}