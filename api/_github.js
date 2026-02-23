import { Buffer } from 'node:buffer';

const GH_API_BASE = 'https://api.github.com';

export const getRepoConfig = () => {
  const repo = process.env.GITHUB_REPO || '';
  const [owner, repoName] = repo.split('/');

  return {
    token: process.env.GITHUB_TOKEN || '',
    owner,
    repoName,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
};

const createPath = (path) => encodeURIComponent(String(path || '')).replace(/%2F/g, '/');

const githubHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
});

const githubGet = async ({ owner, repoName, filePath, branch, token }) => {
  const response = await fetch(
    `${GH_API_BASE}/repos/${owner}/${repoName}/contents/${createPath(filePath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: githubHeaders(token),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`github read failed: ${response.status} ${text}`);
  }

  return response.json();
};

const githubPut = async ({ owner, repoName, filePath, branch, token, payload }) => {
  const response = await fetch(`${GH_API_BASE}/repos/${owner}/${repoName}/contents/${createPath(filePath)}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`github write failed: ${response.status} ${text}`);
  }

  return response.json();
};

export const readRepoFile = async ({ filePath, branch = 'main' }) => {
  const { owner, repoName, token } = getRepoConfig();
  if (!owner || !repoName || !token) {
    throw new Error('github_not_configured');
  }

  const normalized = String(filePath || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) throw new Error('filePath_required');

  const raw = await githubGet({
    owner,
    repoName,
    branch,
    token,
    filePath: normalized,
  });

  if (!raw) return null;
  const content = typeof raw.content === 'string'
    ? Buffer.from(raw.content.replace(/\s/g, ''), 'base64').toString('utf8')
    : '';

  return {
    content,
    path: raw.path,
    sha: raw.sha,
  };
};

export const readRepoJson = async ({ filePath, fallback = null, branch = 'main' }) => {
  const result = await readRepoFile({ filePath, branch });
  if (!result) return fallback;
  try {
    return JSON.parse(result.content);
  } catch {
    return fallback;
  }
};

export const writeRepoFile = async ({
  filePath,
  content,
  message,
  branch = 'main',
  sha,
}) => {
  const { owner, repoName, token } = getRepoConfig();
  if (!owner || !repoName || !token) {
    throw new Error('github_not_configured');
  }

  const normalized = String(filePath || '').replace(/^\/+|\/+$/g, '');
  if (!normalized) throw new Error('filePath_required');
  const payload = {
    message: String(message || `update: ${normalized}`).slice(0, 72),
    content: Buffer.from(String(content || '')).toString('base64'),
    branch,
    ...(sha ? { sha } : {}),
  };

  return githubPut({
    owner,
    repoName,
    filePath: normalized,
    branch,
    token,
    payload,
  });
};
