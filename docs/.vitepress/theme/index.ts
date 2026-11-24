import DefaultTheme from 'vitepress/theme-without-fonts';
import { h } from 'vue';
import DocKind from './DocKind.vue';
import NextStep from './NextStep.vue';
import './custom.css';

// Every page says what kind of document it is (above the title) and where
// to go to get the software running (below the text).
export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'doc-before': () => h(DocKind), 'doc-after': () => h(NextStep) }),
};
