<script setup>
  import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import { useSettingsStore } from '../../store/useSettingsStore'
  import { useCurrencyStore } from '../../store/useCurrencyStore'

  const toast = useToast()
  const { locale, t } = useI18n()
  const settingsStore = useSettingsStore()
  const currencyStore = useCurrencyStore()

  // Reactive form model
  const form = ref({
    name: '',
    currency: 'USD',
    language: 'en'
  })

  // Safe reference to mounted state
  let isMounted = false

  // Computed properties
  const currencies = computed(() => {
    return settingsStore.currencies.map((c) => ({
      title: `${c.symbol} - ${c.name}`,
      value: c.code
    }))
  })

  const languages = computed(() => [
    { text: t('english'), value: 'en' },
    { text: t('arabic'), value: 'ar' },
    { text: t('french'), value: 'fr' }
  ])

  // Language handling
  const applyLanguageSettings = (lang) => {
    if (!isMounted) return
    locale.value = lang
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('userLanguage', lang)
  }

  // Load initial settings
  const loadSettings = async () => {
    try {
      await Promise.all([
        settingsStore.fetchStoreSettings(),
        settingsStore.fetchCurrencies()
      ])

      // Initialize form values
      form.value = {
        name: settingsStore.storeName,
        currency: settingsStore.currency,
        language:
          localStorage.getItem('userLanguage') || settingsStore.defaultLanguage
      }

      // Apply initial language
      applyLanguageSettings(form.value.language)

      // Initialize currency
      const selectedCurrency = settingsStore.currencies.find(
        (c) => c.code === form.value.currency
      )
      if (selectedCurrency) {
        currencyStore.setCurrency(selectedCurrency)
      }
    } catch (error) {
      toast.error(t('failedToLoadSettings'))
    }
  }

  // Watch for changes
  watch(
    () => form.value.language,
    (newLang) => {
      if (newLang !== locale.value) {
        applyLanguageSettings(newLang)
      }
    }
  )

  watch(
    () => form.value.currency,
    (newCurrency) => {
      const selectedCurrency = settingsStore.currencies.find(
        (c) => c.code === newCurrency
      )
      if (selectedCurrency) {
        currencyStore.setCurrency(selectedCurrency)
      }
    }
  )

  // Save settings
  const saveSettings = async () => {
    try {
      const settingsToSave = {
        storeName: form.value.name,
        currency: form.value.currency,
        defaultLanguage: form.value.language
      }

      await settingsStore.updateStoreSettings(settingsToSave)
      toast.success(t('settingsSaved'))
    } catch (error) {
      toast.error(t('failedToSaveSettings'))
    }
  }

  // Component lifecycle
  onMounted(() => {
    isMounted = true
    loadSettings()
  })

  onBeforeUnmount(() => {
    isMounted = false
    // Cleanup any pending operations
  })
</script>

<template>
  <v-card class="mb-6">
    <v-card-title class="primary">
      <div
        class="d-flex"
        :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
      >
        <v-icon
          class="mx-2"
          :left="$i18n.locale !== 'ar'"
          :right="$i18n.locale === 'ar'"
        >
          mdi-store
        </v-icon>
        {{ $t('storeSettings') }}
      </div>
    </v-card-title>

    <v-card-text>
      <v-progress-linear
        v-if="settingsStore.loading"
        indeterminate
        color="primary"
        class="mb-4"
      ></v-progress-linear>

      <v-form
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        @submit.prevent="saveSettings"
      >
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.name"
              :label="$t('storeName')"
              :rules="[(v) => !!v || $t('fieldRequired')]"
              outlined
              required
              :disabled="settingsStore.loading"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="form.currency"
              :items="currencies"
              :label="$t('currency')"
              :rules="[(v) => !!v || $t('fieldRequired')]"
              outlined
              required
              :disabled="settingsStore.loading || !currencies.length"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="form.language"
              :items="languages"
              item-title="text"
              item-value="value"
              :label="$t('language')"
              :rules="[(v) => !!v || $t('fieldRequired')]"
              outlined
              required
              :disabled="settingsStore.loading"
            ></v-select>
          </v-col>
        </v-row>

        <v-btn
          type="submit"
          color="secondary"
          :disabled="
            settingsStore.loading ||
            !form.name ||
            !form.currency ||
            !form.language
          "
          :loading="settingsStore.loading"
          class="mt-2"
        >
          {{ $t('saveSettings') }}
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>
