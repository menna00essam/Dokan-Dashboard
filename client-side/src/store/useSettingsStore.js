import { defineStore } from 'pinia'
import axios from 'axios'

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
    async fetchStoreSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/settings')
        this.updateFromResponse(response.data)
      } catch (error) {
        this.handleError(error, 'Failed to fetch store settings')
      } finally {
        this.loading = false
      }
    },



    async fetchCurrencies() {
      try {
        const response = await axios.get('http://localhost:5000/api/currencies')
        console.log(response.data)  
        this.currencies = response.data
      } catch (error) {
        this.handleError(error, 'Failed to load currencies')
      }
    },
    

    async updateStoreSettings(updatedSettings) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(
          'http:localhost:5000/store/settings',
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


    // async setCurrency(currency) {
    //   this.currency = currency
    //   try {
    //     await axios.put('/api/settings', { currency })
    //   } catch (error) {
    //     this.handleError(error, 'Failed to update currency')
    //   }
    // },

    async deleteShippingMethod(methodId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`/api/settings/shipping-methods/${methodId}`)
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
      this.error = error.response?.data?.message || defaultMessage
      console.error(error)
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
