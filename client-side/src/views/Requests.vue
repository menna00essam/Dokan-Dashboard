<script setup>
  import { onMounted, ref, computed, watch } from 'vue'
  import { useToast } from 'vue-toastification'
  import { useI18n } from 'vue-i18n'
  import PaginationControls from '../components/Shared/PaginationControls.vue'

  import { useAuthStore } from '../store/auth'
  import { useRequestsStore } from '../store/useRequestsStore'
  import { useDisplay } from 'vuetify'

  const toast = useToast()
  const { t } = useI18n()
  const authStore = useAuthStore()
  const requestsStore = useRequestsStore()
  const { mobile } = useDisplay()

  const initialLoading = ref(true)
  const searchQuery = ref('')
  const debounceTimeout = ref(null)

  // Reactive data
  const page = ref(requestsStore.pagination.currentPage || 1)
  const itemsPerPage = ref(requestsStore.pagination.itemsPerPage || 10)
  const columns = ref([])
  const error = ref(null)
  const loadingUsers = ref({})
  const sortBy = ref('createdAt')
  const sortDirection = ref('desc')

  // Computed properties
  const isSuperAdmin = computed(() => authStore.userRole === 'super_admin')
  const isMobile = computed(() => mobile.value)
  const hasData = computed(() => requestsStore.requests?.length > 0)
  const isLoading = computed(
    () => initialLoading.value || requestsStore.loading
  )

  const fetchRequests = async () => {
    try {
      initialLoading.value = true
      await requestsStore.fetchRequests({
        page: page.value,
        limit: itemsPerPage.value,
        search: searchQuery.value,
        sortBy: sortBy.value,
        sortDirection: sortDirection.value
      })
      console.log('Fetched data:', requestsStore.requests)
    } catch (err) {
      console.error('Fetch error:', err)
      error.value = err.message || t('error.fetchingRequests')
      toast.error(error.value)
    } finally {
      initialLoading.value = false
    }
  }

  const handleSearch = () => {
    clearTimeout(debounceTimeout.value)
    debounceTimeout.value = setTimeout(() => {
      page.value = 1
      requestsStore.setSearchQuery(searchQuery.value)
      fetchRequests()
    }, 500)
  }

  const approve = async (user) => {
    loadingUsers.value[user._id] = true
    try {
      await requestsStore.approveRequest(user._id)
      toast.success(t('userApproved', { name: user.username }))
      await fetchRequests()
    } catch (err) {
      error.value = err.message || t('error.approvingUser')
      toast.error(error.value)
    } finally {
      loadingUsers.value[user._id] = false
    }
  }

  const deny = async (user) => {
    loadingUsers.value[user._id] = true
    try {
      await requestsStore.denyRequest(user._id)
      toast.success(t('userDenied', { name: user.username }))
      await fetchRequests()
    } catch (err) {
      error.value = err.message || t('error.denyingUser')
      toast.error(error.value)
    } finally {
      loadingUsers.value[user._id] = false
    }
  }

  const changePage = (newPage) => {
    page.value = newPage
    fetchRequests()
  }

  const changeItemsPerPage = (newSize) => {
    itemsPerPage.value = newSize
    page.value = 1 // Reset to first page when changing items per page
    fetchRequests()
  }

  const toggleSort = () => {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    page.value = 1
    fetchRequests()
  }

  const getSortIcon = () => {
    return sortDirection.value === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down'
  }

  // Watchers
  watch(searchQuery, handleSearch)

  onMounted(() => {
    columns.value = [t('user'), t('email'), t('actions')]
    fetchRequests()
  })
</script>

