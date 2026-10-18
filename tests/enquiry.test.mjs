import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnquiryHandler, RECIPIENT } from '../server/enquiry.mjs';

const origin = 'https://hqd-spindlemotor.pages.dev';
const valid = { name: 'Test customer', email: 'customer@example.com', company: 'Example', product: 'ISO30-ER25', message: 'Please help us select an angle head.' };
function request(data = valid, headers = {}, method = 'POST') {
  return new Request(`${origin}/api/enquiry`, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, ...(method === 'POST' ? { body: typeof data === 'string' ? data : JSON.stringify(data) } : {}) });
}
function setup(response = () => Response.json({ success: 'true', message: 'Thanks! The form was submitted successfully.' }), options = {}) {
  const calls = [];
  const handler = createEnquiryHandler({ fetcher: async (...args) => { calls.push(args); return response(); }, ...options });
  return { calls, send: req => handler({ request: req }) };
}

test('valid enquiries go only to the configured recipient, with a safe Reply-To', async () => {
  const { send, calls } = setup();
  const response = await send(request({ ...valid, recipient: 'other@example.com', _cc: 'other@example.com', _webhook: 'https://evil.example', _autoresponse: 'spam' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(calls[0][0], `https://formsubmit.co/ajax/${RECIPIENT}`);
  const sent = JSON.parse(calls[0][1].body);
  assert.equal(sent._replyto, valid.email);
  assert.equal(sent.message, valid.message);
  assert.equal(sent._cc, undefined);
  assert.equal(sent._webhook, undefined);
  assert.equal(sent.recipient, undefined);
  assert.equal(sent._autoresponse, undefined);
});

test('invalid email, multiline headers, oversized fields and malformed JSON never reach delivery', async () => {
  for (const data of [{ ...valid, email: 'not-an-email' }, { ...valid, name: 'Name\r\nBcc: other@example.com' }, { ...valid, message: 'short' }, { ...valid, product: 'x'.repeat(601) }, { ...valid, name: {} }, 'invalid-json', '[]']) {
    const { send, calls } = setup();
    assert.equal((await send(request(data))).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('cross-origin, unsupported methods and body formats are rejected before delivery', async () => {
  const { send, calls } = setup();
  assert.equal((await send(request(valid, { Origin: 'https://other.example' }))).status, 403);
  assert.equal((await send(request(valid, {}, 'GET'))).status, 405);
  assert.equal((await send(request(valid, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal(calls.length, 0);
});

test('the streaming body limit works even without a Content-Length header', async () => {
  const { send, calls } = setup();
  assert.equal((await send(request('x'.repeat(32769)))).status, 413);
  assert.equal(calls.length, 0);
});

test('honeypot submissions do not send mail', async () => {
  const { send, calls } = setup();
  assert.equal((await send(request({ ...valid, website: 'spam.example' }))).status, 200);
  assert.equal(calls.length, 0);
});

test('activation responses are never reported as a sent enquiry', async () => {
  const { send } = setup(() => Response.json({ success: 'true', message: 'Please check your email to activate this form.' }));
  const response = await send(request());
  assert.equal(response.status, 503);
  const result = await response.json();
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ACTIVATION_REQUIRED');
});

test('provider rejection, invalid output and transport failures never produce false success', async () => {
  for (const provider of [() => new Response('Unavailable', { status: 503 }), () => new Response('<html>error</html>'), () => Response.json({ success: false }), () => { throw new DOMException('Timed out', 'TimeoutError'); }]) {
    const { send } = setup(provider);
    const response = await send(request());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  }
});

test('repeated submissions from an IP are throttled and cache keys do not expose the IP', async () => {
  const values = new Map();
  const cache = { match: async key => values.get(key.url), put: async (key, response) => values.set(key.url, response), delete: async key => values.delete(key.url) };
  const { send, calls } = setup(undefined, { cache });
  const headers = { 'CF-Connecting-IP': '192.0.2.10' };
  assert.equal((await send(request(valid, headers))).status, 200);
  assert.equal((await send(request(valid, headers))).status, 429);
  assert.equal(calls.length, 1);
  assert.ok(![...values.keys()][0].includes('192.0.2.10'));
});

test('a failed delivery releases the throttle so the customer can retry', async () => {
  const values = new Map();
  const cache = { match: async key => values.get(key.url), put: async (key, response) => values.set(key.url, response), delete: async key => values.delete(key.url) };
  const { send, calls } = setup(() => new Response('', { status: 503 }), { cache });
  const headers = { 'CF-Connecting-IP': '192.0.2.11' };
  assert.equal((await send(request(valid, headers))).status, 503);
  assert.equal((await send(request(valid, headers))).status, 503);
  assert.equal(calls.length, 2);
});

test('native URL-encoded forms receive an HTML confirmation without requiring JavaScript', async () => {
  const { send, calls } = setup();
  const response = await send(request(new URLSearchParams(valid).toString(), { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /text\/html/);
  assert.match(await response.text(), /Thank you/);
  assert.equal(calls.length, 1);
});
