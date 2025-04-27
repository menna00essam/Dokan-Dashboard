<script setup>
  import { defineProps } from 'vue'

  const props = defineProps({
    columns: {
      type: Array,
      required: true
    },
    rows: {
      type: Number,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  })
</script>

<template>
  <template v-if="loading">
    <v-table class="elevation-1">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column" class="text-left text-h6">
            {{ column }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in rows" :key="i">
          <td v-for="column in columns" :key="column">
            <v-skeleton-loader type="text" width="150"></v-skeleton-loader>
          </td>
        </tr>
      </tbody>
    </v-table>
  </template>
</template>
<style scoped>
  /* Skeleton animation */
  .v-skeleton-loader {
    opacity: 0.7;
  }

  .v-skeleton-loader::after {
    animation: shimmer 3s infinite linear;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  /* Apply only when dir="rtl" */
  [dir='rtl'] tr th {
    text-align: right !important;
  }

  /* Optional: Add other RTL-specific table styles */
  [dir='rtl'] .v-table td {
    text-align: right !important;
  }

  [dir='rtl'] .v-data-table-header__content {
    justify-content: flex-end !important;
  }
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
</style>
