import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Playwright Sugar",
  description: "Sweet utilities for Playwright automation",
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/rickcedwhat/playwright-sugar' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Philosophy', link: '/guide/philosophy' }
        ]
      },
      {
        text: 'Core Helpers',
        items: [
          { text: 'attemptAction', link: '/api/attempt-action' },
          { text: 'relator', link: '/api/relator' },
          { text: 'verifiedFill', link: '/api/verified-fill' },
          { text: 'findByScrolling', link: '/api/find-by-scrolling' },
          { text: 'clickToOpen', link: '/api/click-to-open' }
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
