import DefaultTheme from 'vitepress/theme';
import type { EnhanceAppContext } from 'vitepress';
import PlayExplorer from './components/PlayExplorer.vue';
import './play-explorer-layout.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('PlayExplorer', PlayExplorer);
  },
};
