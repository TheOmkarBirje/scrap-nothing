
import { Article } from './kv';

interface RedditPost {
    data: {
        title: string;
        url: string;
        created_utc: number;
        subreddit: string;
        permalink: string;
        link_flair_text?: string;
    };
}

interface RedditResponse {
    data: {
        children: RedditPost[];
    };
}

export async function fetchRedditPosts(subreddit: string): Promise<Article[]> {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;
        console.log(`Fetching Reddit: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SitemapNewsFeed/1.0;)'
            },
            next: { revalidate: 300 } // Cache for 5 mins
        });

        if (!response.ok) {
            console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
            return [];
        }

        const json: RedditResponse = await response.json();

        return json.data.children.map((post) => {
            const { title, url, created_utc, subreddit: sub, permalink, link_flair_text } = post.data;
            const keywords: string[] = [];
            if (link_flair_text) keywords.push(link_flair_text);
            keywords.push(`r/${sub}`);

            return {
                url: url, // Or `https://reddit.com${permalink}` if you prefer the discussion link
                title: title,
                published_at: new Date(created_utc * 1000).toISOString(),
                source: `reddit.com/r/${sub}`,
                keywords: keywords,
                first_seen_at: new Date().toISOString()
            };
        });
    } catch (error) {
        console.error(`Error fetching r/${subreddit}:`, error);
        return [];
    }
}
