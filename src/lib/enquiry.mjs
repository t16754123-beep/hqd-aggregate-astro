export const RECIPIENT = 'lisa@hqd-spindlemotor.com';
export const ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT}`;
const UNAVAILABLE = 'Online delivery is temporarily unavailable. Your details are still in the form. Please try again or email HQD directly.';
const limits = { name: 100, company: 150, email: 150, phone: 50, product: 600, machine: 300, message: 5000, website: 200 };

export function enquiryPayload(input, siteUrl) {
  const fields = {};
  for (const [name, max] of Object.entries(limits)) {
    if (input[name] != null && typeof input[name] !== 'string') throw new Error('Please check the form fields.');
    fields[name] = (input[name] || '').trim();
    if (fields[name].length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(fields[name]) || (name !== 'message' && /[\r\n]/.test(fields[name]))) throw new Error('Please check the form fields.');
  }
  if (!fields.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || fields.message.length < 10) throw new Error('Please provide your name, a valid email address and an enquiry of at least 10 characters.');
  return {
    name: fields.name, company: fields.company, email: fields.email, phone: fields.phone,
    'Product models': fields.product || 'Please recommend a model', 'Machine / spindle': fields.machine,
    message: fields.message, _replyto: fields.email,
    _subject: `HQD website enquiry — ${fields.product.slice(0, 100) || 'Product selection'}`,
    _template: 'table', _url: `${new URL(siteUrl).origin}/contact/`, _honey: fields.website,
  };
}

export async function submitEnquiry(input, { siteUrl, fetcher = (...args) => globalThis.fetch(...args), endpoint = ENDPOINT } = {}) {
  const payload = enquiryPayload(input, siteUrl);
  // Provider honeypots silently ignore populated traps; avoid a network request as well.
  if (payload._honey) return;
  let response;
  try {
    response = await fetcher(endpoint, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      credentials: 'omit', redirect: 'error', body: JSON.stringify(payload), signal: AbortSignal.timeout(22000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new Error('The request timed out. Your details are still in the form. Please email HQD directly if you are unsure whether it was sent.');
    throw new Error(UNAVAILABLE);
  }
  if (response.status === 429) throw new Error('The email service is busy. Please wait a few minutes before trying again, or email HQD directly.');
  if (!response.ok) throw new Error(UNAVAILABLE);
  let delivery;
  try { delivery = await response.json(); } catch { throw new Error(UNAVAILABLE); }
  if (/activat|confirm.{0,25}(?:email|form)|verif.{0,25}(?:email|form)/i.test(delivery?.message || '')) throw new Error('Online enquiries are awaiting mailbox activation. Please email HQD directly for now.');
  if (delivery?.success !== true && delivery?.success !== 'true') throw new Error(UNAVAILABLE);
}
