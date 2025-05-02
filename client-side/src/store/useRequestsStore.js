import { defineStore } from 'pinia'
import axios from 'axios'

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    requests: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchRequests() {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.get(
          'http://localhost:5000/users/pending',
          {
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache'
            },
            params: {
              _: Date.now() // Cache-busting query parameter
            }
          }
        )
        this.requests = data.users
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch requests'
      } finally {
        this.loading = false
      }
    }

    // async approveRequest(userId) {
    //   this.loading = true
    //   this.error = null
    //   try {
    //     await axios.patch(`http://localhost:5000/users/${userId}/approve`)
    //     this.requests = this.requests.filter((user) => user._id !== userId)
    //   } catch (error) {
    //     this.error =
    //       error.response?.data?.message || 'Failed to approve request'
    //   } finally {
    //     this.loading = false
    //   }
    // },

    // async denyRequest(userId) {
    //   this.loading = true
    //   this.error = null
    //   try {
    //     await axios.patch(`http://localhost:5000/users/${userId}/deny`)
    //     this.requests = this.requests.filter((user) => user._id !== userId)
    //   } catch (error) {
    //     this.error = error.response?.data?.message || 'Failed to deny request'
    //   } finally {
    //     this.loading = false
    //   }
    // }
  }
})
