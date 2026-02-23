import { getRepoConfig, readRepoJson, writeRepoFile } from './_github.js';
import { requireAdminApiKey } from './_api-auth.js';

const sanitizeItems = (items = []) =>
  items
    .map((item) => ({
      ...item,
      id: String(item.id || '').trim(),
      title: String(item.title || '').trim(),
      category: String(item.category || 'ai').trim(),
      type: String(item.type || 'article').trim(),
      source: String(item.source || '').trim(),
      sourceUrl: String(item.sourceUrl || '').trim(),
      summary: String(item.summary || ''),
      filePath: String(item.filePath || '').trim(),
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map((tag) => String(tag).trim()) : [],
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
    }))
    .filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!requireAdminApiKey(req, res)) {
    return;
  }

  const config = getRepoConfig();
  if (!config.owner || !config.repoName || !config.token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  const body = req.body || {};
  const targetId = String(body.id || '').trim();
  if (!targetId) {
    return res.status(400).json({ error: 'id_required' });
  }

  try {
    const store = await readRepoJson({ filePath: 'content/index.json', fallback: { items: [] }, branch: config.branch });
    const current = sanitizeItems(Array.isArray(store?.items) ? store.items : []);
    const removed = current.find((entry) => String(entry.id) === targetId);
    if (!removed) {
      return res.status(404).json({ error: 'item_not_found' });
    }

    const next = current.filter((entry) => String(entry.id) !== targetId);
    await writeRepoFile({
      filePath: 'content/index.json',
      content: JSON.stringify({ items: next }, null, 2),
      message: `delete item: ${targetId}`.slice(0, 72),
      branch: config.branch,
    });

    return res.status(200).json({ id: targetId, removed });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'delete_content_failed' });
  }
}
