import { defineStore } from 'pinia'
import axios from 'axios'
const API_BASE_URL = 'https://dokan-dashboard.onrender.com'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    storeName: '',
    currency: 'USD',
    defaultLanguage: 'en',
    shippingMethods: [],
    currencies: [],
    loading: false,
    error: null
  }),

  actions: {
    // Add reset action
    reset() {
      this.storeName = ''
      this.currency = 'USD'
      this.defaultLanguage = 'en'
      this.shippingMethods = []
      this.currencies = []
      this.loading = false
      this.error = null
    },
    async fetchStoreSettings() {
      // Make params optional
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(
          'https://dokan-dashboard.onrender.com/settings/store',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        // Handle both direct settings object and nested response formats
        const settingsData = response.data.data.settings
        console.log('settingsData', settingsData)
        this.updateFromResponse(settingsData)
        return settingsData
      } catch (error) {
        this.handleError(error, 'Failed to fetch store settings')
        throw error // Re-throw for component handling
      } finally {
        this.loading = false
      }
    },

    async fetchCurrencies() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_BASE_URL}/api/currencies`)
        // Ensure we always set an array, even if response is null/undefined
        console.log('Currencies response:', response.data) // Add this line

        this.currencies = Array.isArray(response?.data?.data)
          ? response.data.data
          : []
        return this.currencies
      } catch (error) {
        this.handleError(error, 'Failed to load currencies')
        this.currencies = [] // Fallback to empty array
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateStoreSettings(updatedSettings) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(
          'https://dokan-dashboard.onrender.com/settings/store',
          updatedSettings,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        this.updateFromResponse(response.data)
        return true
      } catch (error) {
        this.handleError(error, 'Failed to update store settings')
        return false
      } finally {
        this.loading = false
      }
    },
    updateFromResponse(data) {
      this.storeName = data.storeName || ''
      this.currency = data.currency || 'USD'
      this.defaultLanguage = data.defaultLanguage || 'en'
      this.shippingMethods = data.shippingMethods || []
    },

    handleError(error, defaultMessage) {
      const message =
        error.response?.data?.message || error.message || defaultMessage
      this.error = message
      console.error('Store Error:', error)
      return message // Return for component handling
    },
    // Simple setters for reactive updates
    setStoreName(name) {
      this.storeName = name
    },

    setCurrency(currency) {
      this.currency = currency
    },

    setLanguage(language) {
      this.defaultLanguage = language
    }
  }
})
