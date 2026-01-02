'use client';

import { useState, useMemo } from 'react';
import { Article } from '@/lib/kv'; // We'll need to export Article from a client-safe place or just redefine interface if needed.
import { formatDistanceToNow, differenceInHours, format } from 'date-fns';

// Re-defining interface if import fails depending on build setup, but normally importing from lib/kv is fine if it doesn't use server-only packages.
// lib/kv imports 'server-only' @vercel/kv? No, usually @vercel/kv is fine. 
// But to be safe and avoid "Module not found" for server modules in client:
interface FeedProps {
    articles: Article[];
}

export default function Feed({ articles }: FeedProps) {
    const [showKeywords, setShowKeywords] = useState(true);

    const groupedArticles = useMemo(() => {
        const groups: { [key: string]: Article[] } = {};
        const now = new Date();

        articles.forEach(article => {
            const pubDate = new Date(article.published_at);
            const diffHours = differenceInHours(now, pubDate);

            let groupName = '';
            if (diffHours < 1) {
                groupName = 'Latest';
            } else if (diffHours < 24) {
                groupName = `${diffHours} Hour${diffHours === 1 ? '' : 's'} Ago`;
            } else {
                // Group by Date for older items
                groupName = format(pubDate, 'MMMM d, yyyy');
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(article);
        });

        // Sort groups? Object keys order isn't guaranteed.
        // We want Latest, 1 Hour, 2 Hours ... Older.
        // We can map to an array of { title, articles }

        const orderedGroups: { title: string, items: Article[] }[] = [];

        // Explicitly check logical buckets for sorted order
        if (groups['Latest']) orderedGroups.push({ title: 'Latest', items: groups['Latest'] });

        // Hours 1 to 23
        for (let i = 1; i < 24; i++) {
            const key = `${i} Hour${i === 1 ? '' : 's'} Ago`;
            if (groups[key]) orderedGroups.push({ title: key, items: groups[key] });
        }

        // Dates (we might want to sort these date keys descending if there are many)
        const dateKeys = Object.keys(groups).filter(k => k !== 'Latest' && !k.includes('Hour'));
        // Sort date keys (assuming standard format, need to parse back to compare?)
        // Simpler: just loop through articles again or sort dateKeys.
        // Let's just rely on the fact articles are already sorted by date desc.
        // So we can iterate articles and build groups in order.

        const smartGroups: { title: string, items: Article[] }[] = [];
        let currentTitle = '';
        let currentGroup: Article[] = [];

        articles.forEach(article => {
            const pubDate = new Date(article.published_at);
            const diffHours = differenceInHours(now, pubDate);
            let title = '';
            if (diffHours < 1) title = 'Latest';
            else if (diffHours < 24) title = `${diffHours} Hour${diffHours === 1 ? '' : 's'} Ago`;
            else title = format(pubDate, 'MMMM d, yyyy');

            if (title !== currentTitle) {
                if (currentTitle) {
                    smartGroups.push({ title: currentTitle, items: currentGroup });
                }
                currentTitle = title;
                currentGroup = [article];
            } else {
                currentGroup.push(article);
            }
        });
        if (currentTitle) {
            smartGroups.push({ title: currentTitle, items: currentGroup });
        }

        return smartGroups;
    }, [articles]);

    return (
        <div>
            <div className="controls">
                <button
                    onClick={() => setShowKeywords(!showKeywords)}
                    className="toggle-btn"
                >
                    {showKeywords ? 'Hide Keywords' : 'Show Keywords'}
                </button>
            </div>

            <div className="timeline">
                {groupedArticles.map((group, groupIdx) => (
                    <div key={groupIdx} className="timeline-group">
                        <div className="timeline-marker">
                            <div className="dot"></div>
                            <div className="line"></div>
                        </div>
                        <div className="group-content">
                            <h3 className="group-title">{group.title}</h3>
                            <div className="group-articles">
                                {group.items.map((article) => {
                                    let domain = article.source || '';
                                    try {
                                        const urlObj = new URL(article.url);
                                        domain = urlObj.hostname.replace('www.', '');
                                    } catch (e) { }

                                    return (
                                        <div key={article.url} className="feed-item">
                                            <div className="item-main">
                                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="item-link">
                                                    {article.title}
                                                </a>
                                                <span className="item-meta">
                                                    <span className="domain">{domain}</span>
                                                    <span className="separator">::</span>
                                                    <time>{format(new Date(article.published_at), 'HH:mm')}</time>
                                                </span>
                                            </div>

                                            {showKeywords && article.keywords && article.keywords.length > 0 && (
                                                <div className="item-keywords">
                                                    {article.keywords.slice(0, 5).map((k, i) => (
                                                        <span key={i} className="k-badge">{k}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
