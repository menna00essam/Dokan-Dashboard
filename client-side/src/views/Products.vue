<template>
  <v-container fluid>
    <v-toolbar
      flat
      :color="$vuetify.theme.current.dark ? 'primary' : 'white'"
      style="border: none"
    >
      <router-link to="/addproducts" class="ml-auto">
        <v-btn
          class="mb-2 bg-secondary text-white"
          color="white"
          style="text-transform: none"
        >
          <v-icon start>mdi-plus</v-icon>
          Add a product
        </v-btn>
      </router-link>
    </v-toolbar>
    <v-data-table
      :key="componentKey"
      :headers="headers"
      :items="products"
      class="elevation-1"
      hide-default-footer
    >
      <template v-slot:[`item.name`]="{ item }">
        <div class="d-flex align-center product-cell">
          <v-avatar
            v-if="item.imageUrl"
            size="30"
            class="image-container mr-2"
            rounded="0"
          >
            <v-img :src="item.imageUrl" :alt="item.name"></v-img>
          </v-avatar>
          <span
            class="product-name ml-1"
            :color="$vuetify.theme.current.dark ? 'text' : 'black'"
            >{{ item.name }}</span
          >
        </div>
      </template>

      <template v-slot:[`item.sku`]="{ item }">
        <span>{{
          item.colors && item.colors[0] ? item.colors[0].sku : 'N/A'
        }}</span>
      </template>

      <template v-slot:[`item.categories`]="{ item }">
        <span>{{
          item.categories && item.categories[0]
            ? item.categories[0].name
            : 'N/A'
        }}</span>
      </template>

      <template v-slot:[`item.colors`]="{ item }">
        <span>{{
          item.colors
            ? item.colors.reduce((sum, color) => sum + color.quantity, 0)
            : 0
        }}</span>
      </template>

      <template v-slot:[`item.price`]="{ item }">
        <span>{{ item.price }}</span>
      </template>

      <template v-slot:[`item.createdAt`]="{ item }">
        <span>{{ new Date(item.createdAt).toLocaleDateString() }}</span>
      </template>

      <template v-slot:[`item.action`]="{ item }">
        <div class="d-flex align-center gap-2">
          <v-icon small class="mr-2" @click="editItem(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="deleteItemHandler(item)" color="red">
            mdi-delete
          </v-icon>
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useProductStore } from '../store/product.js'
  const router = useRouter()
  const productStore = useProductStore()
  const componentKey = ref(0)
  const headers = ref([
    { title: 'Name', key: 'name' },
    { title: 'SKU', key: 'sku' },
    { title: 'Category', key: 'categories' },
    { title: 'Stock', key: 'colors' },
    { title: 'Price', key: 'price' },
    { title: 'Added', key: 'createdAt' },
    { title: 'Action', key: 'action', sortable: false }
  ])
  const products = computed(() => productStore.products)
  onMounted(() => {
    productStore.fetchAll()
    console.log('بيانات المنتجات في صفحة Products:', products.value)
  })

  const editItem = (item) => {
    router.push(`/editproducts/${item._id}`)
  }

  const deleteItemHandler = (item) => {
    productStore.deleteProduct(item._id) // هنبعت الـ item._id هنا
  }

  const statusColor = (status) => {
    if (status === 'Published') return 'success'
    if (status === 'Draft') return 'warning'
    if (status === 'Low Stock') return 'error'
    return 'info'
  }
</script>
<style scoped>
  .v-toolbar {
    padding: 0 16px;
    margin-bottom: 16px;
  }

  .v-btn {
    font-weight: 500;
    letter-spacing: 0.5px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .v-data-table .v-data-table__td {
    vertical-align: middle;
    padding: 12px;
  }

  .product-name {
    font-weight: 500;
  }

  .v-data-table .v-data-table__tr:hover {
    background-color: #f0f4ff;
    transition: background-color 0.3s;
  }
</style>
