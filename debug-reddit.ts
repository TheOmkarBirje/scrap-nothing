
import { fetchRedditPosts } from './src/lib/reddit';

async function main() {
    console.log('Testing Reddit Fetcher...');

    console.log('Fetching r/news...');
    const news = await fetchRedditPosts('news');
    console.log(`Fetched ${news.length} items from r/news`);
    if (news.length > 0) {
        console.log('Sample item:', JSON.stringify(news[0], null, 2));
    }

    console.log('Fetching r/tech...');
    const tech = await fetchRedditPosts('tech');
    console.log(`Fetched ${tech.length} items from r/tech`);
    if (tech.length > 0) {
        console.log('Sample item:', JSON.stringify(tech[0], null, 2));
    }
}

main();
