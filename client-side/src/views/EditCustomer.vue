<template>
  <v-container fluid>
    <v-card :dir="locale">
      <v-card-title class="d-flex align-center" :class="{ 'flex-row-reverse': locale === 'ar' }">
        <v-btn icon @click="saveAndBack" :class="locale === 'ar' ? 'ml-5' : 'mr-5'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        {{ $t('editCustomer') }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="saveCustomer">
          <!-- Personal Information Section -->
          <v-card class="mb-4" elevation="1" v-if="customer">
            <v-card-title>{{ $t('personalInformation') }}</v-card-title>
            <v-card-text>
              <v-row :class="{ 'flex-row-reverse': locale === 'ar' }">
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.firstName"
                    :label="$t('firstName')"
                    :rules="[required]"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.lastName"
                    :label="$t('lastName')"
                    :rules="[required]"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.email"
                    :label="$t('email')"
                    type="email"
                    :rules="[required, emailRule]"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.mobile"
                    :label="$t('phoneNumber')"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="customer.customerTier"
                    :items="tierOptions"
                    :item-title="item => $t(item)"
                    :label="$t('tier')"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="customer.state"
                    :items="stateOptions"
                    :item-title="item => $t(item)"
                    :label="$t('status')"
                    :dir="locale"
                  />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="customer.tags"
                    :items="commonTags"
                    :label="$t('tags')"
                    multiple
                    chips
                    :dir="locale"
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
              <v-card-title class="d-flex justify-space-between" :class="{ 'flex-row-reverse': locale === 'ar' }">
                <div class="d-flex align-center" :class="{ 'flex-row-reverse': locale === 'ar' }">
                  <v-icon left>mdi-map-marker</v-icon>
                  {{ $t('address') }} {{ index + 1 }}
                </div>
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
                <v-row :class="{ 'flex-row-reverse': locale === 'ar' }">
                  <v-col cols="12" md="6">
                   <!-- In template address rendering -->
<v-select
  v-model="address.province"
  :items="provinces"
  :label="$t('province')"
  item-title="name"
  item-value="id"
  return-object
  :dir="locale"
  @update:model-value="address.city = null"
  :error="!address.province"
  :error-messages="address.province ? undefined : $t('invalidProvince')"
/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="address.city"
                      :items="filteredCities(address.province?.id)"
                      :label="$t('city')"
                      item-title="name"
                      item-value="id"
                      return-object
                      :disabled="!address.province"
                      :dir="locale"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="address.street"
                      :label="$t('streetAddress')"
                      :dir="locale"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="address.building" :label="$t('building')" :dir="locale" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="address.floor" :label="$t('floor')" :dir="locale" />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="address.apartment"
                      :label="$t('apartment')"
                      :dir="locale"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="address.postalCode"
                      :label="$t('postalCode')"
                      :dir="locale"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-checkbox
                      v-model="address.isDefault"
                      :label="$t('defaultAddress')"
                      @change="setDefaultAddress(index)"
                      :dir="locale"
                      :class="{ 'v-checkbox--reversed': locale === 'ar' }"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </transition-group>

          <v-btn @click="addNewAddress" color="primary" class="mb-4" :dir="locale">
            <v-icon left>mdi-plus</v-icon>
            {{ $t('addNewAddress') }}
          </v-btn>

          <!-- Communication Preferences -->
          <v-card class="mb-4" elevation="1" v-if="customer.communicationPreferences">
            <v-card-title>{{ $t('communicationPreferences') }}</v-card-title>
            <v-card-text>
              <v-row :class="{ 'flex-row-reverse': locale === 'ar' }">
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.email"
                    :label="$t('email')"
                    :dir="locale"
                    :class="{ 'v-checkbox--reversed': locale === 'ar' }"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.sms"
                    :label="$t('sms')"
                    :dir="locale"
                    :class="{ 'v-checkbox--reversed': locale === 'ar' }"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-checkbox
                    v-model="customer.communicationPreferences.whatsapp"
                    :label="$t('whatsapp')"
                    :dir="locale"
                    :class="{ 'v-checkbox--reversed': locale === 'ar' }"
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
            :dir="locale"
          >
            {{ $t('saveChanges') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '../store/customers'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()
const toast = useToast()

// Customer data structure with default values
const customer = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  state: 'active',       // Using state consistently throughout
  customerTier: 'basic', // Using customerTier consistently throughout
  addresses: [],
  tags: [],
  communicationPreferences: {
    email: true,
    sms: false,
    whatsapp: false
  }
})

