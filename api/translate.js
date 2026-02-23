export default function handler(req, res) {
  if (req?.method === 'OPTIONS') {
    return res.status(200).json({ ok: true, provider: 'manual-only' });
  }

  return res.status(503).json({
    error: 'OpenAI translation API is disabled. Upload markdown or paste content directly.',
  });
}
