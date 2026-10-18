export const RECIPIENT = 'lisa@hqd-spindlemotor.com';
const MAX_BYTES = 32768;
const SUCCESS = 'Your enquiry has been submitted. Thank you — HQD will be in touch.';
const UNAVAILABLE = 'Online delivery is temporarily unavailable. Please try again or email HQD directly.';
const LIMITS = { name: 100, company: 150, email: 150, phone: 50, product: 600, machine: 300, message: 5000, website: 200 };

class FormError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function reply(request, status, code, message) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (status === 405) headers.Allow = 'POST';
  if (status === 429) headers['Retry-After'] = '60';
  if ((request.headers.get('Accept') || '').includes('text/html')) {
    const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const heading = status === 200 ? 'Thank you.' : 'Please try again.';
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading} · HQD</title><style>body{margin:60px auto;padding:24px;max-width:700px;font:20px/1.7 sans-serif;color:#262626}h1,a{color:#004892}</style><h1>${heading}</h1><p>${escape(message)}</p><p><a href="/contact/">Return to the enquiry form</a></p><p><a href="mailto:${RECIPIENT}">${RECIPIENT}</a></p></html>`, { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
  }
  return Response.json({ ok: status === 200, code, message }, { status, headers });
}

async function readForm(request) {
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!['application/json', 'application/x-www-form-urlencoded'].includes(type)) throw new FormError(415, 'INVALID_CONTENT_TYPE', 'Please use the enquiry form to submit your message.');
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw new FormError(413, 'TOO_LARGE', 'Your enquiry is too long. Please shorten it and try again.');
  if (!request.body) throw new FormError(400, 'INVALID_FORM', 'Please complete the required fields.');
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new FormError(413, 'TOO_LARGE', 'Your enquiry is too long. Please shorten it and try again.'); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const text = new TextDecoder().decode(bytes);
  let input;
  try { input = type === 'application/json' ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text)); }
  catch { throw new FormError(400, 'INVALID_FORM', 'Please check the form and try again.'); }
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new FormError(400, 'INVALID_FORM', 'Please check the form and try again.');
  const fields = {};
  for (const [name, max] of Object.entries(LIMITS)) {
    if (input[name] != null && typeof input[name] !== 'string') throw new FormError(400, 'INVALID_FIELD', 'Please check the form fields and try again.');
    fields[name] = (input[name] || '').trim();
    if (fields[name].length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(fields[name]) || (name !== 'message' && /[\r\n]/.test(fields[name]))) throw new FormError(400, 'INVALID_FIELD', 'Please check the form fields and try again.');
  }
  if (!fields.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || fields.message.length < 10) throw new FormError(400, 'INVALID_FIELD', 'Please provide your name, a valid email address and an enquiry of at least 10 characters.');
  return fields;
}

export function createEnquiryHandler({ fetcher = (...args) => globalThis.fetch(...args), cache: configuredCache } = {}) {
  return async ({ request }) => {
    const cache = configuredCache ?? globalThis.caches?.default;
    let rateKey;
    try {
      if (request.method !== 'POST') return reply(request, 405, 'METHOD_NOT_ALLOWED', 'Please submit the enquiry form using POST.');
      const origin = new URL(request.url).origin;
      if (request.headers.get('Origin') !== origin) return reply(request, 403, 'INVALID_ORIGIN', 'Please submit the enquiry from this website.');
      const fields = await readForm(request);
      if (fields.website) return reply(request, 200, 'ACCEPTED', SUCCESS);
      const ip = request.headers.get('CF-Connecting-IP');
      if (cache && ip) {
        try {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${origin}|${ip}`));
          const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
          rateKey = new Request(`${origin}/__enquiry_rate/${hash}`);
          if (await cache.match(rateKey)) return reply(request, 429, 'RATE_LIMITED', 'Please wait one minute before sending another enquiry.');
          await cache.put(rateKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=60' } }));
        } catch { rateKey = undefined; console.warn('[enquiry] rate_limit_unavailable'); }
      }
      const response = await fetcher(`https://formsubmit.co/ajax/${RECIPIENT}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', Referer: `${origin}/contact/`, Origin: origin, 'User-Agent': 'HQD-Website-Enquiry/1.0' },
        body: JSON.stringify({
          name: fields.name, company: fields.company, email: fields.email, phone: fields.phone,
          'Product models': fields.product || 'Please recommend a model', 'Machine / spindle': fields.machine,
          message: fields.message, _replyto: fields.email,
          _subject: `HQD website enquiry — ${fields.product.slice(0, 100) || 'Product selection'}`,
          _template: 'table', _url: `${origin}/contact/`,
        }),
        redirect: 'manual', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.warn(`[enquiry] provider_http_${response.status}`);
        throw new FormError(503, 'DELIVERY_UNAVAILABLE', UNAVAILABLE);
      }
      let delivery;
      try { delivery = await response.json(); } catch {
        console.warn('[enquiry] provider_invalid_json');
        throw new FormError(503, 'DELIVERY_UNAVAILABLE', UNAVAILABLE);
      }
      const providerMessage = typeof delivery?.message === 'string' ? delivery.message : '';
      if (/activat|confirm.{0,25}(?:email|form)|verif.{0,25}(?:email|form)/i.test(providerMessage)) throw new FormError(503, 'ACTIVATION_REQUIRED', UNAVAILABLE);
      if (delivery?.success !== true && delivery?.success !== 'true') {
        console.warn('[enquiry] provider_rejected');
        throw new FormError(503, 'DELIVERY_UNAVAILABLE', UNAVAILABLE);
      }
      return reply(request, 200, 'ACCEPTED', SUCCESS);
    } catch (error) {
      if (rateKey && cache) { try { await cache.delete(rateKey); } catch {} }
      const known = error instanceof FormError;
      if (!known) {
        const detail = /illegal invocation/i.test(error?.message) ? 'invocation' : /redirect/i.test(error?.message) ? 'redirect' : /timeout is not a function/i.test(error?.message) ? 'timeout_api' : /network|connection|fetch failed/i.test(error?.message) ? 'network' : 'unknown';
        console.warn(`[enquiry] transport_${['TypeError', 'TimeoutError', 'AbortError'].includes(error?.name) ? error.name : 'Error'}_${detail}`);
      }
      const status = known ? error.status : 503;
      const code = known ? error.code : 'DELIVERY_UNAVAILABLE';
      if (status >= 500) console.warn(`[enquiry] ${code}`);
      return reply(request, status, code, known ? error.message : UNAVAILABLE);
    }
  };
}
