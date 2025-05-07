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
        mdi-currency-usd
      </v-icon>
      <span>{{ $t('currencies') }}</span>
    </v-card-title>

    <v-card-text>
      <v-data-table
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        :headers="[
          { title: t('code'), value: 'code', sortable: true, align: 'start' },
          { title: t('name'), value: 'name', sortable: true },
          { title: t('symbol'), value: 'symbol', sortable: true },
          { title: t('exchangeRate'), value: 'exchange_rate', sortable: true },
          { title: t('actions'), value: 'actions', sortable: false }
        ]"
        :items="currencyStore.currencies"
        :items-per-page="currencyStore.pagination.limit"
        hide-default-footer
        :page.sync="currencyStore.pagination.page"
        :server-items-length="currencyStore.pagination.total"
        class="elevation-1"
        :loading="isLoading"
        loading-text="Loading currencies... Please wait"
      >
        <!-- Skeleton loading state -->
        <template v-slot:loading>
          <tbody>
            <tr v-for="i in 5" :key="`skeleton-row-${i}`">
              <td v-for="j in 5" :key="`skeleton-col-${j}`">
                <v-skeleton-loader type="text" />
              </td>
            </tr>
          </tbody>
        </template>

        <!-- Error state -->
        <template v-slot:error>
          <tbody>
            <tr>
              <td :colspan="5" class="text-center py-12">
                <v-icon size="96" color="error"
                  >mdi-alert-circle-outline</v-icon
                >
                <p class="text-h4 grey--text mt-4">
                  {{ $t('errorLoadingData') }}
                </p>
                <p class="text-body-1 mt-2">{{ currencyStore.error }}</p>
                <v-btn color="primary" class="mt-4" @click="retryFetch">
                  {{ $t('retry') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>

        <!-- Table toolbar -->
        <template v-slot:top>
          <v-toolbar
            flat
            :color="$vuetify.theme.current.dark ? 'surface' : 'white'"
          >
            <v-btn
              color="secondary"
              @click="openDialog()"
              class="w-100"
              :disabled="isLoading || !!currencyStore.error"
            >
              <v-icon
                :left="$i18n.locale !== 'ar'"
                :right="$i18n.locale === 'ar'"
              >
                mdi-plus
              </v-icon>
              {{ $t('addCurrency') }}
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
            @click="openDialog(item)"
            :class="$i18n.locale === 'ar' ? 'ml-2' : 'mr-2'"
            :disabled="isLoading"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            @click="confirmDelete(item._id)"
            color="error"
            :disabled="isLoading"
          >
            mdi-delete
          </v-icon>
        </template>

        <!-- Empty state -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="96" color="grey lighten-1"
              >mdi-currency-usd-off</v-icon
            >
            <p class="text-h4 grey--text mt-4">
              {{ t('noCurrencies') }}
            </p>
            <v-btn color="primary" class="mt-4" @click="openDialog()">
              <v-icon left>mdi-plus</v-icon>
              {{ t('addFirstCurrency') }}
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Pagination controls -->
      <PaginationControls
        v-if="
          !isLoading &&
          !currencyStore.error &&
          currencyStore.pagination.total > 0
        "
        v-model:page="currencyStore.pagination.page"
        v-model:itemsPerPage="currencyStore.pagination.limit"
        :total-items="currencyStore.pagination.total"
        @update:page="handlePageChange"
        @update:itemsPerPage="handleItemsPerPageChange"
      />

      <!-- Currency Dialog -->
      <v-dialog v-model="dialog" max-width="500px" persistent>
        <v-card class="p-3">
          <v-card-title>
            {{ isEdit ? t('editCurrency') : t('newCurrency') }}
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" @submit.prevent="saveCurrency">
              <v-text-field
                v-model="editedCurrency.code"
                :label="t('code')"
                :rules="[(v) => !!v || t('fieldRequired')]"
                required
              ></v-text-field>
              <v-text-field
                v-model="editedCurrency.name"
                :label="t('name')"
                :rules="[(v) => !!v || t('fieldRequired')]"
                required
              ></v-text-field>
              <v-text-field
                v-model="editedCurrency.symbol"
                :label="t('symbol')"
                :rules="[(v) => !!v || t('fieldRequired')]"
                required
              ></v-text-field>
              <v-text-field
                v-model="editedCurrency.exchange_rate"
                :label="t('exchangeRate')"
                type="number"
                :rules="[
                  (v) => !!v || t('fieldRequired'),
                  (v) => !isNaN(v) || t('mustBeNumber'),
                  (v) => v > 0 || t('mustBePositive')
                ]"
                required
              ></v-text-field>
              <v-card-actions class="justify-end">
                <v-btn
                  :color="
                    $vuetify.theme.current.dark ? 'grey-ligthen-2' : 'secondary'
                  "
                  @click="dialog = false"
                  :class="$i18n.locale === 'ar' ? 'ml-2' : 'mr-2'"
                >
                  {{ t('cancel') }}
                </v-btn>
                <v-btn
                  type="submit"
                  color="success"
                  :loading="currencyStore.loading"
                >
                  {{ isEdit ? t('update') : t('save') }}
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog
        ref="confirmDialog"
        :title="t('confirmDeleteTitle')"
        :message="t('confirmDeleteMessage')"
        :confirm-text="t('delete')"
        :cancel-text="t('cancel')"
        confirm-color="error"
        type="warning"
        @confirm="deleteCurrency"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useCurrencyStore } from '../../store/useCurrencyStore'
  import { useSettingsStore } from '../../store/useSettingsStore'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import PaginationControls from '../Shared/PaginationControls.vue'
  import ConfirmDialog from '../Shared/ConfirmDialog.vue'

  const { t } = useI18n()
  const currencyStore = useCurrencyStore()
  const settingsStore = useSettingsStore()
  const toast = useToast()
  const isLoading = ref(true)

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

  // Delete confirmation
  const confirmDialog = ref(null)
  const currencyToDelete = ref(null)

  // Retry fetching data
  const retryFetch = async () => {
    isLoading.value = true
    try {
      await currencyStore.fetchCurrencies(
        currencyStore.pagination.page,
        currencyStore.pagination.limit
      )
    } catch (error) {
      toast.error(t('error.fetchCurrencies'))
    } finally {
      isLoading.value = false
    }
  }

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

    try {
      const payload = {
        ...editedCurrency.value,
        exchange_rate: Number(editedCurrency.value.exchange_rate)
      }

      if (isEdit.value) {
        await currencyStore.updateCurrency(editedCurrency.value._id, payload)
        toast.success(t('currencyUpdated'))
      } else {
        await currencyStore.addCurrency(payload)
        toast.success(t('currencyAdded'))
      }
      dialog.value = false
      await retryFetch()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Delete confirmation
  const confirmDelete = (id) => {
    currencyToDelete.value = id
    confirmDialog.value.open()
  }

  // Actual delete function
  const deleteCurrency = async () => {
    try {
      await currencyStore.deleteCurrency(currencyToDelete.value)
      toast.success(t('currencyDeleted'))
      await retryFetch()
    } catch (error) {
      toast.error(t('error.deleteCurrency'))
    } finally {
      currencyToDelete.value = null
    }
  }

  // Pagination handlers
  const handlePageChange = async (newPage) => {
    await retryFetch()
  }

  const handleItemsPerPageChange = async (newSize) => {
    currencyStore.pagination.page = 1
    await retryFetch()
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
