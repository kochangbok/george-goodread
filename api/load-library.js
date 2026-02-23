import { getRepoConfig, readRepoJson } from './_github';

const normalizeItems = (items = []) =>
  items
    .map((item) => ({
      id: String(item.id || '').trim() || `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: String(item.title || '').trim() || '제목 없음',
      category: String(item.category || 'ai').trim(),
      type: String(item.type || 'article').trim(),
      source: String(item.source || '').trim() || '미지정',
      sourceUrl: String(item.sourceUrl || '').trim(),
      summary: String(item.summary || '').trim(),
      filePath: String(item.filePath || '').trim(),
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map((tag) => String(tag).trim()) : [],
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
    }))
    .filter((item) => item.id && item.sourceUrl)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const config = getRepoConfig();
  if (!config.owner || !config.repoName || !config.token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  try {
    const store = await readRepoJson({ filePath: 'content/index.json', fallback: { items: [] }, branch: config.branch });
    const rawItems = Array.isArray(store?.items) ? store.items : [];
    return res.status(200).json({ items: normalizeItems(rawItems), count: rawItems.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'load_library_failed' });
  }
}
