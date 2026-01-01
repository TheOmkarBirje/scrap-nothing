import { kv } from '@vercel/kv';

export interface Article {
  url: string;
  title: string;
  published_at: string;
  keywords: string[];
  source: string;
  first_seen_at: string;
}

const ARTICLES_KEY = 'articles';
const ARTICLE_HASHES_KEY = 'article_hashes';

/**
 * Adds an article to the store if it doesn't already exist.
 * Returns true if added, false if duplicate.
 */
export async function addArticle(article: Article): Promise<boolean> {
  const hash = await generateHash(article.url);

  // Check duplication using a set of hashes
  const exists = await kv.sismember(ARTICLE_HASHES_KEY, hash);
  if (exists) {
    return false;
  }

  // Add to KV
  // We'll store the list of articles as a JSON list for simplicity in retrieving
  // For better scalability, we might want to store individual keys, but for a feed
  // getting a list is easier if we store as a list or a sorted set.
  // Given the requirements, a List (LPUSH) is good for "latest first".

  await kv.lpush(ARTICLES_KEY, article);
  await kv.sadd(ARTICLE_HASHES_KEY, hash);

  return true;
}

/**
 * Retrieves the latest articles.
 */
export async function getArticles(limit: number = 50): Promise<Article[]> {
  const articles = await kv.lrange(ARTICLES_KEY, 0, limit - 1);
  return articles as unknown as Article[];
}

async function generateHash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
