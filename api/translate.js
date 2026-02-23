const openaiTranslate = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a careful Korean translator. Translate the provided text to natural Korean with no sentence omissions. Keep meaning, preserve technical terms where useful, and allow smooth localization. Return only translation text, no extra markdown.' ,
        },
        {
          role: 'user',
          content: `Translate this text to Korean in full and return only the translated text.\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`openai translate failed: ${response.status} ${err}`);
  }

  const payload = await response.json();
  const translated = payload?.choices?.[0]?.message?.content;
  if (!translated || typeof translated !== 'string') {
    throw new Error('openai response missing translated text');
  }
  return translated.trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ ok: true, provider: 'openai' });
    }
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  let body = {};
  try {
    body = req.body || {};
  } catch {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const text = String(body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'text_required' });
  }

  try {
    const translatedText =
      (await openaiTranslate(text)) ||
      (() => {
        throw new Error('openai api key not configured');
      })();

    return res.status(200).json({ translatedText });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'translate_failed' });
  }
}
