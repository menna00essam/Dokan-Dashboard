<template>
  <v-card>
    <v-card-title
      class="primary d-flex align-center"
      :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
    >
      <v-icon
        class="mx-2"
        :left="$i18n.locale !== 'ar'"
        :right="$i18n.locale === 'ar'"
        >mdi-account-cog</v-icon
      >
      {{ $t('userPermissions') }}
    </v-card-title>

    <v-card-text>
      <v-data-table
        :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
        :headers="userHeaders"
        :items="userStore.users"
        :items-per-page="itemsPerPage"
        :page.sync="page"
        hide-default-footer
        class="elevation-1"
        :loading="initialLoading"
        loading-text="Loading users... Please wait"
      >
        <!-- Skeleton loading state -->
        <template v-slot:loading>
          <tbody>
            <tr v-for="i in 5" :key="`skeleton-row-${i}`">
              <td
                v-for="header in userHeaders"
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
              <td :colspan="userHeaders.length" class="text-center py-12">
                <v-icon size="96" color="error"
                  >mdi-alert-circle-outline</v-icon
                >
                <p class="text-h4 grey--text mt-4">
                  {{ $t('errorLoadingData') }}
                </p>
                <p class="text-body-1 mt-2">{{ userStore.error }}</p>
                <v-btn color="primary" class="mt-4" @click="retryFetch">
                  {{ $t('retry') }}
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>

        <!-- Empty state -->
        <template v-slot:no-data>
          <div class="text-center py-12">
            <v-icon size="96" color="grey lighten-1"
              >mdi-account-cog-off</v-icon
            >
            <p class="text-h4 grey--text mt-4">
              {{ $t('noUsersFound') }}
            </p>
          </div>
        </template>

        <!-- Normal data rows -->
        <template v-slot:item.role="{ item }">
          <div class="position-relative">
            <v-select
              v-model="item.role"
              :items="userStore.roles"
              :loading="loadingItems[item._id]"
              @update:model-value="updateRole(item)"
              dense
              outlined
              :label="$t('role')"
              :disabled="loadingItems[item._id]"
            ></v-select>
            <v-progress-linear
              v-if="loadingItems[item._id]"
              indeterminate
              absolute
              bottom
              color="primary"
            ></v-progress-linear>
          </div>
        </template>

        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar
              size="36"
              :class="$i18n.locale === 'ar' ? 'ml-3' : 'mr-3'"
            >
              <v-img
                :src="
                  item.avatar || 'https://cdn.vuetifyjs.com/images/john.jpg'
                "
              />
            </v-avatar>
            {{ item.name }}
          </div>
        </template>
      </v-data-table>

      <!-- Pagination component -->
      <PaginationControls
        v-if="!initialLoading && !userStore.error && userStore.users.length > 0"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :total-items="userStore.users.length"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
        :rtl="$i18n.locale === 'ar'"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useChangeRole } from '../../store/useChangeRole'
  import PaginationControls from '../Shared/PaginationControls.vue'
  import { useToast } from 'vue-toastification'

  const { t } = useI18n()
  const userStore = useChangeRole()
  const toast = useToast()

  // State
  const page = ref(1)
  const itemsPerPage = ref(5)
  const initialLoading = ref(true)
  const loadingItems = ref({}) // Track loading state per item

  // Headers
  const userHeaders = computed(() => [
    {
      title: t('name'),
      value: 'name',
      sortable: true
    },
    {
      title: t('email'),
      value: 'email',
      sortable: true
    },
    {
      title: t('role'),
      value: 'role',
      sortable: false
    }
  ])

  // Handle role updates with per-item loading
  const updateRole = async (item) => {
    loadingItems.value[item._id] = true
    try {
      await userStore.updateUserRole(item)
      toast.success(t('userRoleUpdated', { name: item.name, role: item.role }))
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error(t('error.updatingRole', { name: item.name }))
    } finally {
      loadingItems.value[item._id] = false
    }
  }

  // Retry fetching data
  const retryFetch = async () => {
    initialLoading.value = true
    try {
      await userStore.fetchUsers({
        page: page.value,
        itemsPerPage: itemsPerPage.value
      })
    } finally {
      initialLoading.value = false
    }
  }

  // Pagination handlers
  const handlePageChange = (newPage) => {
    page.value = newPage
  }

  const handleItemsPerPageChange = (newSize) => {
    itemsPerPage.value = newSize
    page.value = 1
  }

  // Initial data fetch
  onMounted(async () => {
    await retryFetch()
  })
</script>

<style scoped>
  .force-show-headers thead {
    display: table-header-group !important;
  }

  /* RTL specific styles */
  [dir='rtl'] tr th {
    text-align: right !important;
  }

  [dir='rtl'] .v-table td {
    text-align: right !important;
  }

  .position-relative {
    position: relative;
  }
</style>
