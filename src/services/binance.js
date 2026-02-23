const API_BASE = 'https://fapi.binance.com';

async function requestJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`BINANCE_${response.status}: ${body || response.statusText || 'Request failed'}`);
  }
  return response.json();
}

export async function fetchKlines(symbol, { interval = '1d', limit = 120 } = {}) {
  const url = `${API_BASE}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${Math.min(500, Number(limit) || 120)}`;
  const payload = await requestJSON(url);

  if (!Array.isArray(payload)) {
    throw new Error(`BINANCE_${symbol}_KLINES: malformed response`);
  }

  return payload
    .map((row) => ({
      openTime: Number(row[0]),
      close: Number(row[4]),
    }))
    .filter((row) => Number.isFinite(row.openTime) && Number.isFinite(row.close));
}

export async function fetch24hTicker(symbol) {
  const url = `${API_BASE}/fapi/v1/ticker/24hr?symbol=${symbol}`;
  return requestJSON(url);
}
