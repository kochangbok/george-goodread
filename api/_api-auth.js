const normalizeApiKeys = () => {
  const raw = process.env.ADMIN_API_KEYS || process.env.ADMIN_API_KEY || '';
  if (!raw) return [];

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const extractTokenFromRequest = (req) => {
  const fromHeaderAuth = (() => {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (!authHeader || typeof authHeader !== 'string') return '';
    const trimmed = authHeader.trim();
    if (/^bearer\s+/i.test(trimmed)) {
      return trimmed.replace(/^bearer\s+/i, '').trim();
    }
    return trimmed;
  })();
  if (fromHeaderAuth) return fromHeaderAuth;

  return String(
    req.headers?.['x-api-key'] ||
      req.headers?.['x-admin-key'] ||
      req.headers?.['X-Api-Key'] ||
      req.headers?.['X-Admin-Key'] ||
      req.body?.apiKey ||
      req.query?.apiKey ||
      '',
  ).trim();
};

export const requireAdminApiKey = (req, res) => {
  const keys = normalizeApiKeys();

  // If no key is configured, keep backward-compatible behavior
  if (!keys.length) return true;

  const token = extractTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: 'api_key_required' });
    return false;
  }

  if (!keys.includes(token)) {
    res.status(403).json({ error: 'api_key_forbidden' });
    return false;
  }

  return true;
};
