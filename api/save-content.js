import { getRepoConfig, readRepoJson, readRepoFile, writeRepoFile } from './_github';
import { requireAdminApiKey } from './_api-auth';

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
    tags: Array.isArray(item.tags)
      ? item.tags.filter(Boolean).map((tag) => String(tag).trim())
      : String(item.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
    createdAt: String(item.createdAt || now),
    updatedAt: String(item.updatedAt || now),
  };
  if (!['article', 'youtube', 'naver'].includes(safe.type)) {
    safe.type = 'article';
  }
  if (!['ai', 'crypto', 'society', 'life'].includes(safe.category)) {
    safe.category = 'ai';
  }

  return safe;
};

const sanitizeItems = (items = []) =>
  items
    .map((item) => normalizeItem(item))
    .filter((item) => item.id && item.sourceUrl);

const sanitizePathSegment = (value, fallback) => {
  const safe = String(value || fallback || 'content')
    .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  return safe || 'content';
};

const buildGitHubPath = (title, sourceUrl) => {
  const prefix = new Date().toISOString().slice(0, 10);
  const host = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/[^\w.-]/g, '-');
    } catch {
      return 'source';
    }
  })();

  return `${prefix}/${host}-${sanitizePathSegment(title, 'content')}-${Date.now()}.md`;
};

const normalizePayload = (body, previousItems = []) => {
  const legacy = body?.item && typeof body.item === 'object';

  if (legacy) {
    const item = normalizeItem(body.item || {});
    const markdown = String(body.markdown || item.summary || '').trim();
    return { item, markdown };
  }

  const markdown = String(
    body?.markdown ||
      body?.content ||
      body?.md ||
      body?.summary ||
      '',
  ).trim();

  const itemId = String(body?.id || body?.item?.id || '').trim() || `admin-${Date.now()}`;
  const existing = previousItems.find((entry) => entry.id === itemId);
  const itemInput = normalizeItem({
    ...body,
    id: itemId,
    summary: markdown || String(body?.summary || ''),
    filePath: existing?.filePath || body?.filePath || '',
    type: body?.type || 'article',
    source: body?.source || '미지정',
    category: body?.category || 'ai',
  });

  return {
    item: {
      ...itemInput,
      filePath:
        existing?.filePath ||
        itemInput.filePath ||
        buildGitHubPath(itemInput.title, itemInput.sourceUrl),
      summary: markdown || itemInput.summary || '',
    },
    markdown,
  };
};

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

  try {
    const indexData = (await readRepoJson({ filePath: 'content/index.json', fallback: { items: [] }, branch: config.branch })) || {
      items: [],
    };
    const originList = Array.isArray(indexData?.items) ? indexData.items : [];
    const prev = sanitizeItems(originList);
    const body = req.body || {};
    const normalized = normalizePayload(body, prev);
    const item = normalized.item;
    const markdown = normalized.markdown;

    if (!item.sourceUrl) {
      return res.status(400).json({ error: 'sourceUrl_required' });
    }
    if (!markdown) {
      return res.status(400).json({ error: 'markdown_required' });
    }
    if (!item.filePath) {
      return res.status(400).json({ error: 'filePath_required' });
    }

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
