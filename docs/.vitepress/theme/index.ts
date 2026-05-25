import DefaultTheme from 'vitepress/theme';
import type { EnhanceAppContext } from 'vitepress';
import PlayExplorer from './components/PlayExplorer.vue';
import RunTestSandbox from './components/RunTestSandbox.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('PlayExplorer', PlayExplorer);
    app.component('RunTestSandbox', RunTestSandbox);
  },
};
