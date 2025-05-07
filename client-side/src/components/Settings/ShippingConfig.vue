<template>
  <v-card class="mb-6">
    <v-card-title
      class="primary d-flex align-center"
      :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
    >
      <v-icon
        class="mx-2"
        :left="$i18n.locale !== 'ar'"
        :right="$i18n.locale === 'ar'"
      >
        mdi-truck
      </v-icon>
      <span>{{ $t('shippingMethods') }}</span>
    </v-card-title>
    <v-card-text>
      <v-data-table
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        :headers="shippingHeaders"
        :items="shippingStore.shippingMethods"
        class="elevation-1"
        hide-default-footer
        :page.sync="shippingStore.pagination.page"
        :items-per-page="shippingStore.pagination.limit"
        :server-items-length="shippingStore.pagination.total"
        :loading="isLoading"
        loading-text="Loading shipping methods... Please wait"
      >
        <!-- Skeleton loading state -->
        <template v-slot:loading>
          <tbody>
            <tr v-for="i in 5" :key="`skeleton-row-${i}`">
              <td
                v-for="header in shippingHeaders"
                :key="`skeleton-${header.value}`"
              >
                <v-skeleton-loader type="text" />
              </td>
            </tr>
          </tbody>
        </template>

        <!-- Error state -->
        <template v-slot:error>
          <tbody>
            <tr>
              <td :colspan="shippingHeaders.length" class="text-center py-12">
                <v-icon class="mx-2" size="96" color="error">
                  mdi-truck
                </v-icon>
                <p class="text-h4 grey--text mt-4">
                  {{ $t('errorLoadingData') }}
                </p>
                <p class="text-body-1 mt-2">{{ shippingStore.error }}</p>
                <v-btn color="primary" class="mt-4" @click="retryFetch">
                  {{ $t('retry') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>

        <!-- Table toolbar -->
        <template
          v-slot:top
          v-if="
            shippingStore.shippingMethods &&
            shippingStore.shippingMethods.length > 0
          "
        >
          <v-toolbar
            flat
            :color="$vuetify.theme.current.dark ? 'surface' : 'white'"
          >
            <v-btn
              color="secondary"
              @click="openShippingDialog(null)"
              class="w-100"
              :disabled="isLoading || !!shippingStore.error"
            >
              <v-icon left>mdi-plus</v-icon>
              {{ $t('addMethod') }}
            </v-btn>
          </v-toolbar>
        </template>

        <!-- Table header -->
        <template v-slot:header="{ headers }">
          <thead>
            <tr>
              <th v-for="header in headers" :key="header.value">
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

        <!-- Normal data rows -->
        <template v-slot:item.actions="{ item }">
          <v-icon
            @click="openShippingDialog(item)"
            color=""
            class="mx-2"
            :disabled="isLoading"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            @click="confirmDelete(item._id)"
            color="red"
            :disabled="isLoading"
          >
            mdi-delete
          </v-icon>
        </template>

        <template v-slot:item.cost="{ item }">
          {{ formatCurrency(item.cost) }}
        </template>

        <!-- Empty state -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon class="mx-2" size="96" color="grey lighten-1">
              mdi-truck
            </v-icon>
            <p class="text-h4 grey--text mt-4">
              {{ $t('noShippingMethods') }}
            </p>
            <v-btn
              color="secondary"
              class="mt-4"
              @click="openShippingDialog(null)"
            >
              <v-icon left>mdi-plus</v-icon>
              {{ $t('addMethod') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Pagination controls -->
      <PaginationControls
        v-if="
          !isLoading &&
          !shippingStore.error &&
          shippingStore.pagination.total > 0
        "
        v-model:page="shippingStore.pagination.page"
        v-model:itemsPerPage="shippingStore.pagination.limit"
        :total-items="shippingStore.pagination.total"
        @update:page="handlePageChange"
        @update:itemsPerPage="handleItemsPerPageChange"
        class="mt-4"
      />

      <!-- Shipping Method Dialog -->
      <v-dialog v-model="shippingDialog" max-width="500px" persistent>
        <v-card class="p-3">
          <v-card-title>
            {{
              editingShipping
                ? $t('editShippingMethod')
                : $t('newShippingMethod')
            }}
          </v-card-title>
          <v-card-text>
            <v-form ref="shippingForm" @submit.prevent="saveShippingMethod">
              <v-text-field
                v-model="currentShipping.name"
                :label="$t('methodName')"
                :rules="nameRules"
                required
              ></v-text-field>
              <v-text-field
                v-model.number="currentShipping.cost"
                :label="$t('cost')"
                type="number"
                prefix="$"
                :rules="costRules"
                required
              ></v-text-field>
              <v-card-actions class="justify-end">
                <v-btn
                  :color="
                    $vuetify.theme.current.dark ? 'grey-ligthen-2' : 'secondary'
                  "
                  @click="closeShippingDialog"
                  class="mr-2"
                >
                  {{ $t('cancel') }}
                </v-btn>
                <v-btn
                  type="submit"
                  color="success"
                  :disabled="!isFormValid"
                  :loading="shippingStore.loading"
                >
                  {{ $t('save') }}
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        ref="deleteConfirmDialog"
        :title="$t('confirmDeleteTitle')"
        :message="$t('confirmDeleteMessage')"
        :confirm-text="$t('delete')"
        :cancel-text="$t('cancel')"
        confirm-color="error"
        type="warning"
        @confirm="onDeleteConfirmed"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import { useShippingStore } from '../../store/useShippingStore'
  import { useCurrencyStore } from '../../store/useCurrencyStore'
  import PaginationControls from '../Shared/PaginationControls.vue'
  import ConfirmDialog from '../Shared/ConfirmDialog.vue'

  const { t } = useI18n()
  const shippingStore = useShippingStore()
  const currencyStore = useCurrencyStore()
  const toast = useToast()
  const isLoading = ref(true)

  // Dialog state
  const shippingDialog = ref(false)
  const editingShipping = ref(false)
  const shippingForm = ref(null)
  const deleteConfirmDialog = ref(null)
  const currentShipping = ref({
    name: '',
    cost: 0
  })

  // Form validation
  const nameRules = [
    (v) => !!v || t('fieldRequired'),
    (v) => (v && v.length <= 50) || t('nameTooLong')
  ]

  const costRules = [
    (v) => !!v || t('fieldRequired'),
    (v) => !isNaN(v) || t('mustBeNumber'),
    (v) => v >= 0 || t('mustBePositive')
  ]

  // Table headers
  const shippingHeaders = computed(() => [
    {
      title: t('methodName'),
      value: 'name',
      sortable: true,
      align: 'start'
    },
    { title: t('cost'), value: 'cost', sortable: true },
    { title: t('actions'), value: 'actions', sortable: false }
  ])

  const isFormValid = computed(() => {
    return (
      currentShipping.value.name.trim() !== '' &&
      currentShipping.value.cost !== null &&
      !isNaN(currentShipping.value.cost) &&
      currentShipping.value.cost >= 0
    )
  })

  // Retry fetching data
  const retryFetch = async () => {
    isLoading.value = true
    try {
      await shippingStore.fetchShippingMethods(
        shippingStore.pagination.page,
        shippingStore.pagination.limit
      )
    } catch (error) {
      toast.error(t('error.fetchMethods'))
    } finally {
      isLoading.value = false
    }
  }

  // Pagination handlers
  const handlePageChange = async (newPage) => {
    await retryFetch()
  }

  const handleItemsPerPageChange = async (newSize) => {
    shippingStore.pagination.page = 1
    await retryFetch()
  }

  // Dialog methods
  const openShippingDialog = (item = null) => {
    editingShipping.value = !!item
    currentShipping.value = item ? { ...item } : { name: '', cost: 0 }
    shippingDialog.value = true
  }

  const closeShippingDialog = () => {
    shippingDialog.value = false
    if (shippingForm.value) {
      shippingForm.value.resetValidation()
    }
  }

  // CRUD operations
  const saveShippingMethod = async () => {
    if (!shippingForm.value.validate()) return

    try {
      if (editingShipping.value) {
        await shippingStore.updateShippingMethod(currentShipping.value)
        toast.success(t('methodUpdated'))
      } else {
        await shippingStore.addShippingMethod(currentShipping.value)
        toast.success(t('methodAdded'))
      }
      closeShippingDialog()
      await retryFetch()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const confirmDelete = (id) => {
    shippingStore.setItemToDelete(id)
    deleteConfirmDialog.value.open()
  }

  const onDeleteConfirmed = async () => {
    try {
      await shippingStore.deleteShippingMethod(shippingStore.itemToDelete)
      toast.success(t('methodDeleted'))
      await retryFetch()
    } catch (error) {
      toast.error(t('error.deleteMethod'))
    }
  }

  // Currency formatting
  const formatCurrency = (value) => {
    return `${currencyStore.symbol}${(value * currencyStore.rate).toFixed(2)}`
  }

  // Initial load
  onMounted(async () => {
    await retryFetch()
  })
</script>

<style scoped>
  .hover-row:hover {
    background-color: rgba(0, 0, 0, 0.02);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .v-table {
    width: 100%;
  }

  .v-card-title {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  }

  tr td {
    padding: 20px !important;
  }

  /* Apply only when dir="rtl" */
  [dir='rtl'] tr th {
    text-align: right !important;
  }

  /* Optional: Add other RTL-specific table styles */
  [dir='rtl'] .v-table td {
    text-align: right !important;
  }
</style>
