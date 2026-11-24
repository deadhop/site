<script setup lang="ts">
import { useData } from 'vitepress';
const { frontmatter } = useData();
</script>

<template>
  <p v-if="frontmatter.kind" class="doc-kind">
    <a :href="frontmatter.productPage">{{ frontmatter.product }}</a>
    <span :class="['doc-kind__tag', `doc-kind__tag--${frontmatter.kind}`]">{{ frontmatter.kindLabel }}</span>
  </p>
</template>
