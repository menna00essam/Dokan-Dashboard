<template>
  <v-container fluid>
    <v-card
      flat
      :color="$vuetify.theme.current.dark ? 'primary' : 'white'"
      class="toolbar-container mb-4"
    >
      <div
        class="toolbar-content"
        :class="{
          'desktop-layout': !isMobile,
          'mobile-layout': isMobile
        }"
      >
        <v-col cols="12" md="4" sm="6">
          <v-text-field
            :label="$t('Search Orders')"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            v-model="ordersStore.searchQuery"
            @input="ordersStore.setSearchQuery(ordersStore.searchQuery)"
          />
        </v-col>

        <v-select
          v-model="ordersStore.selectedStatus"
          :items="statusOptions"
          :label="$t('orderHeaders.status')"
          clearable
          hide-details
          class="status-select"
          :class="{
            'mr-3': $i18n.locale === 'ltr' && !isMobile,
            'ml-3': $i18n.locale === 'ar' && !isMobile,
            'mb-3': isMobile
          }"
          :style="{ width: isMobile ? '100%' : '200px' }"
          @update:model-value="ordersStore.setStatusFilter"
        ></v-select>
        <v-col cols="6" md="3" sm="6">
          <v-select
            :items="sortOptions"
            :label="$t('Sort By')"
            hide-details
            v-model="ordersStore.sortBy"
            @update:model-value="handleSortChange"
          />
        </v-col>

        <v-col cols="6" md="2" sm="6" class="d-flex align-center">
          <v-btn
            color="secondary"
            class="pa-6"
            style="font-size: 1.2rem"
            block
            @click="ordersStore.resetFilters()"
          >
            {{ t('Reset') }}
          </v-btn>
        </v-col>
      </div>
    </v-card>

    <!-- Error State -->
    <v-alert v-if="error" type="error" class="mb-4 mx-4">
      {{ error }}
    </v-alert>

    <v-card class="mx-4">
      <v-data-table
        :key="componentKey"
        :headers="headers"
        :items="ordersStore.sortedOrders"
        :loading="isLoading || ordersStore.loading"
        :no-data-text="t('No data available')"
        class="elevation-1"
        hide-default-footer
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
      >
        <template #item.product="{ item }">
          <div class="d-flex align-center ga-2">
            <div class="product-image-wrapper">
              <v-img
                :src="item.orderItems[0]?.selectedColors[0]?.images[0]"
                alt="Product Image"
                cover
                height="40"
                width="40"
              />
            </div>
            <div>
              {{ item.orderItems[0]?.name }}
              <v-tooltip v-if="item.orderItems.length > 1" location="bottom">
                <template #activator="{ props }">
                  <span
                    v-bind="props"
                    class="text-grey-darken-1 text-caption cursor-pointer"
                  >
                    +{{ item.orderItems.length - 1 }} more
                  </span>
                </template>
                <span>
                  {{
                    item.orderItems
                      .slice(1)
                      .map((p) => p.name)
                      .join(', ')
                  }}
                </span>
              </v-tooltip>
            </div>
          </div>
        </template>

        <template #item.user="{ item }">
          <div>{{ item.user?.firstName }} {{ item.user?.lastName }}</div>
        </template>

        <template #item.total="{ item }">${{ item.total }}</template>

        <template #item.date="{ item }">{{
          formatDate(item.createdAt)
        }}</template>

        <template #item.payment="{ item }">
          <div>{{ item.shippingMethod?.name }}</div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" variant="tonal" small>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2">
            <v-btn
              icon="mdi-pencil"
              @click="openEditDialog(item)"
              size="small"
              variant="text"
            />
            <v-btn
              icon="mdi-eye"
              @click="orderDetails(item)"
              size="small"
              variant="text"
            />
            <v-btn
              icon="mdi-delete"
              @click="deleteItem(item)"
              size="small"
              class="text-error"
              variant="text"
            />
          </div>
        </template>

        <template #no-data>
          <div class="py-4 text-center">
            <v-icon size="64" color="grey">mdi-package-variant-remove</v-icon>
            <p class="text-h6 grey--text mt-2">
              {{ t('No orders found') }}
            </p>
          </div>
        </template>
      </v-data-table>

      <PaginationControls
        v-if="ordersStore.totalOrders > 0"
        v-model:page="ordersStore.currentPage"
        v-model:itemsPerPage="ordersStore.itemsPerPage"
        :total-items="ordersStore.totalOrders"
        :direction="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        @update:page="handlePageChange"
        @update:itemsPerPage="handleItemsPerPageChange"
      />
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="420"
      transition="dialog-bottom-transition"
      persistent
    >
      <v-card class="rounded-xl elevation-10 pa-4">
        <v-card-title class="justify-center text-h6 font-weight-bold mb-3">
          <v-icon class="mr-2">mdi-pencil</v-icon>
          {{ t('orderDialog.title') }}
        </v-card-title>

        <v-card-text class="pt-0">
          <v-select
            v-model="selectedStatus"
            :items="
              statuses.map((status) => ({
                title: t(`orderStatus.${status}`),
                value: status
              }))
            "
            :label="t('orderDialog.selectStatus')"
            variant="outlined"
            density="comfortable"
            class="rounded-md"
            hide-details
            clearable
          />
        </v-card-text>

        <v-card-actions class="justify-center pt-4">
          <v-btn
            color="grey-darken-1"
            variant="text"
            class="rounded-pill px-5"
            @click="dialog = false"
          >
            {{ t('orderDialog.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="rounded-pill px-5"
            @click="saveStatus"
          >
            {{ t('orderDialog.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      ref="confirmDialog"
      :title="t('Confirm Delete')"
      :message="t('deletemessage')"
      :confirm-text="t('Delete')"
      :cancel-text="t('Cancel')"
      confirm-color="error"
      @confirm="handleConfirmDelete"
    />
  </v-container>
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useOrderStore } from '../store/order'
  import router from '../router'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import ConfirmDialog from '../components/Shared/ConfirmDialog.vue'
  import PaginationControls from '../components/Shared/PaginationControls.vue'

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)
  const ordersStore = useOrderStore()
  const { t } = useI18n()

  // State
  const isLoading = ref(true)
  const error = ref(null)
  const dialog = ref(false)
  const selectedStatus = ref('')
  const currentItem = ref(null)
  const confirmDialog = ref(null)
  const itemToDelete = ref(null)
  const componentKey = ref(0)

  const statuses = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled'
  ]

  const statusOptions = computed(() => [
    { value: 'All', title: t('orderStatus.All') },
    { value: 'Pending', title: t('orderStatus.Pending') },
    { value: 'Processing', title: t('orderStatus.Processing') },
    { value: 'Shipped', title: t('orderStatus.Shipped') },
    { value: 'Delivered', title: t('orderStatus.Delivered') },
    { value: 'Cancelled', title: t('orderStatus.Cancelled') }
  ])

  const sortOptions = computed(() => [
    { value: 'userName', title: t('User Name') },
    { value: 'totalPrice', title: t('Total Price') },
    { value: 'createdAt', title: t('orderHeaders.date') }
  ])

  const headers = computed(() => [
    {
      title: t('orderHeaders.orderNumber'),
      value: 'orderNumber',
      align: 'center'
    },
    {
      title: t('orderHeaders.product'),
      value: 'product',
      align: 'start',
      sortable: true
    },
    {
      title: t('orderHeaders.date'),
      value: 'date',
      align: 'center',
      sortable: true
    },
    {
      title: t('orderHeaders.user'),
      value: 'user',
      align: 'center',
      sortable: true
    },
    {
      title: t('orderHeaders.total'),
      value: 'total',
      align: 'center',
      sortable: true
    },
    {
      title: t('orderHeaders.payment'),
      value: 'payment',
      align: 'center'
    },
    {
      title: t('orderHeaders.status'),
      value: 'status',
      align: 'center'
    },
    {
      title: t('orderHeaders.actions'),
      value: 'actions',
      align: 'center',
      sortable: false
    }
  ])

  const statusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'teal-lighten-1'
      case 'Processing':
        return 'orange-lighten-1'
      case 'Shipped':
        return 'purple-lighten-1'
      case 'Delivered':
        return 'green-lighten-1'
      case 'Cancelled':
        return 'red-lighten-2'
      default:
        return 'grey-lighten-2'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Methods
  const openEditDialog = (item) => {
    selectedStatus.value = item.status
    currentItem.value = item
    dialog.value = true
  }

  const saveStatus = async () => {
    if (currentItem.value) {
      try {
        await ordersStore.updateOrderStatus(
          currentItem.value._id,
          selectedStatus.value
        )
        dialog.value = false
      } catch (err) {
        error.value = t('error.updatingStatus')
        console.error(err)
      }
    }
  }

  const orderDetails = (item) => {
    ordersStore.setSelectedOrder(item)
    const role = getUserRole()
    const routeName =
      role === 'super_admin'
        ? 'super-admin-order-details'
        : 'admin-order-details'
    router.push({ name: routeName, params: { id: item._id } })
  }

  const deleteItem = (item) => {
    itemToDelete.value = item
    confirmDialog.value.open()
  }

  const handleConfirmDelete = async () => {
    try {
      await ordersStore.softDeleteOrder(itemToDelete.value._id)
    } catch (err) {
      error.value = t('error.deletingOrder')
      console.error(err)
    }
  }

  const handlePageChange = async (newPage) => {
    if (newPage === ordersStore.currentPage) return
    try {
      await ordersStore.handlePageChange(newPage)
    } catch (err) {
      error.value = t('error.loadingPage')
      console.error(err)
    }
  }

  const handleItemsPerPageChange = async (newSize) => {
    try {
      await ordersStore.handleItemsPerPageChange(newSize)
    } catch (err) {
      error.value = t('error.changingPageSize')
      console.error(err)
    }
  }

  const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user'))
    return user?.role || 'admin'
  }

  // Lifecycle
  onMounted(async () => {
    try {
      isLoading.value = true
      await ordersStore.getOrders()
      componentKey.value++ // Force table refresh
    } catch (err) {
      error.value = t('error.loadingOrders')
      console.error('Failed to load orders:', err)
    } finally {
      isLoading.value = false
    }
  })
</script>

<style scoped>
  .toolbar-container {
    padding: 12px 16px;
    min-height: auto !important;
    border: none;
  }

  .toolbar-content {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .desktop-layout {
    justify-content: flex-start;
    gap: 12px;
  }

  .mobile-layout {
    flex-direction: column;
    gap: 12px;
  }

  .search-field .v-field,
  .status-select .v-field {
    height: 40px;
  }

  .v-btn {
    font-weight: 500;
    letter-spacing: 0.5px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    height: 40px;
  }

  .product-image-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    overflow: hidden;
  }

  .v-data-table {
    width: 100%;
  }

  .v-data-table :deep(.v-data-table__td) {
    padding: 12px;
    vertical-align: middle;
  }

  .v-data-table :deep(.v-data-table__tr:hover) {
    background-color: rgba(0, 0, 0, 0.02);
  }

  @media (max-width: 600px) {
    .toolbar-container {
      padding: 12px;
    }

    .search-field,
    .status-select,
    .v-btn {
      width: 100%;
    }
  }
</style>
