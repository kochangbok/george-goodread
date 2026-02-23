import { getRepoConfig, readRepoJson } from './_github.js';

const normalizeComments = (comments = []) =>
  comments
    .map((entry) => ({
      id: String(entry.id || '').trim() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(entry.name || '').trim() || '익명',
      message: String(entry.message || '').trim(),
      createdAt: String(entry.createdAt || new Date().toISOString()),
    }))
    .filter((comment) => comment.message)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const config = getRepoConfig();
  if (!config.owner || !config.repoName || !config.token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  const itemId = String(req.query?.itemId || '').trim();
  if (!itemId) {
    return res.status(400).json({ error: 'itemId_required' });
  }

  try {
    const store = await readRepoJson({ filePath: `content/comments/${itemId}.json`, fallback: { comments: [] }, branch: config.branch });
    const raw = Array.isArray(store?.comments) ? store.comments : [];
    return res.status(200).json({ comments: normalizeComments(raw), count: raw.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'load_comments_failed' });
  }
}
