<template>
  <v-dialog v-model="internalDialog" max-width="800">
    <v-card>
      <v-card-title class="text-h5 font-weight-bold">
        {{ mode === 'add' ? 'Add a New Customer' : 'Edit Customer' }}
      </v-card-title>
      <v-card-subtitle class="mb-4">Customer Information</v-card-subtitle>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.firstName"
              label="First Name"
              :rules="[required]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.lastName"
              label="Last Name"
              :rules="[required]"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          :rules="[required, emailRule]"
        />

        <div class="d-flex align-center">
          <v-select
            v-model="form.countryCode"
            :items="countries"
            item-title="label"
            item-value="code"
            label="Country"
            dense
            style="max-width: 150px"
            :rules="[required]"
          />
          <v-text-field
            v-model="form.mobile"
            label="Mobile Number"
            class="ml-3"
            style="flex: 1"
            :prefix="form.countryCode || ''"
            :rules="[required]"
          />
        </div>

        <v-switch
          v-model="form.isBlocked"
          label="Block this customer"
          color="error"
          class="mt-4"
        />

        <v-switch
          v-model="showAddress"
          label="Add Address"
          color="primary"
          class="mt-4"
        />

        <div v-if="showAddress">
          <v-subheader class="pl-0">Customer Address</v-subheader>
          <v-text-field v-model="form.address.street" label="Street" />
          <v-text-field v-model="form.address.city" label="City" />
          <v-text-field v-model="form.address.state" label="State" />
          <v-text-field v-model="form.address.zipCode" label="Zip Code" />

          <v-switch
            v-model="sameAsCustomer"
            label="Billing address same as customer address"
            color="secondary"
            class="mt-3"
          />

          <div v-if="!sameAsCustomer">
            <v-divider class="my-3" />
            <v-subheader class="pl-0">Billing Address</v-subheader>
            <v-text-field v-model="form.billingAddress.street" label="Street" />
            <v-text-field v-model="form.billingAddress.city" label="City" />
            <v-text-field v-model="form.billingAddress.state" label="State" />
            <v-text-field
              v-model="form.billingAddress.zipCode"
              label="Zip Code"
            />
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="d-flex justify-start">
        <v-btn
          variant="tonal"
          color="primary"
          @click="handleSubmit"
          :disabled="!isFormValid"
          style="height: 50px; border-radius: 12px;"
        >
          {{ mode === 'add' ? 'Add' : 'Save' }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          @click="handleCancel"
          class="ml-2"
          style="height: 50px; border-radius: 12px;"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({ 
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'add',
    validator: value => ['add', 'edit'].includes(value)
  },
  customer: Object
})

const emit = defineEmits(['update:modelValue', 'save'])

const internalDialog = ref(props.modelValue)
watch(internalDialog, val => emit('update:modelValue', val))
watch(() => props.modelValue, val => (internalDialog.value = val))

const countries = [
  { label: 'Egypt +20', code: '+20' },
  { label: 'Saudi Arabia +966', code: '+966' },
  { label: 'UAE +971', code: '+971' },
  { label: 'USA +1', code: '+1' },
  { label: 'UK +44', code: '+44' }
]

const showAddress = ref(false)
const sameAsCustomer = ref(true)

const form = ref({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+20',
  mobile: '',
  isBlocked: false,
  address: { street: '', city: '', state: '', zipCode: '' },
  billingAddress: { street: '', city: '', state: '', zipCode: '' }
})

// Watch for customer prop changes (for edit mode)
watch(() => props.customer, (customer) => {
  if (customer) {
    form.value = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      countryCode: customer.mobile?.startsWith('+') 
        ? customer.mobile.substring(0, 3) 
        : '+20',
      mobile: customer.mobile?.startsWith('+') 
        ? customer.mobile.substring(3) 
        : customer.mobile,
      isBlocked: customer.isBlocked || false,
      address: customer.address?.[0]?.text 
        ? { 
            street: customer.address[0].text,
            city: customer.address[0].city?.name || '',
            state: customer.address[0].province?.name || '',
            zipCode: ''
          }
        : { street: '', city: '', state: '', zipCode: '' },
      billingAddress: { street: '', city: '', state: '', zipCode: '' }
    }
    showAddress.value = !!customer.address?.[0]?.text
  }
}, { immediate: true })

const required = v => !!v || 'This field is required'
const emailRule = v => /.+@.+\..+/.test(v) || 'E-mail must be valid'

const isFormValid = computed(() => {
  return form.value.firstName && 
         form.value.lastName && 
         form.value.email && 
         form.value.countryCode &&
         form.value.mobile
})

function reset() {
  form.value = {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+20',
    mobile: '',
    isBlocked: false,
    address: { street: '', city: '', state: '', zipCode: '' },
    billingAddress: { street: '', city: '', state: '', zipCode: '' }
  }
  showAddress.value = false
  sameAsCustomer.value = true
}

function handleCancel() {
  internalDialog.value = false
  reset()
}

function handleSubmit() {
  const customerData = { 
    ...form.value,
    mobile: form.value.countryCode + form.value.mobile
  }
  
  if (!showAddress.value) {
    delete customerData.address
    delete customerData.billingAddress
  } else if (sameAsCustomer.value) {
    customerData.billingAddress = { ...customerData.address }
  }
  
  emit('save', customerData)
  handleCancel()
}
</script>