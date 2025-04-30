<template>
  <div>
    <!-- Action Toolbar -->
    <div class="d-flex justify-space-between mb-4">
      <div class="d-flex">
        <!-- Bulk Actions -->
        <v-menu v-if="selected.length">
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              v-bind="props"
              prepend-icon="mdi-cog"
              class="mr-2"
            >
              Bulk Actions
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="bulkUpdateStatus('active')">
              <v-list-item-title>Mark as Active</v-list-item-title>
            </v-list-item>
            <v-list-item @click="bulkUpdateStatus('blocked')">
              <v-list-item-title>Mark as Blocked</v-list-item-title>
            </v-list-item>
            <v-list-item @click="addTagsToSelected">
              <v-list-item-title>Add Tags</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Delete Selected -->
      <v-btn
        v-if="selected.length"
        color="error"
        @click="confirmDeleteDialog = true"
        prepend-icon="mdi-delete"
      >
        Delete ({{ selected.length }})
      </v-btn>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="customerStore.searchQuery"
              label="Search customers"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.statusFilter"
              :items="statusOptions"
              label="Status"
              clearable
              hide-details
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.tierFilter"
              :items="tierOptions"
              label="Tier"
              clearable
              hide-details
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.sortBy"
              :items="sortOptions"
              label="Sort By"
              hide-details
            />
          </v-col>
          
          <v-col cols="6" md="2">
            <v-btn
              color="primary"
              @click="customerStore.resetFilters"
              block
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Data Table -->
    <v-data-table
      :headers="enhancedHeaders"
      :items="customerStore.filteredCustomers"
      :items-per-page="customerStore.itemsPerPage"
      v-model:page="customerStore.currentPage"
      v-model="selected"
      show-select
      item-value="id"
      class="elevation-1"
      @click:row="viewCustomerDetails"
    >
      <!-- Custom Columns -->
      <template #item.fullname="{ item }">
        <div class="d-flex align-center">
          <v-avatar size="36" class="mr-2">
            <v-img :src="item.avatar || defaultAvatar" />
          </v-avatar>
          {{ item.firstName }} {{ item.lastName }}
        </div>
      </template>

      <template #item.tier="{ item }">
        <v-chip :color="getTierColor(item.tier)" size="small">
          {{ formatTier(item.tier) }}
        </v-chip>
      </template>

      <template #item.tags="{ item }">
        <v-chip
          v-for="tag in item.tags.slice(0, 2)"
          :key="tag"
          size="small"
          class="mr-1 mb-1"
        >
          {{ tag }}
          <v-tooltip activator="parent" location="top">
            {{ item.tags.join(', ') }}
          </v-tooltip>
        </v-chip>
        <v-chip v-if="item.tags.length > 2" size="small">+{{ item.tags.length - 2 }}</v-chip>
      </template>

      <template #item.totalSpent="{ item }">
        {{ formatCurrency(item.totalSpent) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon
          size="small"
          color="info"
          @click.stop="viewCustomerDetails(item)"
        >
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          color="primary"
          @click.stop="editCustomer(item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Customer Dialog -->
    <CustomerDialog
      v-model="dialog"
      :mode="dialogMode"
      :customer="selectedCustomer"
      @save="handleSave"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="confirmDeleteDialog" max-width="500">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete {{ selected.length }} selected customers?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Tag Dialog -->
    <v-dialog v-model="tagDialog" max-width="500">
      <v-card>
        <v-card-title>Add Tags to Selected Customers</v-card-title>
        <v-card-text>
          <v-combobox
            v-model="selectedTags"
            label="Tags"
            multiple
            chips
            :items="commonTags"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="tagDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="applyTags">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomerStore } from '../store/customers'
import { useRouter } from 'vue-router'
import CustomerDialog from '../components/Customers/CustomerDialog.vue'
// import { exportToCSV } from '@/utils/export'

const router = useRouter()
const customerStore = useCustomerStore()

// Data
const dialog = ref(false)
const dialogMode = ref('add')
const selectedCustomer = ref(null)
const selected = ref([])
const confirmDeleteDialog = ref(false)
const tagDialog = ref(false)
const selectedTags = ref([])

// Constants
const defaultAvatar = 'https://cdn.vuetifyjs.com/images/profiles/male1.jpg'
const statusOptions = ['active', 'blocked']
const tierOptions = ['basic', 'silver', 'gold', 'platinum']
const sortOptions = [
  { value: 'name', title: 'Name' },
  { value: 'joinDate', title: 'Join Date' },
  { value: 'totalSpent', title: 'Total Spent' },
  { value: 'lastOrder', title: 'Last Order' }
]
const commonTags = ['VIP', 'Frequent Buyer', 'New', 'At Risk', 'Wholesale']

// Computed
const enhancedHeaders = computed(() => [
  { title: 'Customer', key: 'fullname', sortable: true },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'mobile' },
  { title: 'Tier', key: 'tier', sortable: true },
  { title: 'Tags', key: 'tags' },
  { title: 'Total Spent', key: 'totalSpent', sortable: true },
  { title: 'Orders', key: 'ordersCount', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
])

// Methods
const viewCustomerDetails = (customer) => {
  router.push(`/customers/${customer.id}`)
}

const editCustomer = (customer) => {
  selectedCustomer.value = { ...customer }
  dialogMode.value = 'edit'
  dialog.value = true
}

const handleSave = (customerData) => {
  if (dialogMode.value === 'add') {
    customerStore.addCustomer(customerData)
  } else {
    customerStore.updateCustomer(customerData.id, customerData)
  }
  dialog.value = false
}

const confirmDelete = async () => {
  await customerStore.removeCustomers(selected.value.map(c => c.id))
  selected.value = []
  confirmDeleteDialog.value = false
}

const bulkUpdateStatus = (status) => {
  customerStore.bulkUpdateStatus(selected.value.map(c => c.id), status)
  selected.value = []
}

const addTagsToSelected = () => {
  selectedTags.value = []
  tagDialog.value = true
}

const applyTags = () => {
  selected.value.forEach(customer => {
    const newTags = [...new Set([...customer.tags, ...selectedTags.value])]
    customerStore.updateCustomer(customer.id, { tags: newTags })
  })
  tagDialog.value = false
  selected.value = []
}



const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const getTierColor = (tier) => {
  const colors = {
    basic: 'grey',
    silver: 'blue-grey',
    gold: 'amber',
    platinum: 'blue'
  }
  return colors[tier] || 'primary'
}

const formatTier = (tier) => {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}
</script>

<style scoped>
.v-avatar {
  flex-shrink: 0;
}
</style>