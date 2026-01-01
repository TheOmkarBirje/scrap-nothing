import { NextResponse } from 'next/server';
import { parseSitemap } from '@/lib/parser';
import { addArticle, Article } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sitemapUrl = 'https://particle.news/sitemap.xml';
        console.log(`Fetching sitemap from ${sitemapUrl}`);
        const response = await fetch(sitemapUrl, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: 'Failed to fetch sitemap' }, { status: 500 });
        }

        const xml = await response.text();
        const items = await parseSitemap(xml);
        console.log(`Parsed ${items.length} items from sitemap`);

        let addedCount = 0;

        // Process items in reverse order so that if we add them to a list (LPUSH), 
        // the newest ones (usually at top of sitemap) end up at the top if we push them last?
        // Actually, LPUSH adds to head: LPUSH [A, B] -> B, A (list is B, A). 
        // If sitemap has [Newest, Oldest], and we iterate Newest -> Oldest:
        // 1. LPUSH Newest -> [Newest]
        // 2. LPUSH Oldest -> [Oldest, Newest]
        // Result: Oldest is at index 0.

        // We want the most recent articles at index 0.
        // So we should LPUSH the Oldest first, then the Newest.
        // If sitemap is [Newest ... Oldest]
        // We should iterate in reverse: Oldest -> Newest.

        const reversedItems = [...items].reverse();

        for (const item of reversedItems) {
            const article: Article = {
                url: item.url,
                title: item.title,
                published_at: item.published_at,
                keywords: item.keywords,
                source: 'particle.news',
                first_seen_at: new Date().toISOString()
            };

            const added = await addArticle(article);
            if (added) {
                addedCount++;
            }
        }

        return NextResponse.json({ status: 'ok', added: addedCount });
    } catch (error) {
        console.error('Error in /api/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
