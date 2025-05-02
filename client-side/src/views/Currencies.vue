<script setup>
import { ref, onMounted } from 'vue'
import { useCurrencyStore } from '../store/useCurrencyStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useToast } from 'vue-toastification'
import {
  VCard, VCardTitle, VCardText,
  VDataTable, VBtn, VDialog, VForm,
  VTextField, VProgressCircular
} from 'vuetify/components'

const currencyStore = useCurrencyStore()
const settingsStore = useSettingsStore()
const toast = useToast()

// Modal
const dialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const editedCurrency = ref({
  code: '',
  name: '',
  symbol: '',
  exchange_rate: ''
})

// Open form
const openDialog = (currency = null) => {
  if (currency) {
    isEdit.value = true
    editedCurrency.value = { ...currency }
  } else {
    isEdit.value = false
    editedCurrency.value = {
      code: '',
      name: '',
      symbol: '',
      exchange_rate: ''
    }
  }
  dialog.value = true
}

// Save
const saveCurrency = async () => {
  if (!formRef.value.validate()) return

  currencyStore.loading = true // Enable loading during save

  try {
    if (isEdit.value) {
      await currencyStore.updateCurrency(editedCurrency.value._id, editedCurrency.value)
      toast.success('Currency updated')
    } else {
      await currencyStore.addCurrency(editedCurrency.value)
      toast.success('Currency added')
    }
  } catch (error) {
    toast.error('Failed to save currency')
  } finally {
    currencyStore.loading = false // Disable loading after save
    dialog.value = false
  }
}

// Delete
const deleteCurrency = async (id) => {
  currencyStore.loading = true // Enable loading during delete

  try {
    await currencyStore.deleteCurrency(id)
    toast.success('Currency deleted')
  } catch (error) {
    toast.error('Failed to delete currency')
  } finally {
    currencyStore.loading = false // Disable loading after delete
  }
}

onMounted(() => {
  currencyStore.fetchCurrencies()
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      Currencies
      <v-btn color="primary" @click="openDialog()">Add Currency</v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Wait for currencies to be loaded, show loading state until they are -->
      <v-data-table
        v-if="!currencyStore.loading && currencyStore.currencies.length > 0"
        :headers="[ 
          { text: 'Code', value: 'code' }, 
          { text: 'Name', value: 'name' }, 
          { text: 'Symbol', value: 'symbol' }, 
          { text: 'Exchange Rate', value: 'exchange_rate' }, 
          { text: 'Actions', value: 'actions', sortable: false }
        ]"
        :items="currencyStore.currencies"
        class="elevation-1"
      >
        <template #item.actions="{ item }">
          <v-btn size="small" @click="openDialog(item)">Edit</v-btn>
          <v-btn size="small" color="error" @click="deleteCurrency(item._id)">Delete</v-btn>
        </template>
      </v-data-table>

      <!-- Loading indicator while currencies are being fetched -->
      <v-progress-circular
        v-if="currencyStore.loading"
        indeterminate
        color="primary"
        size="64"
        class="ma-auto"
      ></v-progress-circular>

      <!-- No currencies message if the list is empty -->
      <div v-if="!currencyStore.loading && currencyStore.currencies.length === 0">
        No currencies available
      </div>
    </v-card-text>
  </v-card>

  <!-- Modal -->
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>
        {{ isEdit ? 'Edit Currency' : 'Add Currency' }}
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" lazy-validation>
          <v-text-field v-model="editedCurrency.code" label="Code" required></v-text-field>
          <v-text-field v-model="editedCurrency.name" label="Name" required></v-text-field>
          <v-text-field v-model="editedCurrency.symbol" label="Symbol" required></v-text-field>
          <v-text-field
            v-model="editedCurrency.exchange_rate"
            label="Exchange Rate"
            type="number"
            required
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn text @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="saveCurrency">{{ isEdit ? 'Update' : 'Save' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
