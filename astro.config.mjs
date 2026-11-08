// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig, fontProviders } from 'astro/config';
import { docsMarkdown } from './src/lib/docs/markdown';

// Unicode ranges of the fontsource "latin" and "latin-ext" subsets (latin-ext covers Slovak letters)
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'.split(
    ',',
  );
const LATIN_EXT =
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'.split(
    ',',
  );

/**
 * Variable font from an installed @fontsource-variable package, latin + latin-ext only
 * @param {string} pkg
 */
function fontsource(pkg) {
  /** @param {string} subset @param {string[]} range */
  const variant = (subset, range) => ({
    src: /** @type {[string]} */ ([`@fontsource-variable/${pkg}/files/${pkg}-${subset}-wght-normal.woff2`]),
    weight: '100 900',
    style: /** @type {const} */ ('normal'),
    unicodeRange: /** @type {[string, ...string[]]} */ (range),
  });
  /** @type {[ReturnType<typeof variant>, ReturnType<typeof variant>]} */
  const variants = [variant('latin', LATIN), variant('latin-ext', LATIN_EXT)];
  return variants;
}

// https://astro.build/config
export default defineConfig({
  site: 'https://candlestack.tech',
  // /docs/ opens the first page of the docs
  redirects: { '/docs': '/docs/agents/' },
  // The docs color their own code and build their pieces from plain Markdown (src/lib/docs/markdown.ts)
  markdown: {
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [docsMarkdown] }),
  },
  build: {
    // CSS is small, inlining it removes the render-blocking request
    inlineStylesheets: 'always',
  },
  // Self-hosted fonts with preload and metric-matched fallbacks, so text does not shift when they load
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-sans',
      fallbacks: ['sans-serif'],
      options: { variants: fontsource('geist') },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      fallbacks: ['monospace'],
      options: { variants: fontsource('geist-mono') },
    },
  ],
});
