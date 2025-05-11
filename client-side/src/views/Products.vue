<template>
  <v-container fluid>
    <v-card
      flat
      :color="$vuetify.theme.current.dark ? 'primary' : 'white'"
      class="toolbar-container"
    >
      <div
        class="toolbar-content"
        :class="{
          'desktop-layout': !isMobile,
          'mobile-layout': isMobile
        }"
      >
        <v-text-field
          v-model="searchQuery"
          :label="t('search_products')"
          :prepend-inner-icon="
            $i18n.locale === 'ar' ? undefined : 'mdi-magnify'
          "
          :append-inner-icon="$i18n.locale === 'ar' ? 'mdi-magnify' : undefined"
          clearable
          variant="outlined"
          density="comfortable"
          single-line
          hide-details
          class="search-field"
          :class="{
            'mr-3': $i18n.locale === 'ltr' && !isMobile,
            'ml-3': $i18n.locale === 'ar' && !isMobile,
            'mb-3': isMobile
          }"
          :style="{ width: isMobile ? '100%' : '300px' }"
          :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
          @input="handleSearch"
          @click:clear="clearSearch"
        ></v-text-field>

        <router-link to="/addproducts" :class="{ 'w-100': isMobile }">
          <v-btn
            class="bg-secondary text-white"
            :class="{ 'w-100': isMobile }"
            style="text-transform: none"
          >
            <template v-if="$i18n.locale === 'ar'">
              {{ t('add_a_product') }}
              <v-icon end> mdi-plus </v-icon>
            </template>
            <template v-else>
              <v-icon start> mdi-plus </v-icon>
              {{ t('add_a_product') }}
            </template>
          </v-btn>
        </router-link>
      </div>
    </v-card>
    <v-data-table
      :key="componentKey"
      :headers="translatedHeaders"
      :items="products"
      class="elevation-1"
      hide-default-footer
      :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
      :loading="productStore.isLoading"
    >
      <template v-slot:[`item.name`]="{ item }">
        <div class="d-flex align-center product-cell">
          <v-avatar
            v-if="item.imageUrl"
            size="30"
            class="image-container"
            rounded="0"
            :class="$i18n.locale === 'ar' ? 'ml-2' : 'mr-2'"
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

      <template v-slot:[`item.date`]="{ item }">
        <span>{{ new Date(item.date).toLocaleDateString() }}</span>
      </template>

      <template v-slot:[`item.action`]="{ item }">
        <div class="d-flex align-center gap-2">
          <v-icon
            small
            :class="$i18n.locale === 'ar' ? 'ml-2' : 'mr-2'"
            @click="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon small @click="deleteItemHandler(item)" color="red">
            mdi-delete
          </v-icon>
        </div>
      </template>
    </v-data-table>
    <PaginationControls
      v-if="productStore.totalProducts > 0"
      v-model:page="productStore.currentPage"
      v-model:itemsPerPage="productStore.itemsPerPage"
      :total-items="productStore.totalProducts"
      :direction="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
      @update:page="productStore.fetchAll"
      @update:itemsPerPage="productStore.fetchAll"
    />
    <ConfirmDialog
      ref="confirmDialog"
      type="error"
      :title="t('delete_product')"
      :message="t('confirm_delete_product')"
      :confirm-text="t('delete')"
      :cancel-text="t('cancel')"
      confirm-color="error"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </v-container>
</template>

<script setup>
  const { t, locale } = useI18n()

  import { useI18n } from 'vue-i18n'

  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useProductStore } from '../store/product.js'

  // Add search query ref
  const searchQuery = ref('')
  const confirmDialog = ref(null)
  const productToDelete = ref(null)
  const debounceTimeout = ref(null)

  import { useDisplay } from 'vuetify'

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  import PaginationControls from '../components/Shared/PaginationControls.vue'
  import ConfirmDialog from '../components/Shared/ConfirmDialog.vue'
  const router = useRouter()
  const productStore = useProductStore()
  const componentKey = ref(0)
  const headers = ref([
    { title: 'Name', key: 'name' },
    { title: 'SKU', key: 'sku' },
    { title: 'Category', key: 'categories' },
    { title: 'Stock', key: 'colors' },
    { title: 'Price', key: 'price' },
    { title: 'Added', key: 'date' },
    { title: 'Action', key: 'action', sortable: false }
  ])
  const translatedHeaders = computed(() => {
    return headers.value.map((header) => ({
      ...header,
      title: t(header.title.toLowerCase()) // هنستخدم الـ title الأصلي بعد تحويله لـ lowercase كمفتاح
    }))
  })
  const products = computed(() => productStore.products)
  const deleteItemHandler = (item) => {
    productToDelete.value = item._id
    confirmDialog.value.open()
  }

  const confirmDelete = async () => {
    if (productToDelete.value) {
      await productStore.deleteProduct(productToDelete.value)
      productToDelete.value = null
      // Optionally refresh the product list
      await productStore.fetchAll(
        productStore.currentPage,
        productStore.itemsPerPage
      )
    }
  }
  const handleSearch = () => {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = setTimeout(() => {
      productStore.currentPage = 1 // Reset to first page when searching
      productStore.fetchAll(
        1, // Always start from page 1 when searching
        productStore.itemsPerPage,
        searchQuery.value
      )
    }, 500)
  }

  const clearSearch = () => {
    console.log('Clearing search')
    searchQuery.value = ''
    productStore.currentPage = 1
    productStore.fetchAll(1, productStore.itemsPerPage)
  }
  const cancelDelete = () => {
    productToDelete.value = null
  }
  onMounted(() => {
    productStore.fetchAll()
    console.log('بيانات المنتجات في صفحة Products:', products.value)
  })

  const editItem = (item) => {
    router.push(`/editproducts/${item._id}`)
  }

  const statusColor = (status) => {
    if (status === 'Published') return 'success'
    if (status === 'Draft') return 'warning'
    if (status === 'Low Stock') return 'error'
    return 'info'
  }
</script>
<style scoped>
  /* Base toolbar styles */
  .toolbar-container {
    padding: 12px 16px;
    min-height: auto !important;
    border: none;
    margin-bottom: 30px;
  }

  /* Content container */
  .toolbar-content {
    width: 100%;
    display: flex;
    align-items: center;
  }

  /* Desktop layout */
  .desktop-layout {
    justify-content: space-between;
  }

  .desktop-layout .search-field {
    width: 300px;
    margin-right: 12px;
  }

  /* Mobile layout */
  .mobile-layout {
    flex-direction: column;
    gap: 12px;
  }

  .mobile-layout .search-field,
  .mobile-layout .add-product-btn {
    width: 100%;
  }

  /* Field and button styles */
  .search-field .v-field {
    height: 40px;
  }

  .v-btn {
    font-weight: 500;
    letter-spacing: 0.5px;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    height: 40px;
  }

  /* Data table styles (keep your existing ones) */
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

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .toolbar-container {
      padding: 12px;
    }
  }
</style>
