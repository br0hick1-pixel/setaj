export const config = { runtime: 'edge' };

// هر نسخه (version) از سرا، مدل و استخر کلید خودش رو داره.
// کلیدها از Environment Variables خونده می‌شن، نه از کد — پس تو کد عمومی دیده نمی‌شن.
const TIERS = {
  '1.0': { model: 'gpt-4o-mini', keys: ['OPENAI_KEY_1', 'OPENAI_KEY_2', 'OPENAI_KEY_3'] },
  '1.1': { model: 'gpt-4o-mini', keys: ['OPENAI_KEY_1', 'OPENAI_KEY_2', 'OPENAI_KEY_3'] },
  '1.2': { model: 'gpt-4o',      keys: ['OPENAI_KEY_1', 'OPENAI_KEY_2', 'OPENAI_KEY_3'] },
};
const ALLOWED_ORIGINS = [
  // آدرس سایتت رو اینجا اضافه کن، مثلا:
  // 'https://username.github.io',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req) {
  const origin = req.headers.get('origin') || '';
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const { version, messages } = body || {};
  const tier = TIERS[version] || TIERS['1.0'];
  if (!Array.isArray(messages) || !messages.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const payload = JSON.stringify({
    model: tier.model,
    messages,
    stream: true,
    temperature: 0.6,
    max_tokens: 8000,
  });

  let lastErr = null;
  for (const envName of tier.keys) {
    const key = process.env[envName];
    if (!key) continue; // این کلید ست نشده، برو سراغ بعدی

    let res;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
        },
        body: payload,
      });
    } catch (e) {
      lastErr = e;
      continue;
    }

    if (res.ok) {
      // همون استریم OpenAI رو بدون دست‌کاری پاس می‌دیم به فرانت (فرمتش رو فرانت از قبل بلده بخونه)
      return new Response(res.body, {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const status = res.status;
    const retry = [401, 402, 403, 429].includes(status) || status >= 500;
    const text = await res.text().catch(() => '');
    lastErr = new Error(status + ' ' + text.slice(0, 200));
    if (!retry) break; // خطای غیرقابل تلاش‌مجدد (مثلا 400)، دیگه کلید بعدی رو امتحان نکن
  }

  return new Response(JSON.stringify({ error: (lastErr && lastErr.message) || 'no provider available' }), {
    status: 502,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
