// @ts-check
import { defineConfig } from 'astro/config';

// One Day in America — pure static, subdomain root, no adapter.
export default defineConfig({
  site: 'https://oneday.dustincoledata.com',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  // /fray is the URL already shared; the other two grounds are retired.
  redirects: { '/fray': '/', '/daylight': '/', '/ember': '/' },
  build: {
    format: 'directory',
  },
  devToolbar: { enabled: false },
});