<template>
  <v-container v-if="isSuperAdmin" fluid>
    <v-row no-gutters>
      <v-col cols="12">
        <v-card flat class="rounded-0">
          <v-card-title
            class="primary"
            :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
          >
            <div
              class="d-flex pa-2 align-center"
              :class="{ 'flex-row-reverse': $i18n.locale === 'ar' }"
            >
              <v-icon
                class="mx-2"
                :left="$i18n.locale !== 'ar'"
                :right="$i18n.locale === 'ar'"
              >
                mdi-account-cog
              </v-icon>
              {{ $t('pendingUserRequests') }}
            </div>

            <v-spacer></v-spacer>

            <v-text-field
              v-model="searchQuery"
              :label="t('search')"
              :prepend-inner-icon="
                $i18n.locale === 'ar' ? undefined : 'mdi-magnify'
              "
              :append-inner-icon="
                $i18n.locale === 'ar' ? 'mdi-magnify' : undefined
              "
              variant="outlined"
              density="comfortable"
              clearable
              single-line
              hide-details
              class="search-field"
              :style="{ 'max-width': isMobile ? '100%' : '300px' }"
              :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
              :placeholder="t('searchPlaceholder')"
              @input="handleSearch"
            />
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text style="padding: 0">
            <v-data-table
              :headers="[
                {
                  title: t('user'),
                  key: 'user',
                  align: 'start',
                  sortable: false
                },
                {
                  title: t('email'),
                  key: 'email',
                  align: 'start',
                  sortable: false
                },
                {
                  title: t('requestDate'),
                  key: 'createdAt',
                  align: 'start',
                  sortable: true
                },
                {
                  title: t('actions'),
                  key: 'actions',
                  align: 'start',
                  sortable: false
                }
              ]"
              :items="hasData ? requestsStore.requests : []"
              :loading="isLoading"
              :items-per-page="itemsPerPage"
              :page="page"
              hide-default-footer
              :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
              class="elevation-1"
              :server-items-length="requestsStore.pagination.total"
              fixed-header
              density="comfortable"
            >
              <template v-slot:item.user="{ item }">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="48" class="mx-4">
                    <v-img :src="item.avatar" :alt="item.username" />
                  </v-avatar>
                  <div>
                    <span class="text-h6 d-block">{{ item.username }}</span>
                    <span v-if="item.fullName" class="text-caption text-grey">
                      {{ item.fullName }}
                    </span>
                  </div>
                </div>
              </template>

              <template v-slot:item.email="{ item }">
                <span class="text-h6">{{ item.email }}</span>
              </template>

              <template v-slot:item.createdAt="{ item }">
                <span class="text-h6">
                  {{ new Date(item.createdAt).toLocaleDateString() }}
                  <v-tooltip
                    :text="new Date(item.createdAt).toLocaleString()"
                    location="bottom"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" small class="ml-1">
                        mdi-information-outline
                      </v-icon>
                    </template>
                  </v-tooltip>
                </span>
              </template>

              <template v-slot:item.actions="{ item }">
                <div
                  class="d-flex"
                  :class="{
                    'flex-column': isMobile,
                    'align-center': isMobile
                  }"
                >
                  <v-btn
                    color="success"
                    variant="tonal"
                    :class="[
                      $i18n.locale === 'ar' ? 'ml-2' : 'mr-2',
                      isMobile ? 'mb-2' : ''
                    ]"
                    size="large"
                    @click="approve(item)"
                    :prepend-icon="
                      $i18n.locale === 'ar' ? undefined : 'mdi-check'
                    "
                    :append-icon="
                      $i18n.locale === 'ar' ? 'mdi-check' : undefined
                    "
                    :loading="loadingUsers[item._id]"
                  >
                    {{ t('approve') }}
                  </v-btn>

                  <v-btn
                    color="error"
                    variant="tonal"
                    size="large"
                    @click="deny(item)"
                    :prepend-icon="
                      $i18n.locale === 'ar' ? undefined : 'mdi-close'
                    "
                    :append-icon="
                      $i18n.locale === 'ar' ? 'mdi-close' : undefined
                    "
                    :loading="loadingUsers[item._id]"
                  >
                    {{ t('deny') }}
                  </v-btn>
                </div>
              </template>

              <template v-slot:no-data>
                <div
                  class="d-flex flex-column align-center justify-center py-12"
                >
                  <v-icon size="96" color="grey lighten-1">
                    mdi-account-off
                  </v-icon>
                  <p class="text-h4 grey--text mt-4">
                    {{
                      searchQuery ? t('noResultsFound') : t('noPendingRequests')
                    }}
                  </p>
                  <p class="text grey--text mt-4">
                    {{
                      searchQuery
                        ? t('tryDifferentSearch')
                        : t('allRequestsProcessed')
                    }}
                  </p>
                </div>
              </template>
            </v-data-table>

            <PaginationControls
              v-model:page="page"
              v-model:itemsPerPage="itemsPerPage"
              :total-items="requestsStore.pagination.total"
              @update:page="changePage"
              @update:itemsPerPage="changeItemsPerPage"
              :direction="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .hover-row:hover {
    background-color: rgba(0, 0, 0, 0.02);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .v-card-title {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  tr td {
    padding: 20px !important;
  }
  :deep(.v-data-table__td) {
    padding: 16px !important;
  }
  .cursor-pointer {
    cursor: pointer;
  }

  /* Apply only when dir="rtl" */
  [dir='rtl'] tr th {
    text-align: right !important;
  }

  /* Optional: Add other RTL-specific table styles */
  [dir='rtl'] .v-data-table td {
    text-align: right !important;
  }

  [dir='rtl'] .v-data-table-header__content {
    justify-content: flex-end !important;
  }

  .v-pagination {
    margin: 0;
  }

  [dir='rtl'] .v-pagination {
    direction: ltr; /* Keep pagination LTR even in RTL languages */
  }

  @media (max-width: 600px) {
    .v-card-title {
      flex-direction: column;
      align-items: flex-start;
    }

    .search-field {
      width: 100%;
      margin-top: 12px;
    }

    .v-btn {
      width: 100%;
    }
  }

  /* RTL specific styles */
  [dir='rtl'] .search-field :deep(.v-field__input) {
    text-align: right;
    direction: rtl;
  }

  [dir='rtl'] .search-field :deep(input::placeholder) {
    text-align: right !important;
  }

  [dir='rtl'] .search-field :deep(.v-field__append-inner) {
    padding-left: 0;
    padding-right: 8px;
  }

  /* LTR specific styles */
  [dir='ltr'] .search-field :deep(.v-field__input) {
    text-align: left;
  }

  [dir='ltr'] .search-field :deep(input::placeholder) {
    text-align: left;
  }

  /* General styles */
  .search-field {
    transition: all 0.3s ease;
  }

  /* Mobile adjustments */
  @media (max-width: 600px) {
    .search-field {
      width: 100%;
      margin-top: 12px;
    }
  }
</style>
