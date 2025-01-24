import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const cachePath = path.join(process.cwd(), 'data', 'github-cache.json');

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

async function fetchAllCommits(repo: string) {
    const token = process.env.GITHUB_TOKEN;
    const commits: Commit[] = [];
    const page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(
            `https://api.github.com/repos/lightyfr/${repo}/commits?` + new URLSearchParams({
                author: 'lightyfr',
                committer: 'lightyfr', // Add committer filter
                per_page: '100', // Max allowed
                page: page.toString(),
            }),
            {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        // Add rate limit handling
        const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0');
        if (remaining < 10) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 min
        }

        // Handle pagination
        const linkHeader = response.headers.get('Link');
        hasMore = linkHeader?.includes('rel="next"') ?? false;
        
        // ... rest of existing code ...
    }
    return commits;
}

async function getCachedData() {
    if (await exists(cachePath)) {
        const stats = await stat(cachePath);
        if (Date.now() - stats.mtimeMs < CACHE_DURATION) {
            return JSON.parse(await readFile(cachePath, 'utf8'));
        }
    }
    return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Add to handler
        if (req.query.force === 'true') {
            console.log('Forcing cache refresh');
            await writeFile(cachePath, JSON.stringify({})); // Invalidate cache
        }
        // Try to serve cached data first
        const cachedData = await getCachedData();
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // Fetch fresh data if cache is expired
        const token = process.env.GITHUB_TOKEN;
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        if (!reposResponse.ok) {
            throw new Error(`GitHub API error: ${reposResponse.status}`);
        }

        const repos = await reposResponse.json();
        const filteredRepos = repos.filter((repo: { fork: boolean; owner: { login: string; }; }) => 
            !repo.fork && repo.owner.login === 'lightyfr'
        );

        // Fetch commits for all repositories in parallel
        const reposWithCommits = await Promise.all(
            filteredRepos.map(async (repo: { name: string; private: boolean; }) => ({
                name: repo.name,
                commits: await fetchAllCommits(repo.name),
                private: repo.private
            }))
        );

        // Calculate totals
        const responseData = {
            totalCommits: reposWithCommits.reduce((acc, repo) => acc + repo.commits.length, 0),
            totalRepos: filteredRepos.length,
            lastUpdated: new Date().toISOString(),
            repos: reposWithCommits
        };

        // Update cache
        await writeFile(cachePath, JSON.stringify(responseData));
        res.status(200).json(responseData);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch GitHub data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}