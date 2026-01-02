
import { Article } from './kv';
import { parseStringPromise } from 'xml2js';

interface RedditAtomEntry {
    title: string[];
    link: Array<{ $: { href: string } }>;
    updated: string[];
    author: Array<{ name: string[] }>;
    category?: Array<{ $: { term: string } }>;
}

export async function fetchRedditRSS(subreddit: string): Promise<Article[]> {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/new/.rss?sort=new`;
        console.log(`Fetching Reddit RSS: ${url}`);

        // Crucial: Use a standard browser User-Agent
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch r/${subreddit} RSS: ${response.status}`);
            return [];
        }

        const xml = await response.text();
        const result = await parseStringPromise(xml);

        if (!result.feed || !result.feed.entry) {
            return [];
        }

        const entries: RedditAtomEntry[] = result.feed.entry;

        return entries.map(entry => {
            const title = entry.title?.[0] || 'Untitled';
            const link = entry.link?.[0]?.$.href || '';
            const updated = entry.updated?.[0] || new Date().toISOString();
            const author = entry.author?.[0]?.name?.[0] || 'Unknown';

            // Extract flair or use regex on title if needed
            const keywords = [`r/${subreddit}`];

            return {
                url: link,
                title: title,
                published_at: new Date(updated).toISOString(),
                source: `reddit.com/r/${subreddit}`,
                keywords: keywords,
                first_seen_at: new Date().toISOString()
            };
        });

    } catch (error) {
        console.error(`Error fetching r/${subreddit} RSS:`, error);
        return [];
    }
}
