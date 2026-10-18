import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://hqd-aggregate-precision.t16754123.chatgpt.site',
  output: 'static',
  trailingSlash: 'always',
});
