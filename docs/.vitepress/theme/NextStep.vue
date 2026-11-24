<script setup lang="ts">
import { useData } from 'vitepress';
const { frontmatter } = useData();
</script>

<template>
  <aside v-if="frontmatter.install" class="next-step" aria-label="Next step">
    <p class="next-step__kicker">Next step</p>
    <p class="next-step__title">
      <a :href="frontmatter.install">{{ frontmatter.installTitle }} →</a>
    </p>
    <p class="next-step__body">Get {{ frontmatter.productName }} running on your own machine.</p>
  </aside>
</template>
