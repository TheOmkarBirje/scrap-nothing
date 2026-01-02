import { NextResponse } from 'next/server';
import { parseSitemap } from '@/lib/parser';
import { addArticle, Article } from '@/lib/kv';
import { fetchRedditPosts } from '@/lib/reddit';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sitemapUrl = 'https://particle.news/sitemap.xml';
        console.log(`Starting update job...`);

        // Parallel Fetching
        const [xmlResponse, redditNews, redditTech] = await Promise.allSettled([
            fetch(sitemapUrl, {
                cache: 'no-store',
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)' }
            }).then(async (res) => {
                if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
                return res.text();
            }),
            fetchRedditPosts('news'),
            fetchRedditPosts('tech')
        ]);

        let allItems: any[] = []; // Temporary holder before mapping to Article

        // Process Sitemap
        if (xmlResponse.status === 'fulfilled') {
            try {
                const sitemapItems = await parseSitemap(xmlResponse.value);
                const particleArticles = sitemapItems.map(item => ({
                    ...item,
                    source: 'particle.news' as string, // Explicit type assertion if needed
                    first_seen_at: new Date().toISOString()
                }));
                console.log(`Parsed ${particleArticles.length} items from Particle News`);
                allItems = [...allItems, ...particleArticles];
            } catch (e) {
                console.error('Failed to parse sitemap:', e);
            }
        } else {
            console.error('Particle News fetch failed:', xmlResponse.reason);
        }

        // Process Reddit
        if (redditNews.status === 'fulfilled') {
            console.log(`Fetched ${redditNews.value.length} items from r/news`);
            allItems = [...allItems, ...redditNews.value];
        }
        if (redditTech.status === 'fulfilled') {
            console.log(`Fetched ${redditTech.value.length} items from r/tech`);
            allItems = [...allItems, ...redditTech.value];
        }

        console.log(`Total candidates to process: ${allItems.length}`);

        let addedCount = 0;

        // Sort by date (oldest first) so they are pushed to KV list in order (assuming LPUSH)
        // Actually, if we use LPUSH, we want to push Oldest -> Newest so Newest is at Head (index 0).
        // Sorting Ascending by Date.
        allItems.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

        for (const item of allItems) {
            const article: Article = {
                url: item.url,
                title: item.title,
                published_at: item.published_at,
                keywords: item.keywords || [],
                source: item.source || 'unknown',
                first_seen_at: item.first_seen_at || new Date().toISOString()
            };

            const added = await addArticle(article);
            if (added) {
                addedCount++;
            }
        }

        return NextResponse.json({ status: 'ok', added: addedCount, totalProcessed: allItems.length });
    } catch (error) {
        console.error('Error in /api/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


