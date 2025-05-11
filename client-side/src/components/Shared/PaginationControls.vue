<script setup>
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'

  const { t, locale } = useI18n()
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
      emit('update:page', newPage)
    }
  }

  const handleItemsPerPageChange = (newSize) => {
    emit('update:itemsPerPage', newSize)
    emit('update:page', 1)
  }
</script>

<template>
  <div
    :dir="direction"
    class="d-flex flex-wrap align-center justify-space-between mt-4 pa-3 pagination-container"
    :class="{ 'flex-row-reverse': direction === 'rtl' }"
  >
    <!-- Items per page selector -->
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

    <!-- Pagination controls -->
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

    <!-- Items count display -->
    <div
      class="text-caption text-center"
      :class="{
        'w-100': mobile,
        'w-auto': !mobile,
        'text-sm-end': direction === 'ltr',
        'text-sm-start': direction === 'rtl'
      }"
    >
      <span class="numbers-display" :dir="direction">
        {{ showingFrom }}-{{ showingTo }}
        <span class="of-word">{{ t('of') }}</span>
        {{ totalItems }}
      </span>
    </div>
  </div>
</template>

<style scoped>
  .pagination-container {
    gap: 12px;
  }

  /* Ensure pagination numbers remain LTR even in RTL mode */
  .v-pagination :deep(.v-pagination__item) {
    direction: ltr;
    display: inline-flex;
  }

  /* Mobile-specific styles */
  @media (max-width: 600px) {
    .pagination-container {
      flex-direction: column;
      align-items: center;
    }

    .v-pagination {
      order: -1;
      margin-bottom: 16px;
      width: 100%;
    }

    .v-pagination :deep(.v-pagination__list) {
      justify-content: center;
    }
  }

  /* RTL specific adjustments */
  [dir='rtl'] .v-pagination :deep(.v-pagination__prev .v-btn__content),
  [dir='rtl'] .v-pagination :deep(.v-pagination__next .v-btn__content) {
    transform: rotate(180deg);
  }

  /* Spacing utilities */
  .ms-2 {
    margin-inline-start: 0.5rem !important;
  }

  .me-2 {
    margin-inline-end: 0.5rem !important;
  }

  .mx-sm-2 {
    margin-inline-start: 0.5rem !important;
    margin-inline-end: 0.5rem !important;
  }
  .numbers-display {
    unicode-bidi: plaintext; /* Ensures numbers display correctly in RTL */
  }

  .of-word {
    margin: 0 4px; /* Adjust spacing around the "of" word */
  }

  [dir='rtl'] .numbers-display {
    direction: ltr; /* Force LTR for numbers in RTL context */
    unicode-bidi: embed;
  }

  [dir='rtl'] .of-word {
    unicode-bidi: isolate; /* Isolate the Arabic word */
  }
</style>
