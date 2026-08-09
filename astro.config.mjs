// @ts-check
import { defineConfig } from 'astro/config';

// One Day in America — pure static, subdomain root, no adapter.
export default defineConfig({
  site: 'https://oneday.dustincoledata.com',
  base: '/',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: { enabled: false },
});
