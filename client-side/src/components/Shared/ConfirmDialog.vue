<template>
  <v-dialog
    class="confirm-dialog"
    v-model="dialog"
    :max-width="maxWidth"
    persistent
    scrim="rgba(0, 0, 0, 0.5)"
  >
    <v-card class="dialog-card" :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
      <v-card-title class="dialog-title">
        <v-icon
          size="24"
          class="mr-2"
          :color="iconColor"
          :class="{
            'ma-3': $i18n.locale === 'ar',
            'ml-0': $i18n.locale !== 'ar'
          }"
          >{{ dialogIcon }}</v-icon
        >
        {{ title }}
      </v-card-title>

      <v-card-text class="dialog-message">
        {{ message }}
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          class="cancel-btn"
          @click="onCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          class="confirm-btn"
          @click="onConfirm"
          :loading="loading"
          variant="flat"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, computed } from 'vue'
  const isOpen = ref(false)






  const props = defineProps({
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmColor: {
      type: String,
      default: 'primary'
    },
    maxWidth: {
      type: String,
      default: '500'
    },
    type: {
      type: String,
      default: 'info', // 'info', 'warning', 'error', 'success'
      validator: (value) =>
        ['info', 'warning', 'error', 'success'].includes(value)
    }
  })

  const emit = defineEmits(['confirm', 'cancel'])

  const dialog = ref(false)
  const loading = ref(false)

  // Compute icon based on dialog type
  const dialogIcon = computed(() => {
    const icons = {
      info: 'mdi-information-outline',
      warning: 'mdi-alert-outline',
      error: 'mdi-alert-circle-outline',
      success: 'mdi-check-circle-outline'
    }
    return icons[props.type] || 'mdi-information-outline'
  })

  // Compute icon color based on dialog type
  const iconColor = computed(() => {
    const colors = {
      info: 'info',
      warning: 'warning',
      error: 'error',
      success: 'success'
    }
    return colors[props.type] || 'info'
  })

  const open = () => {
    dialog.value = true
  }

  const close = () => {
    dialog.value = false
  }

  const onConfirm = async () => {
    loading.value = true
    try {
      await emit('confirm')
      close()
    } finally {
      loading.value = false
    }
  }

  const onCancel = () => {
    emit('cancel')
    close()
  }
  

  // Expose open/close methods to parent component
  defineExpose({ open, close })
</script>

<style scoped>
  .confirm-dialog {
    transition: all 0.3s ease;
  }

  .dialog-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 600;
    padding: 20px 24px 10px;
    display: flex;
    align-items: center;
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  }

  .dialog-message {
    font-size: 1rem;
    line-height: 1.5;
    padding: 0 24px 20px;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  }

  .dialog-actions {
    padding: 8px 16px 16px;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .cancel-btn {
    margin-right: 12px;
    text-transform: capitalize;
    letter-spacing: normal;
  }

  .confirm-btn {
    text-transform: capitalize;
    letter-spacing: normal;
    font-weight: 500;
  }

  /* Animation for dialog */
  .v-dialog__content {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .dialog-card {
      margin: 16px;
    }

    .dialog-title {
      font-size: 1.1rem;
      padding: 16px 16px 8px;
    }

    .dialog-message {
      font-size: 0.95rem;
      padding: 0 16px 16px;
    }
  }
</style>
