import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/users',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No authentication token found')
  config.headers.Authorization = `Bearer ${token}`
  return config
})

export const useCustomerStore = defineStore('customer', () => {
  const toast = useToast()

  // ------------------ State ------------------
  const customers = ref([])
  const currentCustomer = ref({})
  const currentCustomerOrders = ref([])
  const currentCustomerActivity = ref([])
  const selectedCustomers = ref([])
  const loading = ref(false)
  const error = ref(null)

  const searchQuery = ref('')
  const statusFilter = ref('all')
  const tierFilter = ref('all')
  const sortBy = ref('name')
  const sortOrder = ref('asc')
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const totalPages = ref(1)
  const total = ref(0)

  const provinces = ref([
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' }
  ])

  const cities = ref([
    { id: 1, provinceId: 1, name: 'Downtown Cairo' },
    { id: 2, provinceId: 1, name: 'Nasr City' },
    { id: 3, provinceId: 2, name: 'Montaza' }
  ])

  // ------------------ Computed Getters ------------------
  const filteredCustomers = computed(() => {
    let result = [...customers.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email} ${c.mobile}`
          .toLowerCase()
          .includes(query)
      )
    }

    if (statusFilter.value !== 'all') {
      result = result.filter((c) => c.state === statusFilter.value)
    }

    if (tierFilter.value !== 'all') {
      result = result.filter((c) => c.customerTier === tierFilter.value)
    }

    result.sort((a, b) => {
      let comparison = 0
      if (sortBy.value === 'name') {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      } else if (sortBy.value === 'joinDate') {
        comparison = new Date(a.joinDate) - new Date(b.joinDate)
      } else if (sortBy.value === 'totalSpent') {
        comparison = a.totalSpent - b.totalSpent
      }
      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  const paginatedCustomers = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    return filteredCustomers.value.slice(start, start + itemsPerPage.value)
  })

  const customerStats = computed(() => ({
    total: customers.value.length,
    active: customers.value.filter((c) => c.state === 'active').length,
    blocked: customers.value.filter((c) => c.state === 'blocked').length,
    totalSpent: customers.value.reduce((sum, c) => sum + c.totalSpent, 0)
  }))

  const getCustomerOrders = computed(() => currentCustomerOrders.value)
  const getCustomerActivityLog = computed(() => currentCustomerActivity.value)

  // ------------------ Actions ------------------

  function resetFilters() {
    searchQuery.value = ''
    statusFilter.value = 'all'
    tierFilter.value = 'all'
    sortBy.value = 'name'
    sortOrder.value = 'asc'
    currentPage.value = 1
    itemsPerPage.value = 10
  }

  async function fetchCustomers(page = currentPage.value) {
    try {
      loading.value = true
      const response = await apiClient.get('/', {
        params: {
          page: page,
          limit: itemsPerPage.value,
          search: searchQuery.value,
          state: statusFilter.value,
          customerTier: tierFilter.value,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value
        }
      })

      // Update state from API response
      customers.value = response.data?.data?.users || []
      currentPage.value = response.data?.currentPage || page
      totalPages.value = response.data?.totalPages || 1
      total.value = response.data?.total || 0
      // Ensure we don't exceed total pages
      if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value)
        return fetchCustomers(currentPage.value)
      }

      error.value = null
    } catch (err) {
      error.value = err.message
      toast.error('Failed to fetch customers')
      currentPage.value = 1
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerById(id) {
    try {
      loading.value = true
      const response = await apiClient.get(`/${id}`)
      const customerData =
        response?.data?.data?.user || response?.data?.user || null

      if (customerData && customerData._id) {
        currentCustomer.value = {
          id: customerData._id,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          mobile: customerData.mobile,
          isBlocked: customerData.state === 'blocked',
          tier: customerData.customerTier,
          joinDate: customerData.joinDate,
          avatar: customerData.avatar,
          addresses: customerData.addresses || [],
          ordersCount: customerData.ordersCount,
          totalSpent: customerData.totalSpent,
          lastOrderDate: customerData.lastOrderDate,
          activityLog: customerData.activityLog || [],
          communicationPreferences: customerData.communicationPreferences || {},
          notes: customerData.notes || ''
        }

        currentCustomerActivity.value = customerData.activityLog || []
      } else {
        throw new Error('Invalid customer data structure')
      }
    } catch (err) {
      toast.error('Failed to fetch customer details')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(data) {
    try {
      loading.value = true
      await apiClient.post('/', data)
      toast.success('Customer created successfully')
      await fetchCustomers()
    } catch (err) {
      error.value = err.message
      toast.error('Failed to create customer')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id, customerData) {
    try {
      loading.value = true
      const response = await apiClient.patch(`/${id}`, customerData)
      const updated = response.data.data.user
      const index = customers.value.findIndex((c) => c.id === id)
      if (index !== -1) customers.value[index] = updated
      currentCustomer.value = updated
      return updated
    } catch (error) {
      toast.error('Error updating customer')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id) {
    try {
      loading.value = true
      await apiClient.delete(`/${id}`)
      toast.success('Customer deleted successfully')
      await fetchCustomers()
    } catch (err) {
      error.value = err.message
      toast.error('Failed to delete customer')
    } finally {
      loading.value = false
    }
  }

  async function bulkDeleteCustomers(ids) {
    try {
      loading.value = true
      await apiClient.post('/bulk-delete', { ids })
      toast.success(`${ids.length} customers deleted`)
      await fetchCustomers()
      selectedCustomers.value = []
    } catch (err) {
      error.value = err.message
      toast.error('Failed to delete customers')
    } finally {
      loading.value = false
    }
  }

  async function bulkUpdateStatus(ids, state) {
    try {
      loading.value = true
      await apiClient.patch('/bulk-update-status', { ids, state })
      customers.value = customers.value.map((c) =>
        ids.includes(c.id) ? { ...c, state } : c
      )
      toast.success(`${ids.length} customers updated`)
    } catch (err) {
      error.value = err.message
      toast.error('Failed to update status')
    } finally {
      loading.value = false
    }
  }

  async function addTagsToCustomers(ids, tags) {
    try {
      loading.value = true
      await apiClient.post('/bulk-assign-tags', { ids, tags })
      customers.value = customers.value.map((c) =>
        ids.includes(c.id) ? { ...c, tags: [...(c.tags || []), ...tags] } : c
      )
      toast.success('Tags added successfully')
    } catch (err) {
      error.value = err.message
      toast.error('Failed to add tags')
    } finally {
      loading.value = false
    }
  }

  // In store (corrected toggleBlockStatus)
  async function toggleBlockStatus(customerId) {
    try {
      loading.value = true

      // Get current state
      const customer = customers.value.find((c) => c.id === customerId)
      if (!customer) throw new Error('Customer not found')

      // Toggle state
      const newState = customer.state === 'blocked' ? 'active' : 'blocked'

      // API call
      const response = await apiClient.patch(`/${customerId}`, {
        state: newState
      })

      // Update local state
      const updatedCustomer = response.data.data.user

      // Update customers list
      const index = customers.value.findIndex((c) => c.id === customerId)
      if (index !== -1) customers.value[index] = updatedCustomer

      // Update current customer if needed
      if (currentCustomer.value.id === customerId) {
        currentCustomer.value = {
          ...currentCustomer.value,
          state: newState,
          isBlocked: newState === 'blocked'
        }
      }

      return updatedCustomer
    } catch (err) {
      toast.error('Failed to update customer status')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerOrders(id) {
    try {
      loading.value = true
      const response = await apiClient.get(`/${id}/orders`)
      currentCustomerOrders.value =
        response.data?.orders?.map((order) => ({
          id: order._id,
          orderDate: order.createdAt,
          total: order.totalAmount,
          status: order.status
        })) || []
    } catch (error) {
      toast.error('Failed to fetch orders')
      throw error
    } finally {
      loading.value = false
    }
  }

  function changePage(newPage) {
    if (newPage >= 1 && newPage <= totalPages.value) {
      currentPage.value = newPage
      fetchCustomers()
    }
  }

  // ------------------ Watchers ------------------
watch(
  [searchQuery, statusFilter, tierFilter, sortBy, sortOrder],
  () => {
    currentPage.value = 1
    fetchCustomers()
  },
  { deep: true }
)
  // ------------------ Return ------------------
  return {
    // State
    customers,
    currentCustomer,
    currentCustomerOrders,
    currentCustomerActivity,
    loading,
    error,
    provinces,
    cities,
    searchQuery,
    statusFilter,
    tierFilter,
    sortBy,
    sortOrder,
    currentPage,
    itemsPerPage,
    totalPages,
    selectedCustomers,
    total,
    // Getters
    filteredCustomers,
    paginatedCustomers,
    customerStats,
    getCustomerOrders,
    getCustomerActivityLog,
    toggleBlockStatus,

    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    bulkUpdateStatus,
    addTagsToCustomers,
    fetchCustomerOrders,
    changePage,
    resetFilters
  }
})
