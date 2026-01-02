
import { Article } from './kv';
import { parseStringPromise } from 'xml2js';

interface RssItem {
    title: string[];
    link: string[];
    pubDate: string[];
    source?: Array<{ _: string, $: { url: string } }>;
}

export async function fetchGoogleNews(topicOrQuery: string): Promise<Article[]> {
    try {
        let url = '';

        // Define known topics or assume it's a search query
        const KNOWN_TOPICS: Record<string, string> = {
            'GENERAL': 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
            'TECHNOLOGY': 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en',
            'SCIENCE': 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en',
        };

        if (KNOWN_TOPICS[topicOrQuery]) {
            url = KNOWN_TOPICS[topicOrQuery];
        } else {
            // Treat as search query
            const encodedQuery = encodeURIComponent(topicOrQuery);
            url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
        }

        console.log(`Fetching Google News (${topicOrQuery}): ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)'
            },
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch Google News (${topicOrQuery}): ${response.status}`);
            return [];
        }

        const xml = await response.text();
        const result = await parseStringPromise(xml);

        if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
            return [];
        }

        const items: RssItem[] = result.rss.channel[0].item;

        return items.map(item => {
            const title = item.title?.[0] || 'Untitled';
            const link = item.link?.[0] || '';
            const pubDate = item.pubDate?.[0] || new Date().toISOString();
            const sourceName = item.source?.[0]?._ || 'Google News';

            return {
                url: link,
                title: title,
                published_at: new Date(pubDate).toISOString(),
                source: sourceName,
                keywords: [topicOrQuery, 'Google News'],
                first_seen_at: new Date().toISOString()
            };
        });

    } catch (error) {
        console.error(`Error fetching Google News (${topicOrQuery}):`, error);
        return [];
    }
}
