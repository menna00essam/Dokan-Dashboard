<template>
  <v-container fluid :dir="locale === 'ar' ? 'rtl' : 'ltr'">
    <!-- Search and Filters -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row :class="{ 'flex-row-reverse': locale === 'ar' }">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="customerStore.searchQuery"
              :label="t('searchCustomers')"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              :dir="locale"
              @update:modelValue="handleSearch"
              />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.statusFilter"
              :items="statusOptions"
              :label="t('state')"
              clearable
              hide-details
              :dir="locale"
              @update:modelValue="refreshData"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.tierFilter"
              :items="tierOptions"
              :label="t('customerTier')"
              clearable
              hide-details
              :dir="locale"
              @update:modelValue="refreshData"
            />
          </v-col>

          <v-col cols="6" md="2">
            <v-select
              v-model="customerStore.sortBy"
              :items="sortOptions"
              :label="t('sortBy')"
              hide-details
              :dir="locale"
              @update:modelValue="refreshData"
            />
          </v-col>

          <v-col cols="6" md="2" class="d-flex align-center">
            <v-btn color="secondary" class="pa-6" @click="resetAll" block>
              {{ t('reset') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Action Toolbar -->
    <div
      class="d-flex align-center mb-4"
      :class="{ 'flex-row-reverse': locale === 'ar' }"
    >
      <v-btn
        class="mr-3"
        variant="tonal"
        color="orange"
        :variant="selected.length ? 'flat' : 'outlined'"
      >
        {{ t('selected', { count: selected.length }) }}
      </v-btn>

      <v-menu :disabled="!selected.length">
        <template v-slot:activator="{ props }">
          <v-btn
            color="secondary"
            variant="tonal"
            v-bind="props"
            prepend-icon="mdi-tune"
            class="mr-2"
            :disabled="!selected.length"
          >
            {{ t('bulkActions') }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            @click="bulkUpdateStatus('active')"
            prepend-icon="mdi-account-check"
          >
            <v-list-item-title>{{ t('markAsActive') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            @click="bulkUpdateStatus('blocked')"
            prepend-icon="mdi-account-cancel"
          >
            <v-list-item-title>{{ t('markAsBlocked') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        color="error"
        variant="tonal"
        prepend-icon="mdi-delete"
        @click="deleteConfirmDialog.open()"
        :loading="isDeleting"
        :disabled="!selected.length"
      >
        {{ t('delete') }}
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-data-table
      :headers="enhancedHeaders"
      :items="customerStore.customers"
      :items-per-page="customerStore.itemsPerPage"
      v-model="selected"
      show-select
      item-value="id"
      class="elevation-1"
      :loading="customerStore.loading"
      hide-default-footer
      @click:row="(event, { item }) => viewCustomerDetails(item.id)"
    >
      <!-- Table Content Templates -->
      <template #item.fullname="{ item }">
        <div
          class="d-flex align-center"
          :class="{ 'flex-row-reverse': locale === 'ar' }"
        >
          <v-avatar size="36" class="mr-2">
            <v-img :src="item.avatar || defaultAvatar" />
          </v-avatar>
          {{ item.firstName }} {{ item.lastName }}
        </div>
      </template>

      <template #item.tier="{ item }">
        <v-chip :color="getTierColor(item.customerTier)" size="small">
          {{ formatTier(item.customerTier) }}
        </v-chip>
      </template>

      <template #item.status="{ item }">
        <v-chip
          :color="item.state === 'active' ? 'success' : 'error'"
          size="small"
        >
          {{ t(item.state) }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <div
          class="d-flex align-center"
          :class="{ 'flex-row-reverse': locale === 'ar' }"
        >
          <v-btn
            icon
            size="small"
            color="info"
            class="mr-2"
            @click.stop="editCustomer(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            color="error"
            @click.stop="deleteSingleCustomer(item.id)"
            :loading="isDeleting && customerToDelete === item.id"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <!-- Pagination -->
    <PaginationControls
      :key="`pagination-${customerStore.currentPage}-${customerStore.itemsPerPage}`"
      :page="customerStore.currentPage"
      :items-per-page="customerStore.itemsPerPage"
      :total-items="customerStore.total"
      @update:page="handlePageChange"
      @update:items-per-page="handleItemsPerPageChange"
      :loading="customerStore.loading"
    />

    <!-- Confirm Dialogs -->
    <ConfirmDialog
      ref="deleteConfirmDialog"
      :title="t('confirmDeletion')"
      :message="deleteMessage"
      :confirm-text="t('delete')"
      confirm-color="error"
      @confirm="confirmDelete"
    />

    <ConfirmDialog
      ref="singleDeleteDialog"
      :title="t('confirmDeletion')"
      :message="t('deleteCustomerConfirm', { count: 1 })"
      :confirm-text="t('delete')"
      confirm-color="error"
      @confirm="confirmSingleDelete"
    />
  </v-container>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useCustomerStore } from '../store/customers'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useToast } from 'vue-toastification'
  import ConfirmDialog from '../components/Shared/ConfirmDialog.vue'
  import PaginationControls from '../components/Shared/PaginationControls.vue'

  const { t, locale } = useI18n()
  const toast = useToast()
  const router = useRouter()
  const customerStore = useCustomerStore()

  const selected = ref([])
  const isDeleting = ref(false)
  const customerToDelete = ref(null)
  const deleteConfirmDialog = ref(null)
  const singleDeleteDialog = ref(null)

  const defaultAvatar = 'https://cdn.vuetifyjs.com/images/profiles/male1.jpg'

  const statusOptions = [
  { value: 'all', title: t('all') },
  ...['active', 'blocked'].map((state) => ({
    value: state,
    title: t(state)
  }))
]

const tierOptions = [
  { value: 'all', title: t('all') }, 
  ...['basic', 'silver', 'gold', 'platinum'].map(
    (customerTier) => ({
      value: customerTier,
      title: t(customerTier)
    })
  )
]

  const resetAll = async () => {
    customerStore.resetFilters()
    await refreshData()
    toast.success(t('filtersReset'))
  }
  const handlePageChange = async (newPage) => {
  if (newPage === customerStore.currentPage) return;
  try {
    console.log('Changing to page:', newPage);
    await customerStore.fetchCustomers(newPage);
  } catch (error) {
    console.error('Page change error:', error);
    toast.error(t('pageChangeError'));
  }
};

const handleItemsPerPageChange = async (newSize) => {
  console.log('Changing items per page to:', newSize);
  customerStore.itemsPerPage = newSize;
  customerStore.currentPage = 1;
  await customerStore.fetchCustomers();
};

const refreshData = async () => {
  customerStore.currentPage = 1;
  await customerStore.fetchCustomers();
};
const handleSearch = (value) => {
  // Reset filters to 'all' when searching
  customerStore.statusFilter = 'all'
  customerStore.tierFilter = 'all'
  // Trigger data refresh
  refreshData()
}
  const sortOptions = [
    { value: 'name', title: t('name') },
    { value: 'joinDate', title: t('joinDate') },
    { value: 'totalSpent', title: t('totalSpent') }
  ]

  const enhancedHeaders = computed(() => [
    { title: t('customer'), key: 'fullname', sortable: true },
    { title: t('email'), key: 'email' },
    { title: t('phone'), key: 'mobile' },
    { title: t('customerTier'), key: 'customerTier', sortable: true },
    { title: t('state'), key: 'state' },
    { title: t('actions'), key: 'actions', sortable: false }
  ])

  const deleteMessage = computed(() =>
    t('deleteCustomerConfirm', { count: selected.value.length })
  )

  onMounted(async () => {
    await customerStore.fetchCustomers()
  })


  // const handlePageChange = async (newPage) => {
  //   await customerStore.fetchCustomers(newPage)
  // }

  const viewCustomerDetails = (id) => {
    router.push(`/customers/${id}`)
  }

  const editCustomer = (customer) => {
    router.push(`/customers/edit/${customer.id}`)
  }

  const deleteSingleCustomer = (id) => {
    customerToDelete.value = id
    singleDeleteDialog.value.open()
  }

  const confirmSingleDelete = async () => {
    isDeleting.value = true
    try {
      const success = await customerStore.deleteCustomer(customerToDelete.value)
      if (success) {
        await customerStore.fetchCustomers(customerStore.currentPage)
      }
    } finally {
      isDeleting.value = false
      customerToDelete.value = null
    }
  }

  const confirmDelete = async () => {
    isDeleting.value = true
    try {
      const success = await customerStore.bulkDeleteCustomers(selected.value)
      if (success) {
        await customerStore.fetchCustomers(customerStore.currentPage)
        selected.value = []
      }
    } finally {
      isDeleting.value = false
    }
  }

  const bulkUpdateStatus = async (state) => {
    try {
      // You'll need to implement this function in your store
      await customerStore.bulkUpdateStatus(selected.value, state)
      await customerStore.fetchCustomers(customerStore.currentPage)
      selected.value = []
      toast.success(t('statusUpdated', { count: selected.value.length }))
    } catch (error) {
      toast.error(t('updateError'))
    }
  }

  const formatTier = (customerTier) => {
    if (!customerTier) return t('unknown')
    return t(customerTier)
  }

  const getTierColor = (customerTier) => {
    const colors = {
      basic: 'grey',
      silver: 'blue-grey',
      gold: 'amber',
      platinum: 'blue'
    }
    return colors[customerTier] || 'primary'
  }
</script>

<style scoped>
  [dir='rtl'] .v-data-table-header th {
    text-align: right;
  }
  [dir='rtl'] .v-btn__prepend {
    margin-right: 0;
    margin-left: 8px;
  }
  .v-avatar {
    flex-shrink: 0;
  }
  [dir='rtl'] .v-list-item__prepend {
    margin-right: 0;
    margin-left: 16px;
  }
  [dir='rtl'] .v-text-field .v-input__control {
    direction: rtl;
  }
  [dir='rtl'] .v-text-field .v-label {
    right: 0;
    left: auto;
    transform-origin: top right;
  }
  [dir='rtl'] .v-select .v-select__selection {
    direction: rtl;
    text-align: right;
  }
</style>
