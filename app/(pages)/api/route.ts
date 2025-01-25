import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { profileConfig } from "@/data/userConfig";

const CACHE_DURATION = 3600000;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });


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

export async function GET() {
  try {
    const data = await fetchGitHubData();
    
    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=300`
      }
    });
  } catch (error) {
    console.error('Failed to fetch GitHub data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch GitHub data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
