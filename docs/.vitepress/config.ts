import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Playwright Sugar",
  description: "Sweet utilities for Playwright automation",
  base: '/playwright-sugar/',
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Sugar Lab', link: '/guide/sugar-lab' },
      { text: 'API', link: '/api/attempt-action' },
      { text: 'GitHub', link: 'https://github.com/rickcedwhat/playwright-sugar' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Sugar Lab (live)', link: '/guide/sugar-lab' },
        ]
      },
      {
        text: 'Core Helpers',
        items: [
          { text: 'attemptAction', link: '/api/attempt-action' },
          { text: 'Outcomes', link: '/api/outcomes' },
          { text: 'relator', link: '/api/relator' },
          { text: 'verifiedFill', link: '/api/verified-fill' },
          { text: 'clickToOpen', link: '/api/click-to-open' },
          { text: 'findByScrolling', link: '/api/find-by-scrolling' },
        ]
      },
      {
        text: 'Director API',
        items: [
          { text: 'Play', link: '/api/play' },
          { text: 'Playbook', link: '/api/playbook' },
          { text: 'Director', link: '/api/director' },
          { text: 'SyncStrategy', link: '/api/sync-strategy' },
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
