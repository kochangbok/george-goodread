import { getRepoConfig, readRepoJson, readRepoFile } from './_github';

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

const normalizeQuery = (value) => String(value || '').trim().toLowerCase();

const toBool = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const parseNumber = (value, fallback, min = 1, max = 100000) => {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
};

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
    const normalized = normalizeItems(rawItems);

    const query = normalizeQuery(req.query?.q);
    const category = normalizeQuery(req.query?.category);
    const type = normalizeQuery(req.query?.type);
    const itemId = String(req.query?.id || '').trim();

    if (itemId) {
      const found = normalized.find((entry) => String(entry.id) === itemId);
      if (!found) {
        return res.status(404).json({ error: 'item_not_found' });
      }

      const includeMarkdown = toBool(req.query?.markdown);
      const content = includeMarkdown
        ? await readRepoFile({
            filePath: `content/${found.filePath}`,
            branch: config.branch,
          }).catch(() => null)
        : null;

      return res.status(200).json({
        item: { ...found },
        markdown: content?.content || '',
        itemCount: 1,
      });
    }

    const filtered = normalized.filter((item) => {
      if (category && item.category !== category) return false;
      if (type && item.type !== type) return false;
      if (!query) return true;
      const hay = `${item.title} ${item.source} ${item.summary} ${(item.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(query);
    });

    const limit = parseNumber(req.query?.limit, 9999, 1, 100000);
    const offset = parseNumber(req.query?.page, 1, 1, 1000) - 1;
    const start = offset * limit;
    const take = filtered.slice(start, start + limit);

    return res.status(200).json({
      items: take,
      total: filtered.length,
      count: take.length,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'load_library_failed' });
  }
}
