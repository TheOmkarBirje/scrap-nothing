
import { parseSitemap } from './src/lib/parser';

async function main() {
    const sitemapUrl = 'https://particle.news/sitemap.xml';
    console.log(`Fetching ${sitemapUrl}...`);

    try {
        const response = await fetch(sitemapUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch: ${response.status} ${response.statusText}`);
            return;
        }

        const xml = await response.text();
        console.log(`Fetched XML (${xml.length} bytes)`);
        // console.log(xml.substring(0, 500)); // Print start of XML to inspect

        const items = await parseSitemap(xml);
        console.log(`Parsed ${items.length} items`);

        if (items.length > 0) {
            console.log('Sample item:', JSON.stringify(items[0], null, 2));
        } else {
            console.log("No items found. Inspecting XML structure...");
            console.log(xml.substring(0, 2000));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
