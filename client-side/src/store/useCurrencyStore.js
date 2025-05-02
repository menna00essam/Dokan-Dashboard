import { defineStore } from 'pinia'
import axios from 'axios'

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    currencies: [],
    selectedCurrency: {
      code: 'USD',
      exchange_rate: 1,
      symbol: '$'
    },
    loading: false,
    error: null
  }),

  actions: {
    async fetchCurrencies() {
      this.loading = true
      try {
        const res = await axios.get('http://localhost:5000/api/currencies')
        this.currencies = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : []
      } catch (err) {
        console.error('Failed to fetch currencies:', err)
        this.error = err.response?.data?.message || 'Failed to fetch currencies'
      } finally {
        this.loading = false
      }
    },

    async addCurrency(data) {
      try {
        await axios.post('http://localhost:5000/api/currencies', data)
        await this.fetchCurrencies()
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to add currency'
      }
    },

    async updateCurrency(id, data) {
      try {
        const res = await axios.put(`http://localhost:5000/api/currencies/${id}`, data)
        const index = this.currencies.findIndex(c => c._id === id)
        if (index !== -1) {
          this.currencies[index] = res.data
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update currency'
      }
    },

    async deleteCurrency(id) {
      try {
        await axios.delete(`http://localhost:5000/api/currencies/${id}`)
        this.currencies = this.currencies.filter(currency => currency._id !== id)
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete currency'
      }
    },

    setCurrency(currency) {
      this.selectedCurrency = currency
      localStorage.setItem('selectedCurrency', JSON.stringify(currency))
    },

    persistCurrencyFromStorage() {
      const savedCurrency = localStorage.getItem('selectedCurrency')
      if (savedCurrency) {
        try {
          const currency = JSON.parse(savedCurrency)
          if (currency && currency.code && currency.exchange_rate && currency.symbol) {
            this.selectedCurrency = currency
          }
        } catch (err) {
          console.error('Error parsing saved currency:', err)
        }
      }
    }
  },

  getters: {
    rate: (state) => state.selectedCurrency.exchange_rate,
    symbol: (state) => state.selectedCurrency.symbol
  }
})
