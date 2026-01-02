
import { NextResponse } from 'next/server';
import { parseSitemap } from '@/lib/parser';
import { addArticle, Article } from '@/lib/kv';
import { fetchGoogleNews } from '@/lib/google-news';
import { fetchRedditRSS } from '@/lib/reddit-rss';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sitemapUrl = 'https://particle.news/sitemap.xml';
        console.log(`Starting update job...`);

        // Parallel Fetching: Particle + Google News + Reddit RSS
        const [xmlResponse, googleGen, googleTech, redditNews, redditTech] = await Promise.allSettled([
            fetch(sitemapUrl, {
                cache: 'no-store',
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)' }
            }).then(async (res) => {
                if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
                return res.text();
            }),
            fetchGoogleNews('GENERAL'),
            fetchGoogleNews('TECHNOLOGY'),
            fetchRedditRSS('news'),
            fetchRedditRSS('tech')
        ]);

        let allItems: any[] = [];
        let particleCount = 0;

        // Process Sitemap
        if (xmlResponse.status === 'fulfilled') {
            try {
                const sitemapItems = await parseSitemap(xmlResponse.value);
                const particleArticles = sitemapItems.map(item => ({
                    ...item,
                    source: 'particle.news' as string,
                    first_seen_at: new Date().toISOString()
                }));
                particleCount = particleArticles.length;
                console.log(`Parsed ${particleArticles.length} items from Particle News`);
                allItems = [...allItems, ...particleArticles];
            } catch (e) {
                console.error('Failed to parse sitemap:', e);
            }
        } else {
            console.error('Particle News fetch failed:', xmlResponse.reason);
        }

        // Process Google News
        if (googleGen.status === 'fulfilled') {
            console.log(`Fetched ${googleGen.value.length} items from Google General`);
            allItems = [...allItems, ...googleGen.value];
        }
        if (googleTech.status === 'fulfilled') {
            console.log(`Fetched ${googleTech.value.length} items from Google Tech`);
            allItems = [...allItems, ...googleTech.value];
        }

        // Process Reddit RSS
        if (redditNews.status === 'fulfilled') {
            console.log(`Fetched ${redditNews.value.length} items from r/news RSS`);
            allItems = [...allItems, ...redditNews.value];
        }
        if (redditTech.status === 'fulfilled') {
            console.log(`Fetched ${redditTech.value.length} items from r/tech RSS`);
            allItems = [...allItems, ...redditTech.value];
        }

        console.log(`Total candidates to process: ${allItems.length}`);

        let addedCount = 0;

        // Sort by date (ascending) so they are pushed to KV list in order (Oldest -> Newest)
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

        return NextResponse.json({
            status: 'ok',
            added: addedCount,
            totalProcessed: allItems.length,
            breakdown: {
                particle: particleCount,
                google_general: googleGen.status === 'fulfilled' ? googleGen.value.length : 0,
                google_tech: googleTech.status === 'fulfilled' ? googleTech.value.length : 0,
                reddit_news: redditNews.status === 'fulfilled' ? redditNews.value.length : 0,
                reddit_tech: redditTech.status === 'fulfilled' ? redditTech.value.length : 0
            }
        });
    } catch (error) {
        console.error('Error in /api/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
