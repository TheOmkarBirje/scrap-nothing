import { parseStringPromise } from 'xml2js';

interface SitemapUrl {
    loc: string[];
    'news:news'?: {
        'news:publication_date': string[];
        'news:title': string[];
        'news:keywords'?: string[];
    }[];
    'n:news'?: {
        'n:publication_date': string[];
        'n:title': string[];
        'n:keywords'?: string[];
    }[];
}

interface SitemapItems {
    urlset: {
        url: SitemapUrl[];
    };
}

export interface ParsedNewsItem {
    url: string;
    title: string;
    published_at: string;
    keywords: string[];
}

export async function parseSitemap(xml: string): Promise<ParsedNewsItem[]> {
    // Simple check to remove namespace prefixes if they cause issues, 
    // but xml2js handles them well usually. We just need to access the property with the prefix.
    // Sometimes namespaces might be 'news' or 'n' or others. 
    // The user prompt specifies 'news:news'.

    const result = (await parseStringPromise(xml)) as SitemapItems;

    if (!result.urlset || !result.urlset.url) {
        return [];
    }

    const urls = result.urlset.url || [];

    return urls
        .map((entry) => {
            // Support for standard google news sitemap namespace 'news' or 'n'
            const news = (entry['news:news']?.[0] || entry['n:news']?.[0]) as any;
            if (!news) return null;

            const keywordsStr = (news['news:keywords']?.[0] || news['n:keywords']?.[0] || '');
            const keywords = keywordsStr
                ? (keywordsStr as string).split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
                : [];

            return {
                url: entry.loc[0],
                title: (news['news:title']?.[0] || news['n:title']?.[0]),
                published_at: (news['news:publication_date']?.[0] || news['n:publication_date']?.[0]),
                keywords,
            };
        })
        .filter((item): item is ParsedNewsItem => {
            return item !== null && !!item.url && !!item.title && !!item.published_at;
        });
}
