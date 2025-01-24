import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.join(process.cwd(), 'data', 'githubData.json');

const fetchAllCommits = async (repoName: string) => {
    let allCommits = [];
    let page = 1;
    let hasMoreCommits = true;

    const token = process.env.GITHUB_TOKEN; // Ensure to set this in your environment

    while (hasMoreCommits) {
        const commitsResponse = await fetch(`https://api.github.com/repos/lightyfr/${repoName}/commits?page=${page}`, {
            headers: {
                'Authorization': `token ${token}`
            }
        });
        if (!commitsResponse.ok) {
            const errorBody = await commitsResponse.text();
            console.error('Error fetching commits:', commitsResponse.status, errorBody);
            throw new Error('Network response was not ok');
        }

        const commits = await commitsResponse.json();
        allCommits = allCommits.concat(commits);
        hasMoreCommits = commits.length > 0; // Stop if no more commits are returned
        page++;
    }

    return allCommits;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Fetch repository data
            const reposResponse = await fetch('https://api.github.com/users/lightyfr/repos');
            if (!reposResponse.ok) {
                const errorBody = await reposResponse.text();
                console.error('Error fetching repos:', reposResponse.status, errorBody);
                throw new Error('Network response was not ok');
            }
            const reposData = await reposResponse.json();

            // Fetch commit data for each repository
            const commitsData = await Promise.all(reposData.map(async (repo) => {
                const commits = await fetchAllCommits(repo.name);
                console.log(`Fetched ${commits.length} commits for ${repo.name}`);
                return commits;
            }));

            // Combine repository and commit data
            const combinedData = reposData.map((repo, index) => ({ ...repo, commits: commitsData[index] }));

            // Write combined data to JSON file
            fs.writeFileSync(cacheFilePath, JSON.stringify(combinedData, null, 2));
            res.status(200).json(combinedData);
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            res.status(500).json({ error: 'Failed to fetch data' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
