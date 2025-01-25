import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { profileConfig } from "@/data/userConfig";
import path from 'path';
import fs from 'fs/promises';

interface CacheData {
  totalCommits: number;
  totalRepos: number;
  totalStars?: number;
  timestamp: number;
}

const CACHE_DURATION = 3600000; // 1 hour
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Serverless-friendly cache implementation
const getCachePath = () => 
  path.join(process.cwd(), 'tmp', 'github-cache.json');

async function fetchGitHubData() {
  try {
    // Get repository data
    const repos = await octokit.repos.listForAuthenticatedUser();
    
    // Get contribution data
    const contributionsRes = await fetch(
      `https://github-contributions-api.deno.dev/${profileConfig.github.username}.txt`
    );
    const contributionsText = await contributionsRes.text();
    const contributionCount = parseInt(contributionsText.split(' ')[0]);

    // Calculate stars
    const totalStars = repos.data.reduce(
      (acc, repo) => acc + (repo.stargazers_count ?? 0), 
      0
    );

    return {
      commits: contributionCount,
      totalStars,
      repos: repos.data.length,
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

async function readCache(): Promise<CacheData | null> {
  try {
    const cachePath = getCachePath();
    const data = await fs.readFile(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function writeCache(data: CacheData) {
  try {
    const cachePath = getCachePath();
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(data));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

function isCacheValid(cache: CacheData): boolean {
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

export async function GET() {
  try {
    // Try to read cache
    const cache = await readCache();
    
    // Serve cached data if valid
    if (cache && isCacheValid(cache)) {
      return NextResponse.json({
        commits: cache.totalCommits,
        totalStars: cache.totalStars,
        totalRepos: cache.totalRepos
      });
    }

    // Fetch fresh data
    const { commits, totalStars, repos } = await fetchGitHubData();
    
    // Create new cache
    const newCache = {
      totalCommits: commits,
      totalStars,
      totalRepos: repos,
      timestamp: Date.now()
    };

    // Write cache in background
    writeCache(newCache).catch(console.error);

    return NextResponse.json({
      commits: newCache.totalCommits,
      totalStars: newCache.totalStars,
      totalRepos: newCache.totalRepos
    });

  } catch (error) {
    console.error('Failed to fetch GitHub data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}