
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
        // Sources:
        // Google: General, Tech, Science, AI (search)
        // Reddit: news, tech, science, artificial, chatgpt, ArtificialInteligence
        const [
            xmlResponse,
            googleGen, googleTech, googleScience, googleAI,
            redditNews, redditTech, redditScience, redditArtificial, redditChatGPT, redditAI
        ] = await Promise.allSettled([
            fetch(sitemapUrl, {
                cache: 'no-store',
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)' }
            }).then(async (res) => {
                if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
                return res.text();
            }),
            fetchGoogleNews('GENERAL'),
            fetchGoogleNews('TECHNOLOGY'),
            fetchGoogleNews('SCIENCE'),
            fetchGoogleNews('Artificial Intelligence'),
            fetchRedditRSS('news'),
            fetchRedditRSS('tech'),
            fetchRedditRSS('science'),
            fetchRedditRSS('artificial'),
            fetchRedditRSS('ChatGPT'),
            fetchRedditRSS('ArtificialInteligence')
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

        // Helper to process standard arrays
        const processResult = (result: PromiseSettledResult<Article[]>) => {
            if (result.status === 'fulfilled') {
                allItems = [...allItems, ...result.value];
                return result.value.length;
            }
            return 0;
        };

        const countGGen = processResult(googleGen);
        const countGTech = processResult(googleTech);
        const countGSci = processResult(googleScience);
        const countGAI = processResult(googleAI);

        const countRNews = processResult(redditNews);
        const countRTech = processResult(redditTech);
        const countRSci = processResult(redditScience);
        const countRArt = processResult(redditArtificial);
        const countRGPT = processResult(redditChatGPT);
        const countRAI = processResult(redditAI);


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
                google: countGGen + countGTech + countGSci + countGAI,
                reddit: countRNews + countRTech + countRSci + countRArt + countRGPT + countRAI
            }
        });
    } catch (error) {
        console.error('Error in /api/update:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
