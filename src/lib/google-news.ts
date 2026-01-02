
import { Article } from './kv';
import { parseStringPromise } from 'xml2js';

interface RssItem {
    title: string[];
    link: string[];
    pubDate: string[];
    source?: Array<{ _: string, $: { url: string } }>;
}

export async function fetchGoogleNews(topic: 'TECHNOLOGY' | 'GENERAL' = 'GENERAL'): Promise<Article[]> {
    try {
        let url = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en'; // Default Top Stories
        if (topic === 'TECHNOLOGY') {
            url = 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en';
        }

        console.log(`Fetching Google News (${topic}): ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)'
            },
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            console.error(`Failed to fetch Google News (${topic}): ${response.status}`);
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
                keywords: [topic === 'TECHNOLOGY' ? 'Technology' : 'General', 'Google News'],
                first_seen_at: new Date().toISOString()
            };
        });

    } catch (error) {
        console.error(`Error fetching Google News (${topic}):`, error);
        return [];
    }
}
