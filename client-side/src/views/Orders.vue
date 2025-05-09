<template>
  <v-form>
    <v-container>
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <v-row :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
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

            <v-col cols="6" md="3" sm="6">
              <v-select
                :items="statusOptions"
                :label="$t('orderHeaders.status')"
                clearable
                hide-details
                v-model="ordersStore.selectedStatus"
                @update:model-value="ordersStore.setStatusFilter"
              />
            </v-col>

            <v-col cols="6" md="3" sm="6">
              <v-select
                :items="sortOptions"
                :label="$t('Sort By')"
                hide-details
                v-model="ordersStore.sortBy"
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
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </v-form>

  <v-card>
    <v-container>
      <v-data-table
        :headers="headers"
        :items="ordersStore.sortedOrders"
        item-value="_id"
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        class="elevation-0"
        hide-default-footer
        :no-data-text="t('No data available')"
      >
        <template #item.product="{ item }">
          <div class="d-flex align-center ga-5">
            <div class="product-image-wrapper">
              <v-img
                :src="item.orderItems[0]?.selectedColors[0]?.image"
                alt="Product Image"
                cover
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

        <template #item.total="{ item }"> ${{ item.total }} </template>

        <template #item.date="{ item }"> {{ item.createdAt }} </template>

        <template #item.payment="{ item }">
          <div>{{ item.shippingMethod?.name }}</div>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" variant="tonal" small>
            {{ item.status }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
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
            variant="text"
          />
        </template>
      </v-data-table>
    </v-container>
  </v-card>

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
    :message="deleteMessage"
    :confirm-text="t('Delete')"
    :cancel-text="t('Cancel')"
    confirm-color="error"
    @confirm="handleConfirmDelete"
  />
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useOrderStore } from '../store/order'
  import router from '../router'
  const ordersStore = useOrderStore()
  onMounted(async () => {
    await ordersStore.getOrders()
  })

  import { useI18n } from 'vue-i18n'
  import ConfirmDialog from '../components/Shared/ConfirmDialog.vue'
  const { t } = useI18n()

  const headers = computed(() => [
    {
      title: t('orderHeaders.orderNumber'),
      value: 'orderNumber',
      align: 'center'
    },
    { title: t('orderHeaders.product'), value: 'product', align: 'center' },
    {
      title: t('orderHeaders.date'),
      value: 'createdAt',
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
    { title: t('orderHeaders.payment'), value: 'payment', align: 'center' },
    { title: t('orderHeaders.status'), value: 'status', align: 'center' },
    { title: t('orderHeaders.actions'), value: 'actions', align: 'center' }
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

  const dialog = ref(false)
  const selectedStatus = ref('')
  const currentItem = ref(null)
  const statuses = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled'
  ]

  function openEditDialog(item) {
    selectedStatus.value = item.status
    currentItem.value = item
    dialog.value = true
  }
  async function saveStatus() {
    if (currentItem.value) {
      console.log(currentItem.value)
      await ordersStore.updateOrderStatus(
        currentItem.value._id,
        selectedStatus.value
      )
      dialog.value = false
    }
  }

  async function orderDetails(item) {
    ordersStore.setSelectedOrder(item)
    router.push({
      name: 'order-details',
      params: { id: item._id }
    })
  }

  // async function deleteItem(item) {
  //   try {
  //     await ordersStore.softDeleteOrder(item._id)
  //     ordersStore.orders = ordersStore.orders.filter(
  //       (order) => item._id !== order._id
  //     )
  //   } catch (err) {
  //     console.log(err)
  //   }
  // }

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
    { value: 'date', title: t('orderHeaders.date') }
  ])

  const confirmDialog = ref(null)

  const itemToDelete = ref(null)

  function deleteItem(item) {
    itemToDelete.value = item
    confirmDialog.value.open()
  }

  async function handleConfirmDelete() {
    try {
      await ordersStore.softDeleteOrder(itemToDelete.value._id)
      ordersStore.orders = ordersStore.orders.filter(
        (order) => itemToDelete.value._id !== order._id
      )
    } catch (err) {
      console.error(err)
    }
  }
</script>

<style scoped>
  .product-image-wrapper {
    width: 45px;
    height: 40px;
    overflow: hidden;
  }
  .product-image-wrapper .v-img {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    object-fit: cover;
  }
  .item-style {
    margin-bottom: 8px;
    background-color: #f5f5f5;
    padding: 8px;
    border-radius: 4px;
  }
</style>
