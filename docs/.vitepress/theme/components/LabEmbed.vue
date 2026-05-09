<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Query string without a leading `?`, e.g. `clear=1&role=viewer` */
    query?: string;
    /** Iframe height (px) */
    height?: number;
  }>(),
  {
    query: '',
    height: 460,
  }
);

const labOrigin = import.meta.env.VITE_LAB_ORIGIN ?? 'http://localhost:5173';

const iframeSrc = computed(() => {
  const base = labOrigin.replace(/\/$/, '');
  const q = props.query.trim().replace(/^\?+/, '');
  return q ? `${base}/?${q}` : `${base}/`;
});
</script>

<template>
  <div class="lab-embed vp-doc">
    <iframe
      class="lab-embed-frame"
      :src="iframeSrc"
      title="Sugar Lab"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      :style="{ height: `${height}px` }"
    />
  </div>
</template>

<style scoped>
.lab-embed {
  margin: 1rem 0;
}
.lab-embed-frame {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
</style>
