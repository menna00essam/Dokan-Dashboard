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
     const response = await apiClient.get("/", {
      params: {
        page: page,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        state: statusFilter.value,       // Should match backend expectation
        customerTier: tierFilter.value,  // Should match backend expectation
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      },
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
      loading.value = true;
      const response = await apiClient.get(`/${id}`);
  
      if (!response.data?.data?.user) {
        throw new Error('Customer data not found in response');
      }
  
      const customerData = response.data.data.user;
  
      currentCustomer.value = {
        id: customerData._id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        mobile: customerData.mobile,
        tier: customerData.customerTier,
        joinDate: customerData.joinDate,
        avatar: customerData.avatar,
        addresses: customerData.addresses || [],
        ordersCount: customerData.ordersCount,
        totalSpent: customerData.totalSpent,
        lastOrderDate: customerData.lastOrderDate,
        activityLog: customerData.activityLog || [],
        communicationPreferences: customerData.communicationPreferences || {},
        notes: customerData.notes || '',
        state: customerData.state,
      };
  
      currentCustomerActivity.value = customerData.activityLog || [];
  
      console.log('currentCustomer updated:', currentCustomer.value);
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
      });
      throw err;
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


async function bulkUpdateTier(ids, tier) {
  try {
    loading.value = true
    const response = await apiClient.patch('/bulk-update-tier', { ids, tier })

    customers.value = customers.value.map((c) =>
      ids.includes(c._id) ? { ...c, customerTier: tier } : c
    )

    toast.success(`Updated ${response.data.modifiedCount} users`)
    return response.data.modifiedCount
  } catch (err) {
    toast.error('Tier update failed')
    throw err
  } finally {
    loading.value = false
  }
}


 async function updateCustomer(id, customerData) {
  loading.value = true
  try {
    const response = await apiClient.patch(`/${id}`, customerData)
    const updated = response.data.data?.user || response.data.data

    const index = customers.value.findIndex(c => c.id === id || c._id === id)
    if (index !== -1) {
      customers.value[index] = { ...customers.value[index], ...updated }
    } else {
      customers.value.unshift(updated)
    }

    if (currentCustomer.value?.id === id || currentCustomer.value?._id === id) {
      currentCustomer.value = updated
    }

    toast.success('Customer updated successfully')
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

// In useCustomerStore (Pinia store)
async function bulkUpdateStatus(userIds, newState) {
  try {
    loading.value = true;
    const response = await apiClient.patch('/bulk-status', { 
      userIds, 
      state: newState 
    });

    // Update local state
    customers.value = customers.value.map(c => 
      userIds.includes(c._id) ? { ...c, state: newState } : c
    );
     const modifiedCount = response.data.data.modifiedCount;


    toast.success(`Updated ${response.data.modifiedCount} users`);
    return response.data.modifiedCount;
  } catch (err) {
    toast.error('Failed to update statuses');
    throw err;
  } finally {
    loading.value = false;
  }
}





 async function addTagsToCustomers(ids, tags) {
  try {
    loading.value = true
    await apiClient.post('/bulk-assign-tags', { ids, tags })

    customers.value = customers.value.map((c) =>
      ids.includes(c._id) ? { ...c, tags: [...(c.tags || []), ...tags] } : c
    )

    toast.success('Tags added successfully')
  } catch (err) {
    error.value = err.message
    toast.error('Failed to add tags')
  } finally {
    loading.value = false
  }
}



// In useCustomerStore (Pinia store)
async function toggleBlockStatus(customerId) {
  try {
    // Change 'id' to '_id' when finding the customer
    const customer = customers.value.find(c => c._id === customerId);
    if (!customer) throw new Error('Customer not found');
    
    const newState = customer.state === 'blocked' ? 'active' : 'blocked';
    
    await apiClient.patch(`/${customerId}`, { state: newState });
    
    // Update local state
    customer.state = newState;
    
    // Change 'id' to '_id' for current customer check
    if (currentCustomer.value._id === customerId) {
      currentCustomer.value.state = newState;
    }
    
    return true;
  } catch (err) {
    toast.error(t('customers.statusUpdateError'));
    throw err;
  }
}
  

async function fetchCustomerOrders(id) {
  try {
    loading.value = true
    const response = await apiClient.get(`http://localhost:5000/orders/user/${id}`)
    
    console.log('Response from API:', response.data);

    currentCustomerOrders.value = response.data?.orders?.map(order => ({
      id: order._id,
      orderDate: order.createdAt,
      total: order.totalAmount,
      status: order.status,
      orderItems: order.orderItems,
      shippingAddress: order.shippingAddress, 
      shippingMethod: order.shippingMethod, 
      transactionId: order.transactionId,
      previousStatus: order.previousStatus, 
      isDeleted: order.isDeleted, 
      orderNumber: order.orderNumber, 
    })) || []

    // طباعة currentCustomerOrders في الـ console
    console.log('Current Customer Orders:', currentCustomerOrders.value);

    // تحديث بيانات العميل
    const customer = customers.value.find(c => c._id === id)
    if (customer) {
      customer.ordersCount = currentCustomerOrders.value.length
      customer.totalSpent = currentCustomerOrders.value.reduce((sum, o) => sum + o.total, 0)
      customer.lastOrderDate = currentCustomerOrders.value.length > 0 
        ? new Date(Math.max(...currentCustomerOrders.value.map(o => new Date(o.orderDate).getTime())))
        : null

      // طباعة تفاصيل العميل بعد التحديث
      console.log('Updated Customer Info:', customer);
    }
  } catch (error) {
    toast.error('Failed to fetch orders')
    console.error('Error fetching orders:', error); // عرض الخطأ في الـ console
    throw error
  } finally {
    loading.value = false
  }
}



const avgOrder = computed(() => {
  if (customerStats.value.ordersCount === 0) return 0
  return (customerStats.value.totalSpent / customerStats.value.ordersCount).toFixed(2)
})


const formatDate = (date) => {
  if (!date) return '--'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return '--'
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



// watch(currentCustomerOrders, (newOrders) => {
//   if (newOrders.length > 0 && customer.value) {
//     customer.value.ordersCount = newOrders.length
//     customer.value.totalSpent = newOrders.reduce((sum, o) => sum + o.total, 0)
//     customer.value.lastOrderDate = newOrders[newOrders.length - 1].orderDate
//   }
// })
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
    resetFilters,
    bulkUpdateTier
  }
})