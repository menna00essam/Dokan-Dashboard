<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import { useSettingsStore } from '../../store/useSettingsStore'
  import { useCurrencyStore } from '../../store/useCurrencyStore'

  const toast = useToast()
  const { locale, t } = useI18n()
  const settingsStore = useSettingsStore()
  const currencyStore = useCurrencyStore()

  // State
  const isLoading = ref(true)
  const form = ref({
    name: '',
    currency: 'USD',
    language: 'en'
  })

  // Computed properties
  const currencies = computed(() => {
    if (!Array.isArray(settingsStore.currencies)) return []

    return settingsStore.currencies
      .filter((c) => c && !c.is_deleted) // Filter out deleted currencies
      .map((c) => ({
        title: `${c.symbol} - ${c.name}`.trim(),
        value: c.code.trim() // Trim whitespace (notice JPY has a space)
      }))
  })
  const languages = computed(() => [
    { text: t('english'), value: 'en' },
    { text: t('arabic'), value: 'ar' },
    { text: t('french'), value: 'fr' }
  ])

  // Language handling
  const applyLanguageSettings = (lang) => {
    locale.value = lang
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('userLanguage', lang)
  }

  // Load initial settings
  const loadSettings = async () => {
    try {
      isLoading.value = true
      await Promise.all([
        settingsStore.fetchStoreSettings(),
        settingsStore.fetchCurrencies()
      ])

      // Initialize form values
      form.value = {
        name: settingsStore.storeName || '',
        currency: settingsStore.currency || 'USD',
        language:
          localStorage.getItem('userLanguage') ||
          settingsStore.defaultLanguage ||
          'en'
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
      toast.error(t('error.failedToLoadSettings'))
    } finally {
      isLoading.value = false
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
      isLoading.value = true
      const settingsToSave = {
        storeName: form.value.name,
        currency: form.value.currency,
        defaultLanguage: form.value.language
      }
      settingsStore.setStoreName(form.value.name)
      settingsStore.setCurrency(form.value.currency)
      settingsStore.setLanguage(form.value.language)
      console.log('saves settings', settingsToSave)
      await settingsStore.updateStoreSettings(settingsToSave)
      toast.success(t('settingsSaved'))
    } catch (error) {
      toast.error(t('error.failedToSaveSettings'))
    } finally {
      isLoading.value = false
    }
  }

  // Component lifecycle
  onMounted(async () => {
    await loadSettings()
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
      <!-- Loading state -->
      <template v-if="isLoading">
        <v-skeleton-loader type="article" class="mb-4"></v-skeleton-loader>
      </template>

      <!-- Error state -->
      <template v-else-if="settingsStore.error"
        ><div
          class="flex flex-col justify-center items-center text-center py-12"
        >
          <v-icon class="mx-2" size="96" color="grey lighten-1">
            mdi-store
          </v-icon>
          <p class="text-h4 grey--text my-4">
            {{ $t('error.failedToLoadSettings') }}
          </p>
          <v-btn color="secondary" @click="loadSettings">
            {{ $t('retry') }}
          </v-btn>
        </div>
      </template>

      <!-- Content -->
      <template v-else>
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
                :disabled="isLoading"
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
                :disabled="isLoading"
                :loading="isLoading"
              >
                <template v-slot:no-data>
                  <v-list-item>
                    <v-list-item-title>
                      {{
                        currencies.length === 0
                          ? $t('noCurrenciesAvailable')
                          : $t('loadingCurrencies')
                      }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
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
                :disabled="isLoading"
              ></v-select>
            </v-col>
          </v-row>

          <v-btn
            type="submit"
            color="secondary"
            :disabled="
              isLoading || !form.name || !form.currency || !form.language
            "
            :loading="isLoading"
            class="mt-2"
          >
            {{ $t('saveSettings') }}
          </v-btn>
        </v-form>
      </template>
    </v-card-text>
  </v-card>
</template>
