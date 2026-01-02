
import { parseStringPromise } from 'xml2js';

async function main() {
    const urls = [
        'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', // Top Stories
        'https://news.google.com/rss/topics/CAAqJggBCiJCAQfv4joTCh4IARIdY2JjLmNhL3RlY2hub2xvZ3kvc2NpLXRhY2gQAQ?hl=en-CA&gl=CA&ceid=CA:en' // Tech example (url might differ, using simple search for reliability)
    ];

    // Better Tech URL: https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en

    const techUrl = 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en';

    console.log('Fetching Google News RSS...');

    try {
        const res = await fetch(techUrl);
        const xml = await res.text();
        console.log(`Fetched ${xml.length} bytes`);

        const result = await parseStringPromise(xml);
        const items = result.rss.channel[0].item;

        console.log(`Found ${items.length} items`);
        if (items.length > 0) {
            console.log('First item:', JSON.stringify(items[0], null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}

main();
