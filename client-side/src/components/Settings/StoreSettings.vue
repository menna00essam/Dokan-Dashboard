<script setup>
  import { ref, onMounted, watch, computed } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import { useSettingsStore } from '../../store/useSettingsStore'
  import { useCurrencyStore } from '../../store/useCurrencyStore'

  const toast = useToast()
  const { locale, t } = useI18n()
  const settingsStore = useSettingsStore()
  const currencyStore = useCurrencyStore()

  // Initialize with store values
  const storeSettings = ref({
    name: '',
    currency: 'USD',
    language: 'en'
  })

  const currencies = computed(() =>
    settingsStore.currencies.map((c) => ({
      title: `${c.symbol} - ${c.name}`,
      value: c.code
    }))
  )
  const languages = computed(() => [
    { text: t('english'), value: 'en' },
    { text: t('arabic'), value: 'ar' },
    { text: t('french'), value: 'fr' }
  ])

  // Load settings when component mounts
  onMounted(async () => {
    try {
      await settingsStore.fetchStoreSettings()
      await settingsStore.fetchCurrencies()

      // Check localStorage first, then fall back to store default
      const savedLang =
        localStorage.getItem('userLanguage') || settingsStore.defaultLanguage

      // Update all references
      storeSettings.value = {
        name: settingsStore.storeName,
        currency: settingsStore.currency,
        language: savedLang
      }

      // Apply the language settings
      applyLanguageSettings(savedLang)

      // Persist currency from localStorage
      currencyStore.persistCurrencyFromStorage()
    } catch (error) {
      toast.error(t('failedToLoadSettings'))
    }
  })

  // Watch for language changes
  watch(
    () => storeSettings.value.language,
    (newLang) => {
      if (newLang !== locale.value) {
        applyLanguageSettings(newLang)
      }
    }
  )

  const applyLanguageSettings = (lang) => {
    locale.value = lang
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  const saveSettings = async () => {
    try {
      const settingsToSave = {
        storeName: storeSettings.value.name,
        currency: storeSettings.value.currency,
        defaultLanguage: storeSettings.value.language
      }

      await settingsStore.updateStoreSettings(settingsToSave)
      // Get full currency object (code, symbol, exchange_rate)
      const selectedCurrency = settingsStore.currencies.find(
        (c) => c.code === storeSettings.value.currency
      )

      if (selectedCurrency) {
        currencyStore.setCurrency(selectedCurrency)
      }

      // Persist language preference locally
      localStorage.setItem('userLanguage', storeSettings.value.language)

      toast.success(t('settingsSaved'))
    } catch (error) {
      toast.error(t('failedToSaveSettings'))
    }
  }
</script>
