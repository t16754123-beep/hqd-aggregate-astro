import test from 'node:test';
import assert from 'node:assert/strict';
import { enquiryPayload, submitEnquiry, ENDPOINT } from '../src/lib/enquiry.mjs';
const siteUrl = 'https://hqd-spindlemotor.pages.dev';
const valid = { name: 'Example customer', email: 'customer@example.com', message: 'Please recommend a suitable angle head.', product: 'ISO30-ER25' };

test('only approved enquiry fields reach the fixed provider endpoint', async () => {
  let call;
  await submitEnquiry({ ...valid, _cc: 'other@example.com', _webhook: 'https://other.example', recipient: 'other@example.com' }, {
    siteUrl, fetcher: async (...args) => { call = args; return Response.json({ success: 'true' }); },
  });
  assert.equal(call[0], ENDPOINT);
  assert.equal(ENDPOINT, 'https://formsubmit.co/ajax/lisa@hqd-spindlemotor.com');
  assert.equal(call[1].credentials, 'omit');
  const body = JSON.parse(call[1].body);
  assert.equal(body._replyto, valid.email);
  assert.equal(body._url, `${siteUrl}/contact/`);
  for (const key of ['_cc', '_webhook', '_autoresponse', 'recipient', '_captcha']) assert.equal(body[key], undefined);
});

test('invalid email, header injection, malformed fields and long content are rejected', () => {
  for (const change of [{ email: 'invalid' }, { name: 'Name\r\nBcc: other@example.com' }, { message: 'short' }, { product: 'x'.repeat(601) }, { name: {} }]) {
    assert.throws(() => enquiryPayload({ ...valid, ...change }, siteUrl));
  }
});

test('the honeypot prevents provider calls', async () => {
  await submitEnquiry({ ...valid, website: 'spam.example' }, { siteUrl, fetcher: () => assert.fail('No request expected') });
});

test('activation is never presented as a successful enquiry', async () => {
  for (const success of [true, 'true', false, 'false']) {
    await assert.rejects(submitEnquiry(valid, { siteUrl, fetcher: async () => Response.json({ success, message: 'This form needs Activation. We sent an activation email.' }) }), /awaiting mailbox activation/);
  }
});

test('provider rejection, HTML error pages, redirects and rate limits are honest failures', async () => {
  for (const response of [new Response('', { status: 503 }), new Response('', { status: 302 }), new Response('<html>error</html>'), Response.json({ success: false }), Response.json({ message: 'Thanks' })]) {
    await assert.rejects(submitEnquiry(valid, { siteUrl, fetcher: async () => response }), /temporarily unavailable/);
  }
  await assert.rejects(submitEnquiry(valid, { siteUrl, fetcher: async () => new Response('', { status: 429 }) }), /wait a few minutes/);
});

test('network and timeout failures provide useful messages without exposing raw exceptions', async () => {
  await assert.rejects(submitEnquiry(valid, { siteUrl, fetcher: async () => { throw new TypeError('Internal details'); } }), /temporarily unavailable/);
  await assert.rejects(submitEnquiry(valid, { siteUrl, fetcher: async () => { throw new DOMException('Timeout', 'TimeoutError'); } }), /timed out/);
});
