import { defineStore } from 'pinia'
import axios from 'axios'

export const useRequestsStore = defineStore('requests', {
  state: () => ({
    requests: [],
    loading: false,
    error: null,
    searchQuery: '', // Add search query to state
    pagination: {
      total: 0,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 5
    }
  }),

  actions: {
    async fetchRequests(params = {}) {
      this.loading = true
      this.error = null
      try {
        // Use the search query from params OR from store state
        const searchParam =
          params.search !== undefined ? params.search : this.searchQuery

        const response = await axios.get(
          'http://localhost:5000/users/pending',
          {
            params: {
              page: params.page || 1, // Always use params.page if provided
              limit: params.limit || this.pagination.itemsPerPage,
              search: searchParam, // Use the determined search value
              sortBy: 'createdAt', // Hardcoded to only sort by createdAt
              sortDirection: params.sortDirection || 'desc'
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        this.requests = response.data.data.users
        this.updatePagination({
          total: response.data.total,
          currentPage: response.data.currentPage, // Update from API response
          totalPages: response.data.totalPages,
          itemsPerPage: params.limit || this.pagination.itemsPerPage
        })
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    // Update setSearchQuery to not trigger fetch
    setSearchQuery(query) {
      this.searchQuery = query
      // Don't fetch here - let the component handle it
    },

    // Keep all your existing actions (approveRequest, denyRequest, etc.)
    async approveRequest(userId) {
      this.loading = true
      try {
        await axios.patch(
          `http://localhost:5000/users/${userId}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache'
            }
          }
        )
        this.removeUser(userId)
        this.updateTotalCount(-1)
      } catch (error) {
        this.handleError(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async denyRequest(userId) {
      this.loading = true
      try {
        await axios.patch(
          `http://localhost:5000/users/${userId}/deny`,
          { reason: 'you are not legal to enter dashboard' },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache'
            }
          }
        )
        this.removeUser(userId)
        this.updateTotalCount(-1)
      } catch (error) {
        this.handleError(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // Keep all your existing helper methods
    updatePagination(paginationData) {
      this.pagination = {
        ...this.pagination,
        ...paginationData
      }
    },

    removeUser(userId) {
      this.requests = this.requests.filter((user) => user._id !== userId)
    },

    updateTotalCount(change) {
      this.pagination.total = Math.max(0, this.pagination.total + change)
      this.pagination.totalPages = Math.ceil(
        this.pagination.total / this.pagination.itemsPerPage
      )

      if (this.pagination.currentPage > this.pagination.totalPages) {
        this.pagination.currentPage = 1
      }
    },

    handleError(error) {
      this.error =
        error.response?.data?.message ||
        error.message ||
        'An unknown error occurred'
    }
  },

  getters: {
    hasNextPage: (state) =>
      state.pagination.currentPage < state.pagination.totalPages,
    hasPreviousPage: (state) => state.pagination.currentPage > 1,
    showingFrom: (state) =>
      (state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1,
    showingTo: (state) =>
      Math.min(
        state.pagination.currentPage * state.pagination.itemsPerPage,
        state.pagination.total
      )
  }
})
