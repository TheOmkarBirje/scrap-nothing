import { getArticles, Article } from "@/lib/kv";
import RefreshButton from "./components/RefreshButton";
import { formatDistanceToNow } from "date-fns";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let articles: Article[] = [];
  let errorMsg = '';

  try {
    articles = await getArticles(1000);
    articles.sort((a: Article, b: Article) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  } catch (e: any) {
    console.error("Failed to fetch articles:", e);
    errorMsg = e.message || 'Unknown error';
  }

  return (
    <div className="container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Particle News Feed</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Curated stories from around the web.
            </p>
          </div>
          <RefreshButton />
        </div>
      </header>

      <main className="feed">
        {errorMsg && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            color: '#b91c1c',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <strong>Error:</strong> {errorMsg}
            <br />
            <span style={{ fontSize: '0.8rem' }}>Ensure Vercel KV is linked to your project.</span>
          </div>
        )}

        {articles.length === 0 && !errorMsg ? (
          <p style={{ color: 'var(--text-muted)' }}>No articles found. Trigger an update to populate the feed.</p>
        ) : (
          articles.map((article, index) => {
            // Extract domain for HN style display (e.g. "particle.news")
            let domain = article.source || 'particle.news';
            try {
              const urlObj = new URL(article.url);
              domain = urlObj.hostname.replace('www.', '');
            } catch (e) { }

            return (
              <article key={article.url} className="article-card">
                <div className="article-header">
                  <span style={{ color: '#999', fontSize: '0.9rem', minWidth: '24px' }}>{index + 1}.</span>
                  <h2 className="article-title">
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  </h2>
                  <span className="article-domain">({domain})</span>
                </div>

                <div style={{ paddingLeft: '28px' }}>
                  <div className="article-meta">
                    <time dateTime={article.published_at}>
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </time>
                    <span>|</span>
                    <span>{article.source}</span>
                  </div>

                  {article.keywords && article.keywords.length > 0 && (
                    <div className="keywords">
                      {article.keywords.slice(0, 5).map((keyword, idx) => ( // Show max 5 keywords
                        <span key={idx} className="keyword-badge">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
