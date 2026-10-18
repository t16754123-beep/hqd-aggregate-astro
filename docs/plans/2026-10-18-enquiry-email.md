# HQD enquiry email implementation

Goal: deliver enquiries to lisa@hqd-spindlemotor.com from the contact form without opening an email app.

## Final design

Use FormSubmit's documented browser AJAX endpoint, fixed recipient, Reply-To, allowlisted form fields, field limits, honeypot, accessible pending/success/error states, and retained inputs on failure. Keep native FormSubmit POST for browsers without JavaScript. Do not disable provider CAPTCHA controls. Explain third-party processing in the privacy page.

The initially implemented Pages Function relay returned HTTP 429 from the provider in production. It was removed in favour of the official browser integration. Do not reintroduce automatic retries or a second sending path after an uncertain response, as either could duplicate enquiries.

## Verification and release

- Mock all provider calls in automated tests, including success, activation, rate limits, invalid responses, network errors, timeout and honeypot.
- Build with the production site URL and check generated links/assets.
- Verify form success and failure in the browser with a local mock provider, then deploy GitHub main to Cloudflare Pages (npm run build / dist).
- A real test email requires explicit authorization. User authorized a clearly labelled HQD website activation test on 2026-10-18. FormSubmit confirmed an activation email was sent, and the user confirmed clicking Activate Form.
- Verify a submission from the deployed page. Provider acceptance and confirmed inbox receipt are separate facts; only the mailbox owner can confirm inbox receipt.
