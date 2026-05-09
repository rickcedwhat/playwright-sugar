import DefaultTheme from 'vitepress/theme';
import type { EnhanceAppContext } from 'vitepress';
import LabEmbed from './components/LabEmbed.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('LabEmbed', LabEmbed);
  },
};
