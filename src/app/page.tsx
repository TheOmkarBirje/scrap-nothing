import { getArticles, Article } from "@/lib/kv";
import RefreshButton from "./components/RefreshButton";
import { formatDistanceToNow } from "date-fns";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let articles: Article[] = [];
  let errorMsg = '';

  try {
    articles = await getArticles(50);
    // Sort again client-side/render-side just to be safe if KV didn't give strict order
    articles.sort((a: Article, b: Article) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  } catch (e: any) {
    console.error("Failed to fetch articles:", e);
    errorMsg = e.message || 'Unknown error';
  }

  return (
    <div className="container">
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Particle News Feed</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Latest stories from around the web
            </p>
          </div>
          <RefreshButton />
        </div>
      </header>

      <main className="feed">
        {errorMsg && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '1rem'
          }}>
            <strong>Error:</strong> {errorMsg}
            <br />
            <small>Ensure Vercel KV is linked to your project in the Vercel Dashboard.</small>
          </div>
        )}

        {articles.length === 0 && !errorMsg ? (
          <p style={{ color: 'var(--text-muted)' }}>No articles found. Check back later or trigger an update.</p>
        ) : (
          articles.map((article) => (
            <article key={article.url} className="article-card">
              <h2 className="article-title">
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h2>

              <div className="article-meta">
                <time dateTime={article.published_at}>
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </time>
                <span>•</span>
                <span>{article.source}</span>
              </div>

              {article.keywords && article.keywords.length > 0 && (
                <div className="keywords">
                  {article.keywords.map((keyword, idx) => (
                    <span key={idx} className="keyword-badge">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </main>
    </div>
  );
}
