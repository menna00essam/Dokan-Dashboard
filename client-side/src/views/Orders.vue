<template>
  <v-form>
    <v-container>
      <v-row class="d-flex align-center" no-gutters>
        <v-col cols="8" lg="10" sm="9" xs="8">
          <v-text-field
            placeholder="Search order..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            hide-details
            density="comfortable"
            color="#ccc"
          ></v-text-field>
        </v-col>

        <v-col cols="4" lg="2" sm="3" xs="4" class="d-flex justify-end">
          <v-btn
            prepend-icon="mdi-plus"
            style="
              background-color: #3b82f6;
              height: 48px;
              text-transform: capitalize;
            "
            class="text-white"
          >
            Add Order
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>

  <v-card>
    <v-container>
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        item-value="id"
        class="elevation-0"
        hide-default-footer
      >
        <template #item.product="{ item }">
          <div class="d-flex align-center ga-5">
            <div class="product-image-wrapper">
              <v-img :src="item.image" alt="Product Image" cover />
            </div>
            <div>
              <div>{{ item.product }}</div>
              <div class="text-caption text-grey">
                {{ item.variants }} Variants
              </div>
            </div>
          </div>
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
            icon="mdi-delete"
            @click="deleteItem(item)"
            size="small"
            variant="text"
          />
        </template>
      </v-data-table>
    </v-container>
  </v-card>

  <!-- Dialog -->
  <v-dialog
    v-model="dialog"
    max-width="400"
    transition="fade-transition"
    persistent
  >
    <v-card>
      <v-card-title class="justify-center text-h6 font-weight-bold">
        Update Order Status
      </v-card-title>

      <v-card-text class="pt-0">
        <v-select
          v-model="selectedStatus"
          :items="statuses"
          label="Select New Status"
          variant="outlined"
          density="comfortable"
          color="primary"
        />
      </v-card-text>

      <v-card-actions class="justify-center pb-4">
        <v-btn
          color="grey"
          variant="tonal"
          class="mr-2"
          @click="dialog = false"
        >
          Cancel
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="saveStatus">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { onMounted, ref } from 'vue'

  onMounted(() => {
    const saveOrders = localStorage.getItem('orders')
    if (saveOrders) {
      filteredItems.value = JSON.parse(saveOrders)
    } else {
      filteredItems.value = [...items.value]
    }
  })

  const headers = [
    { title: 'Order ID', value: 'id' },
    { title: 'Product', value: 'product' },
    { title: 'Date', value: 'date' },
    { title: 'Customer', value: 'customer' },
    { title: 'Total', value: 'total' },
    { title: 'Payment', value: 'payment' },
    { title: 'Status', value: 'status' },
    { title: 'Actions', value: 'actions' }
  ]

  const items = ref([
    {
      id: 1,
      image: 'src/assets/bmw.jpg',
      product: 'Handmade Pouch',
      variants: 3,
      date: '29 Dec 2022',
      customer: 'John Bushmill',
      total: '$121.00',
      payment: 'Mastercard',
      status: 'Processing'
    },
    {
      id: 2,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Delivered'
    },
    {
      id: 3,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Cancelled'
    },
    {
      id: 4,
      image: 'src/assets/bmw.jpg',
      product: 'Handmade Pouch',
      variants: 3,
      date: '29 Dec 2022',
      customer: 'John Bushmill',
      total: '$121.00',
      payment: 'Mastercard',
      status: 'Processing'
    },
    {
      id: 5,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Delivered'
    },
    {
      id: 6,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Cancelled'
    },
    {
      id: 7,
      image: 'src/assets/bmw.jpg',
      product: 'Handmade Pouch',
      variants: 3,
      date: '29 Dec 2022',
      customer: 'John Bushmill',
      total: '$121.00',
      payment: 'Mastercard',
      status: 'Processing'
    },
    {
      id: 8,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Delivered'
    },
    {
      id: 9,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Cancelled'
    },
    {
      id: 10,
      image: 'src/assets/bmw.jpg',
      product: 'Handmade Pouch',
      variants: 3,
      date: '29 Dec 2022',
      customer: 'John Bushmill',
      total: '$121.00',
      payment: 'Mastercard',
      status: 'Processing'
    },
    {
      id: 11,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Delivered'
    },
    {
      id: 12,
      image: 'src/assets/bmw.jpg',
      product: 'Smartwatch E2',
      variants: 2,
      date: '24 Dec 2022',
      customer: 'Linda Blair',
      total: '$590.00',
      payment: 'Visa',
      status: 'Cancelled'
    }
  ])

  const filteredItems = ref([...items.value])

  const statusColor = (status) => {
    switch (status) {
      case 'Processing':
        return 'orange-lighten-2'
      case 'Delivered':
        return 'blue-lighten-2'
      case 'Cancelled':
        return 'red-lighten-2'
      default:
        return 'grey-lighten-2'
    }
  }

  const dialog = ref(false)
  const selectedStatus = ref('')
  const currentItem = ref(null)
  const statuses = ['Processing', 'Delivered', 'Cancelled']

  function openEditDialog(item) {
    selectedStatus.value = item.status
    currentItem.value = item
    dialog.value = true
  }

  function saveStatus() {
    if (currentItem.value) {
      currentItem.value.status = selectedStatus.value
      dialog.value = false
    }
  }

  function deleteItem(item) {
    filteredItems.value = filteredItems.value.filter(
      (deletedItem) => item.id !== deletedItem.id
    )
    localStorage.setItem('orders', JSON.stringify(filteredItems.value))
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
    margin-bottom: 8px; /* مثال للمارجن السفلي */
    background-color: #f5f5f5; /* مثال للباكجراوند كولو الرمادي الفاتح */
    padding: 8px; /* ممكن تضيف padding عشان الشكل يكون أحسن */
    border-radius: 4px; /* عشان الأطراف تكون مدورة شوية */
  }
</style>
