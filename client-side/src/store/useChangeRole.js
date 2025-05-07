import { defineStore } from 'pinia'
import { ref, computed } from 'vue' // Added computed import
import { useAuthStore } from './auth'
import axios from 'axios'

export const useChangeRole = defineStore('ChangeRole', () => {
  const authStore = useAuthStore()
  const BaseUrl = 'http://localhost:5000'

  // State
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const roles = ref(['user', 'admin']) // Available roles

  // Getters
  const currentUser = computed(() => authStore.user)
  const isSuperAdmin = computed(() => currentUser.value?.role === 'superadmin')

  // Actions
  const fetchUsers = async ({ page, limit }) => {
    try {
      loading.value = true
      const response = await axios.get(
        `${BaseUrl}/users/roles/available-users`,
        {
          params: { page, limit },
          headers: {
            'Cache-Control': 'no-cache',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Pragma: 'no-cache'
          }
        }
      )
      users.value = response.data.data.users.map((user) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`
      }))
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  const updateUserRole = async (user) => {
    try {
      loading.value = true
      const response = await axios.patch(
        `${BaseUrl}/users/roles/${user._id}`,
        { role: user.role }, // Added request body
        {
          // Correct axios config position
          headers: {
            'Cache-Control': 'no-cache',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Pragma: 'no-cache'
          }
        }
      )

      // Update local state - more robust approach
      users.value = users.value.map((u) =>
        u._id === user._id ? { ...u, role: response.data.data.user.role } : u
      )

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update user role'
      console.error('Error updating user role:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    roles,
    currentUser,
    isSuperAdmin,
    fetchUsers,
    updateUserRole
  }
})
