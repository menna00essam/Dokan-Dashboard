<script setup>
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'

  const { t, locale } = useI18n() // Assuming you're using vue-i18n for locale
  const { mobile } = useDisplay()

  const props = defineProps({
    page: {
      type: Number,
      default: 1
    },
    itemsPerPage: {
      type: Number,
      default: 10
    },
    totalItems: {
      type: Number,
      default: 0
    },
    pageSizeOptions: {
      type: Array,
      default: () => [5, 10, 20, 50]
    },
    direction: {
      // New prop to control direction
      type: String,
      default: 'ltr',
      validator: (value) => ['ltr', 'rtl'].includes(value)
    }
  })

  const emit = defineEmits(['update:page', 'update:itemsPerPage'])

  // Computed properties
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(props.totalItems / props.itemsPerPage))
  )

  const showingFrom = computed(() => {
    return props.totalItems === 0
      ? 0
      : (props.page - 1) * props.itemsPerPage + 1
  })

  const showingTo = computed(() => {
    return Math.min(props.page * props.itemsPerPage, props.totalItems)
  })

  // Event handlers
  const handlePageChange = (newPage) => {
    if (newPage !== props.page) {
      // Only emit if actually changed
      emit('update:page', newPage)
    }
  }

  const handleItemsPerPageChange = (newSize) => {
    emit('update:itemsPerPage', newSize)
    emit('update:page', 1) // Reset to first page
  }
</script>

<template>
  <div
    :dir="direction"
    class="d-flex flex-wrap align-center justify-space-between mt-4 pa-3 pagination-container"
    :class="{ 'flex-row-reverse': direction === 'rtl' }"
  >
    <div
      class="d-flex align-center mb-2 mb-sm-0"
      :class="{
        'w-100': mobile,
        'w-auto': !mobile,
        'ms-2': direction === 'ltr',
        'me-2': direction === 'rtl'
      }"
    >
      <span
        :class="{ 'me-2': direction === 'ltr', 'ms-2': direction === 'rtl' }"
        class="text-caption"
        >{{ t('itemsPerPage') }}:</span
      >
      <v-select
        :model-value="itemsPerPage"
        :items="pageSizeOptions"
        density="compact"
        variant="outlined"
        hide-details
        :style="{ 'max-width': mobile ? '100%' : '100px' }"
        @update:model-value="handleItemsPerPageChange"
      ></v-select>
    </div>

    <v-pagination
      :model-value="page"
      :length="totalPages"
      :total-visible="mobile ? 5 : 7"
      :density="mobile ? 'comfortable' : 'default'"
      class="my-2 my-sm-0"
      :class="{ 'mx-sm-2': !mobile }"
      @update:model-value="handlePageChange"
      active-color="secondary"
    ></v-pagination>

    <div
      class="text-caption text-center"
      :class="{
        'w-100': mobile,
        'w-auto': !mobile,
        'text-sm-end': direction === 'ltr',
        'text-sm-start': direction === 'rtl'
      }"
    >
      {{ showingFrom }}-{{ showingTo }} {{ t('of') }} {{ totalItems }}
    </div>
  </div>
</template>

<style scoped>
  .pagination-container {
    gap: 12px;
  }

  /* Mobile-specific styles */
  @media (max-width: 600px) {
    .pagination-container {
      flex-direction: column;
      align-items: stretch;
    }

    .v-pagination {
      order: -1; /* Move pagination to top on mobile */
      margin-bottom: 16px;
    }

    .v-pagination :deep(.v-pagination__list) {
      justify-content: center; /* Keep buttons centered on mobile */
      direction: ltr; /* Ensure button numbers are LTR */
    }
  }

  /* Common spacing */
  .ms-2 {
    margin-left: 0.5rem !important;
  }

  .me-2 {
    margin-right: 0.5rem !important;
  }

  .mx-sm-2 {
    margin-left: 0.5rem !important;
    margin-right: 0.5rem !important;
  }

  /* RTL specific adjustments - can be done with conditional classes */
  .flex-row-reverse {
    flex-direction: row-reverse;
  }
</style>
