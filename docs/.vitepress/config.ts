import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Playwright Sugar",
  description: "Small Playwright helpers for QA — lite snippets and robust package exports",
  /** Keep `lab` script `build:embed` `--base` equal to this value plus `lab/`. */
  base: '/playwright-sugar/',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Sugar Lab', link: '/guide/sugar-lab' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/rickcedwhat/playwright-sugar' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Lite vs robust', link: '/guide/helper-forms' },
          { text: 'Sugar Lab (live)', link: '/guide/sugar-lab' },
        ]
      },
      {
        text: 'API',
        items: [
          { text: 'Helpers overview', link: '/api/' },
          { text: 'attemptAction / detectState', link: '/api/attempt-action' },
          { text: 'Outcomes', link: '/api/outcomes' },
          { text: 'relator', link: '/api/relator' },
          { text: 'verifiedFill', link: '/api/verified-fill' },
          { text: 'clickToOpen', link: '/api/click-to-open' },
          { text: 'clickToURL', link: '/api/click-to-url' },
          { text: 'findByScrolling', link: '/api/find-by-scrolling' },
          { text: 'strategies', link: '/api/strategies' },
          { text: 'hoverMenu', link: '/api/hover-menu' },
          { text: 'watchFor', link: '/api/watch-for' },
          { text: 'pageTag', link: '/api/page-tag' },
          { text: 'wait', link: '/api/wait' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rickcedwhat/playwright-sugar' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Cedrick Catalan'
    }
  }
})
