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
                    <v-select
                      v-model="address.province"
                      :items="provinces"
                      :label="$t('province')"
                      item-title="name"
                      item-value="id"
                      return-object
                      :dir="locale"
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

// Customer data structure
const customer = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  state: 'active',
  status: 'pending', 
  customerTier: 'basic', 
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

    // Transform API data to UI format
    customer.value = {
  ...existingCustomer,
  state: existingCustomer.state,
  status: existingCustomer.status,
  customerTier: existingCustomer.customerTier,
  addresses: (existingCustomer.addresses || []).map(addr => ({
    ...addr,
    province: customerStore.provinces.find(p => p.id === Number(addr.provinceId)),
    city: customerStore.cities.find(c => c.id === Number(addr.cityId))
  })),
  communicationPreferences: {
    email: existingCustomer.communicationPreferences?.email || false,
    sms: existingCustomer.communicationPreferences?.sms || false,
    whatsapp: existingCustomer.communicationPreferences?.whatsapp || false
  }
}


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

const setDefaultAddress = (index) => {
  customer.value.addresses.forEach((addr, i) => {
    addr.isDefault = i === index
  })
}

// Save handler
const saveCustomer = async () => {
  isSaving.value = true
  try {
    // Validation
    if (!customer.value.firstName || !customer.value.lastName || !customer.value.email) {
      throw new Error(t('fillRequiredFields'))
    }

    // Transform data for API
    const customerData = {
      ...customer.value,
      addresses: customer.value.addresses.map(addr => ({
        ...addr,
        provinceId: addr.province?.id,
        cityId: addr.city?.id,
        // Remove object properties
        province: undefined,
        city: undefined
      }))
    }

    await customerStore.updateCustomer(customer.value.id, customerData)
    toast.success(t('customerSaved'))
    router.push('/customers')
  } catch (error) {
    toast.error(error.message || t('failedToSaveCustomer'))
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

// Computed properties
const filteredCities = computed(() => (provinceId) => {
  return customerStore.cities.filter(c => c.provinceId === provinceId)
})

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