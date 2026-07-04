import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://towardtype1.github.io',
  markdown: {
    shikiConfig: {
      theme: 'vitesse-dark',
    },
  },
});
