<template>
  <v-app :dir="isRTL ? 'rtl' : 'ltr'">
    <v-layout style="overflow: hidden">
      <v-navigation-drawer
        color="primary"
        v-model="drawer"
        :permanent="!isMobile"
        :temporary="isMobile"
        :location="isRTL ? 'right' : 'left'"
        style="
          height: 100vh;
          position: fixed;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        "
        class="custom-drawer"
      >
        <!-- Drawer content -->
        <div class="pa-5">
          <h2>{{ t('appName') }}</h2>
        </div>
        <v-list style="padding: 0">
          <v-list-item
            v-for="item in items"
            :key="item.title"
            :to="item.to"
            link
          >
            <v-list-item-title>{{ t(item.title) }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Logout Button -->
        <div
          style="
            position: fixed;
            bottom: 0;
            width: 100%;
            padding: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.12);
          "
        >
          <v-btn block color="secondary" prepend-icon="mdi-logout" @click="logout">
            {{ t('logout') }}
          </v-btn>
        </div>
      </v-navigation-drawer>

      <!-- Main Content -->
      <v-main :style="mainContentStyles">
        <Header
          :drawer="drawer"
          @toggle-drawer="toggleDrawer"
          :isMobile="isMobile"
          :isRTL="isRTL"
        />
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
  import { ref, computed, watch, watchEffect } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import Header from '../components/Header.vue'

  const { t, locale } = useI18n()
  const display = useDisplay()
  const drawer = ref(true)
  const isMobile = computed(() => display.smAndDown.value)
  const isRTL = computed(() => locale.value === 'ar')

  // Dynamic content margins
  const mainContentStyles = computed(() => ({
    transition: 'margin 0.3s ease'
  }))

  const items = [
    { title: 'dashboard', to: '/dashboard' },
    { title: 'products', to: '/products' },
    { title: 'orders', to: '/orders' },
    { title: 'customers', to: '/CustomerManagement' },
    { title: 'requests', to: '/requests' },
    { title: 'storeSettings', to: '/config' }
  ]

  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }

  const logout = () => {
    console.log('Logging out...')
  }

  // Handle drawer for mobile
  watchEffect(() => {
    drawer.value = !isMobile.value
  })

  // Handle RTL/LTR changes
  watch(
    locale,
    (newLang) => {
      document.documentElement.lang = newLang
      document.documentElement.dir = isRTL.value ? 'rtl' : 'ltr'
    },
    { immediate: true }
  )
</script>

<style scoped>
  /* RTL specific styles */
  .custom-drawer {
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      right 0.3s ease,
      left 0.3s ease !important;
  }

  .v-application[dir='rtl'] {
    text-align: right !important;
  }

  /* Drawer positioning */
  .v-navigation-drawer {
    transition:
      right 0.3s ease,
      left 0.3s ease;
  }

  .v-navigation-drawer--right {
    right: 0;
    left: auto !important;
  }

  .v-navigation-drawer--left {
    left: 0;
    right: auto !important;
  }
  /* Mobile drawer animation */
  .v-navigation-drawer--is-mobile {
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      right 0.3s ease,
      left 0.3s ease !important;
  }

  /* Main content transition */
  .v-main {
    transition: margin 0.3s ease !important;
  }
</style>
