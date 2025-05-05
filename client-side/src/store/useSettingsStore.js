import { defineStore } from 'pinia'
import axios from 'axios'
const API_BASE_URL = 'http://localhost:5000'

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
          'http://localhost:5000/settings/store',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )
        this.updateFromResponse(response.data)
        return response.data // Return data for components to use
      } catch (error) {
        this.handleError(error, 'Failed to fetch store settings')
        throw error // Re-throw for component handling
      } finally {
        this.loading = false
      }
    },

    async fetchCurrencies() {
      try {
        const controller = new AbortController()
        const response = await axios.get(`${API_BASE_URL}/api/currencies`, {
          signal: controller.signal
        })
        this.currencies = response.data
        return response.data
      } catch (error) {
        if (!axios.isCancel(error)) {
          return this.handleError(error, 'Failed to load currencies')
        }
      }
    },

    async updateStoreSettings(updatedSettings) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(
          'http://localhost:5000/settings/store',
          updatedSettings
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
    async fetchShippingMethods(page = 1, limit = 10) {
      this.loading = true
      try {
        const response = await axios.get(
          'http://localhost:5000/settings/shipping-methods',
          {
            params: { page, limit }
          }
        )

        this.shippingMethods = response.data.data.shippingMethods
        this.pagination = response.data.data.pagination
      } catch (error) {
        this.error =
          error.response?.data?.message || 'Failed to fetch shipping methods'
      } finally {
        this.loading = false
      }
    },
    async deleteShippingMethod(methodId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(
          `http://localhost:5000/settings/shipping-methods/${methodId}`
        )
        this.shippingMethods = this.shippingMethods.filter(
          (method) => method._id !== methodId
        )
        return true
      } catch (error) {
        this.handleError(error, 'Failed to delete shipping method')
        return false
      } finally {
        this.loading = false
      }
    },

    updateFromResponse(data) {
      const { storeName, currency, defaultLanguage, shippingMethods } =
        data.settings
      this.storeName = storeName
      this.currency = currency
      this.defaultLanguage = defaultLanguage
      this.shippingMethods = shippingMethods || []
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
