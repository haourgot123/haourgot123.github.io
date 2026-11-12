import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import { navigation } from './src/lib/navigation.ts';

export default defineConfig({
  site: 'https://haourgot123.github.io',
  trailingSlash: 'always',
  integrations: [
    starlight({
      // Đổi tên blog tại đây.
      title: 'haourgot123',
      description: 'Blog của Nguyễn Nguyên Hảo, AI Engineer tại FPT. LLM, AI Agent và AI Infrastructure.',
      defaultLocale: 'root',
      locales: { root: { label: 'Tiếng Việt', lang: 'vi' } },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/haourgot123' },
        { icon: 'rss', label: 'Theo dõi RSS', href: '/blog/rss.xml' },
      ],
      customCss: ['@fontsource-variable/jetbrains-mono', './src/styles/custom.css'],
      expressiveCode: {
        themes: [
          {
            name: 'terminal-cyan',
            type: 'dark',
            colors: { 'editor.background': '#202020', 'editor.foreground': '#d5cec0' },
            tokenColors: [
              { scope: ['keyword', 'storage', 'support.function', 'entity.name.tag'], settings: { foreground: '#f380f5' } },
              { scope: ['string'], settings: { foreground: '#09b5a5' } },
              { scope: ['comment'], settings: { foreground: '#a49c8d', fontStyle: 'italic' } },
              { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#e7bd82' } },
              { scope: ['entity.name.function', 'variable', 'punctuation'], settings: { foreground: '#d5cec0' } },
            ],
          },
          'github-light',
        ],
        styleOverrides: {
          borderRadius: '0',
          borderColor: 'var(--terminal-code-border)',
          codeFontFamily: 'var(--sl-font-mono)',
          codeFontSize: '.875rem',
          codeLineHeight: '1.65',
          codeBackground: 'var(--terminal-code-bg)',
          textMarkers: { markBackground: '#50ffff12', markBorderColor: '#50ffff55' },
          frames: {
            frameBoxShadowCssValue: 'none',
            editorTabBarBackground: 'var(--terminal-code-bg)',
            editorActiveTabBackground: 'var(--terminal-code-bg)',
          },
        },
      },
      disable404Route: true,
      routeMiddleware: './src/route-data.ts',
      components: {
        Header: './src/components/Header.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
        TableOfContents: './src/components/TableOfContents.astro',
        MobileTableOfContents: './src/components/MobileTableOfContents.astro',
        Footer: './src/components/Footer.astro',
      },
      sidebar: navigation.map(({ label, href }) => ({ label, link: href })),
      plugins: [
        starlightBlog({
          title: 'Bài viết',
          navigation: 'none',
          postCount: 6,
          recentPostCount: 8,
          metrics: { readingTime: true },
          authors: {
            haourgot123: {
              name: 'Nguyễn Nguyên Hảo',
              url: 'https://github.com/haourgot123',
            },
          },
        }),
      ],
    }),
  ],
});
