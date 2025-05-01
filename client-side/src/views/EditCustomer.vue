<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn icon @click="saveAndBack" class="mr-5">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        Edit Customer
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveCustomer">
          <!-- Personal Information Section -->
          <v-card class="mb-4" elevation="1" v-if="customer">
            <v-card-title>Personal Information</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.firstName"
                    label="First Name"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.lastName"
                    label="Last Name"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.email"
                    label="Email"
                    type="email"
                    required
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.mobile"
                    label="Phone Number"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="customer.tier"
                    :items="tierOptions"
                    label="Tier"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="customer.status"
                    :items="statusOptions"
                    label="Status"
                  />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="customer.tags"
                    :items="commonTags"
                    label="Tags"
                    multiple
                    chips
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Address Information Section -->
          <transition-group name="slide-fade">
            <v-card
              class="mb-4"
              elevation="1"
              v-for="(address, index) in customer.addresses"
              :key="address.id"
            >
              <v-card-title class="d-flex justify-content-between">
                <v-icon left>mdi-map-marker</v-icon>
                Address {{ index + 1 }}
                <v-spacer />
                <v-btn
                  icon
                  @click="removeAddress(index)"
                  color="error"
                  :disabled="customer.addresses.length <= 1"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="address.province"
                      :items="provinces"
                      label="Province"
                      item-title="name"
                      item-value="id"
                      return-object
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="address.city"
                      :items="filteredCities(address.province?.id)"
                      label="City"
                      item-title="name"
                      item-value="id"
                      return-object
                      :disabled="!address.province"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="address.street"
                      label="Street Address"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="address.building" label="Building" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="address.floor" label="Floor" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="address.apartment"
                      label="Apartment"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="address.postalCode"
                      label="Postal Code"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-checkbox
                      v-model="address.isDefault"
                      label="Default Address"
                      @change="setDefaultAddress(index)"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </transition-group>

          <v-btn @click="addNewAddress" color="primary" class="mb-4">
            <v-icon left>mdi-plus</v-icon>
            Add New Address
          </v-btn>

          <!-- Communication Preferences -->
          <v-card
            class="mb-4"
            elevation="1"
            v-if="customer.communicationPreferences"
          >
            <v-card-title>Communication Preferences</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.email"
                    label="Email"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.sms"
                    label="SMS"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.whatsapp"
                    label="WhatsApp"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-btn
            type="submit"
            color="secondary"
            size="large"
            :loading="isSaving"
          >
            Save Changes
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useCustomerStore } from '../store/customers'
  import { useToast } from 'vue-toastification'

  const route = useRoute()
  const router = useRouter()
  const customerStore = useCustomerStore()
  const toast = useToast()

  // Constants
  const statusOptions = ['active', 'blocked']
  const tierOptions = ['basic', 'silver', 'gold', 'platinum']
  const commonTags = ['VIP', 'Frequent Buyer', 'New', 'At Risk', 'Wholesale']

  // Initialize empty customer with all required fields
  const customer = ref({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    addresses: [],
    joinDate: null,
    birthDate: null,
    avatar: '',
    ordersCount: 0,
    totalSpent: 0,
    lastOrderDate: null,
    tags: [],
    status: 'active',
    tier: 'basic',
    isBlocked: false,
    notes: '',
    communicationPreferences: {
      email: true,
      sms: false,
      whatsapp: false
    }
  })

  const isSaving = ref(false)
  const isAddressLoading = ref(false)

  // Get provinces and cities from store
  const provinces = customerStore.provinces
  const cities = customerStore.cities

  // Initialize component
  onMounted(async () => {
    try {
      if (!route.params.id) {
        toast.error('No customer ID provided')
        router.back()
        return
      }

      const existingCustomer = customerStore.getCustomerById(route.params.id)
      if (!existingCustomer) {
        toast.error('Customer not found')
        router.back()
        return
      }

      // Deep clone and initialize customer data
      customer.value = JSON.parse(
        JSON.stringify({
          ...existingCustomer,
          // Ensure all required fields exist
          addresses:
            existingCustomer.addresses?.map((addr) => ({
              ...addr,
              // Ensure province/city objects match select options
              province:
                provinces.value?.find((p) => p.id === addr.province?.id) ||
                addr.province,
              city:
                cities.value?.find((c) => c.id === addr.city?.id) || addr.city
            })) || [],
          communicationPreferences: {
            email: existingCustomer.communicationPreferences?.email ?? true,
            sms: existingCustomer.communicationPreferences?.sms ?? false,
            whatsapp:
              existingCustomer.communicationPreferences?.whatsapp ?? false
          }
        })
      )

      // Ensure at least one address exists
      if (customer.value.addresses.length === 0) {
        await addNewAddress(true)
      }
    } catch (error) {
      toast.error('Failed to load customer data')
      console.error('Initialization error:', error)
    }
  })

  // Filter cities based on selected province
  const filteredCities = (provinceId) => {
    if (!provinceId || !cities.value) return []
    return cities.value.filter((city) => city.provinceId === provinceId)
  }

  // Add new address
  async function addNewAddress(makeDefault = false) {
    isAddressLoading.value = true
    try {
      const newAddress = {
        id: Date.now().toString(),
        province: null,
        city: null,
        street: '',
        building: '',
        floor: '',
        apartment: '',
        postalCode: '',
        isDefault: makeDefault
      }

      // Add to local state
      customer.value.addresses.push(newAddress)

      // Sync with store if customer exists
      if (customer.value.id) {
        await customerStore.addAddress(customer.value.id, {
          ...newAddress,
          province: newAddress.province
            ? { id: newAddress.province.id, name: newAddress.province.name }
            : null,
          city: newAddress.city
            ? { id: newAddress.city.id, name: newAddress.city.name }
            : null
        })
      }
    } catch (error) {
      toast.error('Failed to add address')
      console.error(error)
      // Rollback if error
      if (customer.value.addresses.length > 0) {
        customer.value.addresses.pop()
      }
    } finally {
      isAddressLoading.value = false
    }
  }

  // Remove address
  async function removeAddress(index) {
    if (customer.value.addresses.length <= 1) {
      toast.warning('Cannot remove the last address')
      return
    }

    isAddressLoading.value = true
    try {
      const addressId = customer.value.addresses[index].id
      const wasDefault = customer.value.addresses[index].isDefault

      // Remove from local state
      customer.value.addresses.splice(index, 1)

      // Sync with store
      if (customer.value.id) {
        await customerStore.deleteAddress(customer.value.id, addressId)
      }

      // Set new default if needed
      if (wasDefault && customer.value.addresses.length > 0) {
        await setDefaultAddress(0)
      }
    } catch (error) {
      toast.error('Failed to remove address')
      console.error(error)
    } finally {
      isAddressLoading.value = false
    }
  }

  // Set default address
  async function setDefaultAddress(index) {
    try {
      const addressId = customer.value.addresses[index].id

      // Update local state
      customer.value.addresses.forEach((addr, i) => {
        addr.isDefault = i === index
      })

      // Sync with store
      if (customer.value.id) {
        await customerStore.updateAddress(customer.value.id, addressId, {
          isDefault: true
        })
      }
    } catch (error) {
      toast.error('Failed to set default address')
      console.error(error)
    }
  }

  // Save operations
  async function saveCustomer() {
    isSaving.value = true
    try {
      // Validate before saving
      if (
        !customer.value.firstName ||
        !customer.value.lastName ||
        !customer.value.email
      ) {
        throw new Error('Please fill in all required fields')
      }

      for (const addr of customer.value.addresses) {
        if (!addr.street || !addr.province || !addr.city) {
          throw new Error('Please fill in all address fields')
        }
      }

      await customerStore.updateCustomer(customer.value.id, customer.value)
      toast.success('Customer saved successfully')
      location.href = '/customers'
      return true
    } catch (error) {
      toast.error(error.message || 'Failed to save customer')
      console.error(error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  function saveAndBack() {
    saveCustomer().then((success) => {
      if (success) router.push('/customers')
    })
  }
</script>

<style scoped>
  .v-card {
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  /* Slide-fade transition for addresses */
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }
</style>
