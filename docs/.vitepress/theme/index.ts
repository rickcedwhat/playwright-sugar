import DefaultTheme from 'vitepress/theme';
import type { EnhanceAppContext } from 'vitepress';
import LabEmbed from './components/LabEmbed.vue';
import RunTestSandbox from './components/RunTestSandbox.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    app.component('LabEmbed', LabEmbed);
    app.component('RunTestSandbox', RunTestSandbox);
  },
};
