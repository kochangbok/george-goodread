import { Buffer } from 'node:buffer';

const createPath = (path) => encodeURIComponent(String(path || '')).replace(/%2F/g, '/');

const getRepoConfig = () => {
  const repo = process.env.GITHUB_REPO || '';
  const [owner, repoName] = repo.split('/');
  return {
    token: process.env.GITHUB_TOKEN || '',
    owner,
    repoName,
    branch: process.env.GITHUB_BRANCH || 'main',
  };
};

const githubHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/vnd.github+json',
});

const getExistingFile = async ({ owner, repoName, filePath, branch, token }) => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/contents/${createPath(filePath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: githubHeaders(token),
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`read file failed: ${response.status} ${text}`);
  }

  return response.json();
};

const putContent = async ({ owner, repoName, filePath, branch, token, payload }) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${createPath(filePath)}`, {
    method: 'PUT',
    headers: githubHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`github put failed: ${response.status} ${text}`);
  }

  return response.json();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { owner, repoName, token, branch } = getRepoConfig();
  if (!owner || !repoName || !token) {
    return res.status(503).json({ error: 'github_not_configured' });
  }

  const body = req.body || {};
  const filePath = String(body.filePath || '').trim();
  const content = String(body.content || '');
  if (!filePath || !content) {
    return res.status(400).json({ error: 'filePath_and_content_required' });
  }

  const safePath = `content/${filePath}`.replace(/\/+/g, '/');

  try {
    const existing = await getExistingFile({
      owner,
      repoName,
      filePath: safePath,
      branch,
      token,
    });

    const payload = {
      message: String(body.commitMessage || `add content: ${filePath}`).slice(0, 72),
      content: Buffer.from(content).toString('base64'),
      branch,
      committer: {
        name: process.env.GITHUB_COMMITTER_NAME || 'George GitHub Bot',
        email: process.env.GITHUB_COMMITTER_EMAIL || 'bot@users.noreply.github.com',
      },
    };

    if (existing?.sha) {
      payload.sha = existing.sha;
    }

    const result = await putContent({
      owner,
      repoName,
      filePath: safePath,
      branch,
      token,
      payload,
    });

    return res.status(200).json({
      commit: result?.commit?.sha || '',
      htmlUrl: result?.content?.html_url || '',
      path: safePath,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'publish_failed' });
  }
}
