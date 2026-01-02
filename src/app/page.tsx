import { getArticles, Article } from "@/lib/kv";
import Feed from "./components/Feed";
import RefreshButton from "./components/RefreshButton";

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
        <div>
          <h1>bleeding edge<span style={{ fontSize: '0.6em', verticalAlign: 'super', opacity: 0.5 }}>ai</span></h1>
        </div>
        <RefreshButton />
      </header>

      {errorMsg ? (
        <div style={{ color: 'red', border: '1px solid red', padding: '20px' }}>
          Error: {errorMsg}
        </div>
      ) : (
        <Feed articles={articles} />
      )}
    </div>
  );
}
