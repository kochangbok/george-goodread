import crypto from 'node:crypto';
import { getRepoConfig, readRepoJson, readRepoFile, writeRepoFile } from './_github';

const normalizeItemId = (value) => String(value || '').replace(/[^a-zA-Z0-9_.-]/g, '_');
const normalizeInput = (value) => String(value || '').trim();

const normalizeComments = (comments = []) =>
  comments
    .map((entry) => ({
      id: String(entry.id || '').trim(),
      name: normalizeInput(entry.name) || '익명',
      message: normalizeInput(entry.message),
      createdAt: String(entry.createdAt || new Date().toISOString()),
      passwordHash: String(entry.passwordHash || ''),
    }))
    .filter((entry) => entry.message);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const config = getRepoConfig();
  if (!config.owner || !config.repoName || !config.token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  const body = req.body || {};
  const itemId = normalizeItemId(body.itemId);
  const name = normalizeInput(body.name);
  const message = normalizeInput(body.message);
  const password = normalizeInput(body.password);

  if (!itemId) return res.status(400).json({ error: 'itemId_required' });
  if (!name) return res.status(400).json({ error: 'name_required' });
  if (!message) return res.status(400).json({ error: 'message_required' });
  if (!password) return res.status(400).json({ error: 'password_required' });

  try {
    const existing = await readRepoJson({ filePath: `content/comments/${itemId}.json`, fallback: { comments: [] }, branch: config.branch });
    const merged = normalizeComments(Array.isArray(existing?.comments) ? existing.comments : []);
    const now = new Date().toISOString();
    merged.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      message,
      createdAt: now,
      passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
    });

    const existingFile = await readRepoFile({ filePath: `content/comments/${itemId}.json`, branch: config.branch }).catch(() => null);
    const result = await writeRepoFile({
      filePath: `content/comments/${itemId}.json`,
      content: JSON.stringify({ itemId, comments: merged }, null, 2),
      message: `comment: ${itemId}`,
      branch: config.branch,
      ...(existingFile?.sha ? { sha: existingFile.sha } : {}),
    });

    return res.status(200).json({
      comments: normalizeComments(merged),
      itemId,
      path: result?.content?.path || `content/comments/${itemId}.json`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'add_comment_failed' });
  }
}