const isSaving = ref(false)
const stateOptions = ['active', 'blocked']
const tierOptions = ['basic', 'silver', 'gold', 'platinum']
const commonTags = ['VIP', 'Frequent Buyer', 'New', 'At Risk', 'Wholesale']

// Validation rules
const required = (value) => !!value || t('requiredField')
const emailRule = (value) => /.+@.+\..+/.test(value) || t('invalidEmail')

// Component initialization
onMounted(async () => {
  try {
    if (!route.params.id) {
      toast.error(t('noCustomerId'))
      return router.back()
    }

    await customerStore.fetchCustomerById(route.params.id)
    const existingCustomer = customerStore.currentCustomer
    
    if (!existingCustomer) {
      toast.error(t('customerNotFound'))
      return router.back()
    }

    // Transform API data to UI format with safeguards for empty addresses
    customer.value = {
      ...existingCustomer,
      // Make sure state is properly set
      state: existingCustomer.state || 'active',
      // Make sure customerTier is properly set
      customerTier: existingCustomer.customerTier || 'basic', 
      // Handle addresses with proper error checking
      addresses: Array.isArray(existingCustomer.addresses) && existingCustomer.addresses.length > 0 
        ? existingCustomer.addresses.map(addr => ({
            ...addr,
            // Convert string IDs to numbers for matching with store data
            // Use optional chaining and nullish coalescing to prevent errors
            province: addr.provinceId ? customerStore.provinces.find(p => p.id === Number(addr.provinceId)) || null : null,
            city: addr.cityId ? customerStore.cities.find(c => c.id === Number(addr.cityId)) || null : null
          }))
        : []
    }

    // Ensure there's at least one address
    if (customer.value.addresses.length === 0) {
      addNewAddress(true)
    }
  } catch (error) {
    toast.error(t('failedToLoadCustomer'))
    console.error('Initialization error:', error)
  }
})

// Address management
const addNewAddress = (makeDefault = false) => {
  customer.value.addresses.push({
    id: Date.now().toString(),
    province: null,
    city: null,
    street: '',
    building: '',
    floor: '',
    apartment: '',
    postalCode: '',
    isDefault: makeDefault
  })
}

const removeAddress = (index) => {
  if (customer.value.addresses.length <= 1) {
    return toast.warning(t('cannotRemoveLastAddress'))
  }
  customer.value.addresses.splice(index, 1)
}

// Update setDefaultAddress method
const setDefaultAddress = (index) => {
  if (customer.value.addresses[index].isDefault) {
    customer.value.addresses.forEach((addr, i) => {
      addr.isDefault = i === index
    })
  }
}

// Get provinces and cities from store
const provinces = computed(() => customerStore.provinces || [])
const cities = computed(() => customerStore.cities || [])

// Computed properties for filtering cities
const filteredCities = (provinceId) => {
  if (!provinceId) return []
  return customerStore.cities.filter(c => c.provinceId === provinceId)
}

// Save handler with improved error checking
const saveCustomer = async () => {
  isSaving.value = true
  try {
    if (!customer.value.firstName || !customer.value.lastName || !customer.value.email) {
      throw new Error(t('fillRequiredFields'))
    }

    // Verify at least one address has province and city
    const hasValidAddress = customer.value.addresses.some(addr => 
      addr.province?.id && addr.city?.id
    )
    
    if (!hasValidAddress && customer.value.addresses.length > 0) {
      throw new Error(t('atLeastOneValidAddress'))
    }

    // Prepare data for the API with proper mapping
    const customerData = {
      ...customer.value,
      addresses: customer.value.addresses.map(addr => ({
        ...addr,
        provinceId: addr.province?.id || null,
        cityId: addr.city?.id || null,
        // Remove objects that will cause circular references
        province: undefined,
        city: undefined
      })),
      // Explicitly include these to ensure they're saved properly
      customerTier: customer.value.customerTier,
      state: customer.value.state
    }

    await customerStore.updateCustomer(customer.value.id || customer.value._id, customerData)

    toast.success(t('customerSaved'))
    router.push('/customers')
    return true
  } catch (error) {
    toast.error(error.message || t('failedToSaveCustomer'))
    console.error(error)
    return false
  } finally {
    isSaving.value = false
  }
}

// Save and navigate back
const saveAndBack = () => {
  saveCustomer().then(success => {
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

/* RTL adjustments */
[dir="rtl"] .v-input__control {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .v-label {
  right: 0;
  left: auto;
}

.v-checkbox--reversed :deep(.v-selection-control) {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.v-checkbox--reversed :deep(.v-label) {
  padding-left: 0;
  padding-right: 12px;
}
</style>