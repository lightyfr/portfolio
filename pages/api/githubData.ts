import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const cachePath = path.join(process.cwd(), 'data', 'github-cache.json');

// In-memory cache
const memoryCache: { totalCommits?: number } = {};
const memoryCacheTimestamp = Date.now();

type Commit = {
    sha: string;
    commit: {
        author: {
            name: string;
            email: string;
            date: string;
        };
        message: string;
    };
};

async function fetchCommitCount(token: string): Promise<number> {
    // Check memory cache first
    if (memoryCache.totalCommits && Date.now() - memoryCacheTimestamp < CACHE_DURATION) {
        return memoryCache.totalCommits;
    }

    const response = await fetch(
        'https://api.github.com/search/commits?q=author:lightyfr',
        {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        }
    );

    const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
    if (remaining < 10) {
        await new Promise(resolve => setTimeout(resolve, 60000));
    }

    const data = await response.json();
    memoryCache.totalCommits = data.total_count;
    return data.total_count;
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getCachedData() {
    if (await fileExists(cachePath)) {
        const stats = await fs.stat(cachePath);
        if (Date.now() - stats.mtimeMs < CACHE_DURATION) {
            return JSON.parse(await fs.readFile(cachePath, 'utf8'));
        }
    }
    return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Add to handler
        if (req.query.force === 'true') {
            console.log('Forcing cache refresh');
            await fs.writeFile(cachePath, JSON.stringify({})); // Invalidate cache
        }
        // Try to serve cached data first
        const cachedData = await getCachedData();
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch fresh data if cache is expired
        const token = process.env.GITHUB_TOKEN;
        if (!token) throw new Error('Missing GITHUB_TOKEN');

        const commitCount = await fetchCommitCount(token);
        const responseData = {
            totalCommits: commitCount,
            lastUpdated: new Date().toISOString()
        };

        // Update cache
        await fs.writeFile(cachePath, JSON.stringify(responseData));
        res.status(200).json(responseData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch GitHub data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}