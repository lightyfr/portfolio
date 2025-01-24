import { fetchGitHubData } from './index';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.join(process.cwd(), 'data', 'githubData.json');
const lastFetchFilePath = path.join(process.cwd(), 'data', 'lastFetch.json');

const fetchData = async () => {
    let lastFetchTime = 0;
    if (fs.existsSync(lastFetchFilePath)) {
        const lastFetchData = JSON.parse(fs.readFileSync(lastFetchFilePath, 'utf-8'));
        lastFetchTime = lastFetchData.lastFetchTime;
    }

    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (currentTime - lastFetchTime < twentyFourHours) {
        console.log('Using existing data from githubData.json');
        const existingData = fs.readFileSync(cacheFilePath, 'utf-8');
        return JSON.parse(existingData);
    }

    // Fetch new data from GitHub API
    console.log('Fetching new data from GitHub API');
    const data = await fetchGitHubData();
    fs.writeFileSync(cacheFilePath, JSON.stringify(data));

    // After fetching, update the last fetch time
    fs.writeFileSync(lastFetchFilePath, JSON.stringify({ lastFetchTime: currentTime }));
    return data;
};

async function refreshData() {
    try {
        const data = await fetchData();
        console.log('GitHub data refreshed successfully:', data);
    } catch (error) {
        console.error('Error refreshing GitHub data:', error);
    }
}

setInterval(refreshData, 86400000); // Refresh every 24 hours

// Initial fetch
refreshData();
