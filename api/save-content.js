import { getRepoConfig, readRepoJson, readRepoFile, writeRepoFile } from './_github';

const normalizeItem = (item) => {
  const now = new Date().toISOString();
  const safe = {
    id: String(item.id || `item-${Date.now()}`).trim(),
    title: String(item.title || '').trim() || '제목 없음',
    category: String(item.category || 'ai').trim(),
    type: String(item.type || 'article').trim(),
    source: String(item.source || '').trim() || '미지정',
    sourceUrl: String(item.sourceUrl || '').trim(),
    summary: String(item.summary || '').trim(),
    filePath: String(item.filePath || '').trim(),
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map((tag) => String(tag).trim()) : [],
    createdAt: String(item.createdAt || now),
    updatedAt: String(item.updatedAt || now),
  };

  return safe;
};

const sanitizeItems = (items = []) =>
  items
    .map((item) => normalizeItem(item))
    .filter((item) => item.id && item.sourceUrl);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const config = getRepoConfig();
  if (!config.owner || !config.repoName || !config.token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  const body = req.body || {};
  const item = normalizeItem(body.item || {});
  const markdown = String(body.markdown || '').trim();

  if (!item.sourceUrl) {
    return res.status(400).json({ error: 'sourceUrl_required' });
  }
  if (!markdown) {
    return res.status(400).json({ error: 'markdown_required' });
  }
  if (!item.filePath) {
    return res.status(400).json({ error: 'filePath_required' });
  }

  try {
    const indexData = (await readRepoJson({ filePath: 'content/index.json', fallback: { items: [] }, branch: config.branch })) || {
      items: [],
    };
    const originList = Array.isArray(indexData?.items) ? indexData.items : [];

    const prev = sanitizeItems(originList);
    const withUpdated = sanitizeItems([
      ...prev.filter((entry) => entry.id !== item.id),
      {
        ...item,
        updatedAt: new Date().toISOString(),
      },
    ]).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    const existing = await readRepoFile({ filePath: `content/${item.filePath}`, branch: config.branch }).catch(() => null);
    const contentResult = await writeRepoFile({
      filePath: `content/${item.filePath}`,
      content: markdown,
      message: `save content: ${item.title}`.slice(0, 72),
      branch: config.branch,
      ...(existing?.sha ? { sha: existing.sha } : {}),
    });

    const indexResult = await writeRepoFile({
      filePath: 'content/index.json',
      content: JSON.stringify({ items: withUpdated }, null, 2),
      message: `update index: ${item.id}`.slice(0, 72),
      branch: config.branch,
    });

    return res.status(200).json({
      item: withUpdated.find((entry) => entry.id === item.id),
      markdownPath: contentResult?.content?.path || `content/${item.filePath}`,
      indexPath: indexResult?.content?.path || 'content/index.json',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'save_content_failed' });
  }
}
