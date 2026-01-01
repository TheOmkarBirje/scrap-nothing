import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const articles = await getArticles();
        // The articles from KV are stored via LPUSH.
        // If we pushed Oldest...Newest, the list is [Newest, ..., Oldest] (Head is Newest).
        // So they should be in correct order (Published Descending) if sitemap was sorted.
        // But to be sure, we can sort them here or assume insertion order is close enough.
        // Requirement: "Sort by published_at descending".

        // Let's sort just in case parsing/KV order was weird or multiple executions interleaved.
        const sorted = articles.sort((a, b) => {
            return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

        return NextResponse.json(sorted);
    } catch (error) {
        console.error('Error in /api/feed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
