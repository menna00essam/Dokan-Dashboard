import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import { reactive } from 'vue'


const apiClient = axios.create({
  baseURL: 'http://localhost:5000/users',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const useCustomerStore = defineStore('customer', () => {
  const toast = useToast();

  // ------------------ State ------------------
  const customers = ref([]);
  const currentCustomer = ref({});
  const loading = ref(false);
  const error = ref(null);
  const currentCustomerOrders = ref([]);
const currentCustomerActivity = ref([]);

  const searchQuery = ref('');
  const statusFilter = ref('all');
  const tierFilter = ref('all');
  const sortBy = ref('name');
  const sortOrder = ref('asc');
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const totalPages = ref(1);
  const selectedCustomers = ref([]);

  const provinces = ref([
    { id: 1, name: 'Cairo' },
    { id: 2, name: 'Alexandria' }
  ]);

  const cities = ref([
    { id: 1, provinceId: 1, name: 'Downtown Cairo' },
    { id: 2, provinceId: 1, name: 'Nasr City' },
    { id: 3, provinceId: 2, name: 'Montaza' }
  ]);

  // ------------------ Getters ------------------
  const filteredCustomers = computed(() => {
    let result = [...customers.value];

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(c =>
        `${c.firstName} ${c.lastName} ${c.email} ${c.mobile}`.toLowerCase().includes(query)
      );
    }

    if (statusFilter.value !== 'all') {
      result = result.filter(c => c.state === statusFilter.value);
    }

    if (tierFilter.value !== 'all') {
      result = result.filter(c => c.customerTier === tierFilter.value);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy.value === 'name') {
        comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy.value === 'joinDate') {
        comparison = new Date(a.joinDate) - new Date(b.joinDate);
      } else if (sortBy.value === 'totalSpent') {
        comparison = a.totalSpent - b.totalSpent;
      }
      return sortOrder.value === 'asc' ? comparison : -comparison;
    });

    return result;
  });

  const paginatedCustomers = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    return filteredCustomers.value.slice(start, start + itemsPerPage.value);
  });

  const customerStats = computed(() => ({
    total: customers.value.length,
    active: customers.value.filter(c => c.state === 'active').length,
    blocked: customers.value.filter(c => c.state === 'blocked').length,
    totalSpent: customers.value.reduce((sum, c) => sum + c.totalSpent, 0),
  }));



  // ------------------ Actions ------------------
  async function fetchCustomers(page = 1, itemsCount = 10) {
    try {
      loading.value = true;
      const response = await apiClient.get('/', {
        params: {
          page,
          limit: itemsCount,
          search: searchQuery.value,
          state: statusFilter.value,
          customerTier: tierFilter.value,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      });

      customers.value = response.data?.data?.users || [];
      currentPage.value = response.data?.currentPage || 1;
      totalPages.value = response.data?.totalPages || 1;
      error.value = null;
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to fetch customers');
    } finally {
      loading.value = false;
    }
  }

  async function fetchCustomerById(id) {
    try {
      loading.value = true;
      const response = await apiClient.get(`/${id}`);
      console.log('API Response Data Structure:', response);
  
      const customerData =
        response?.data?.data?.user || 
        response?.data?.user ||      
        null;
  
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
          notes: customerData.notes || '',
        };
  
        currentCustomerActivity.value = customerData.activityLog || [];
      } else {
        const errorMessage = response?.data?.status
          ? `Invalid customer data structure: ${response?.data?.status}`
          : 'Invalid customer data structure';
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to fetch customer details');
      console.error('Fetch error:', error);
      console.error('Error details:', error.message || error);
      console.error('Response data:', error.response?.data || error);
      throw error;
    } finally {
      loading.value = false;
    }
  }
  
  
  
  async function createCustomer(data) {
    try {
      loading.value = true;
      await apiClient.post('/', data);
      toast.success('Customer created successfully');
      await fetchCustomers(currentPage.value, itemsPerPage.value);
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to create customer');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCustomer(id, customerData) {
    try {
      loading.value = true;
      const response = await apiClient.patch(`/${id}`, {
        ...customerData,
        state: customerData.state,
        customerTier: customerData.customerTier
      });

      const updated = response.data.data.user;
      const index = customers.value.findIndex(c => c.id === id);
      if (index !== -1) customers.value[index] = updated;
      currentCustomer.value = updated;

      return updated;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCustomer(id) {
    try {
      loading.value = true;
      await apiClient.delete(`/${id}`);
      toast.success('Customer deleted successfully');
      await fetchCustomers(currentPage.value, itemsPerPage.value);
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to delete customer');
    } finally {
      loading.value = false;
    }
  }

  async function bulkDeleteCustomers(ids) {
    try {
      loading.value = true;
      await apiClient.post('/bulk-delete', { ids });
      toast.success(`${ids.length} customers deleted`);
      await fetchCustomers(currentPage.value, itemsPerPage.value);
      selectedCustomers.value = [];
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to delete customers');
    } finally {
      loading.value = false;
    }
  }

async function fetchCustomerOrders(id) {
  try {
    ordersLoading.value = true;
    const response = await apiClient.get(`/users/${id}/orders`);
    currentCustomerOrders.value = response.data?.orders?.map(order => ({
      id: order._id,
      orderDate: order.createdAt,
      total: order.totalAmount,
      status: order.status
    })) || [];
  } catch (error) {
    toast.error('Failed to fetch orders');
    throw error;
  } finally {
    ordersLoading.value = false;
  }
}
  

  async function bulkUpdateStatus(ids, state) {
    try {
      loading.value = true;
      await apiClient.patch('/bulk-update-status', { ids, state });
      customers.value = customers.value.map(c =>
        ids.includes(c.id) ? { ...c, state } : c
      );
      toast.success(`${ids.length} customers updated to ${state}`);
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to update status');
    } finally {
      loading.value = false;
    }
  }

  async function addTagsToCustomers(ids, tags) {
    try {
      loading.value = true;
      await apiClient.post('/bulk-assign-tags', { ids, tags });
      customers.value = customers.value.map(c =>
        ids.includes(c.id)
          ? { ...c, tags: [...(c.tags || []), ...tags] }
          : c
      );
      toast.success(`${tags.length} tags added to ${ids.length} customers`);
    } catch (err) {
      error.value = err.message;
      toast.error('Failed to add tags');
    } finally {
      loading.value = false;
    }
  }


  // async function fetchCustomerOrders(id) {
  //   try {
  //     loading.value = true;
  //     const response = await apiClient.get(`/${id}/orders`);
  //     currentCustomerOrders.value = response.data.data.orders;
  //   } catch (error) {
  //     toast.error('Failed to fetch customer orders');
  //     throw error;
  //   } finally {
  //     loading.value = false;
  //   }
  // }


 

  function changePage(newPage) {
    if (newPage >= 1 && newPage <= totalPages.value) {
      currentPage.value = newPage;
      fetchCustomers(newPage, itemsPerPage.value);
    }
  }

  const getCustomerOrders = computed(() => currentCustomerOrders.value);
  const getCustomerActivityLog = computed(() => currentCustomerActivity.value);



  // ------------------ Watchers ------------------
  watch([searchQuery, statusFilter, tierFilter, sortBy, sortOrder], () => {
    currentPage.value = 1;
    fetchCustomers(currentPage.value, itemsPerPage.value);
  });

  // ------------------ Return ------------------
  return {
    // State
    customers,
    currentCustomer,
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

    // Getters
    filteredCustomers,
    paginatedCustomers,
    customerStats,

    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    bulkUpdateStatus,
    addTagsToCustomers,
    changePage,
    getCustomerActivityLog,
    getCustomerOrders,
    fetchCustomerOrders,
  };
});
