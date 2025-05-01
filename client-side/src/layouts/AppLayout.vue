<template>
  <v-app :dir="isRTL ? 'rtl' : 'ltr'">
    <v-navigation-drawer
      v-model="settingsDrawer"
      :location="isRTL ? 'left' : 'right'"
      :temporary="true"
      width="300"
      class="settings-drawer"
      style="height: 100vh"
    >
      <div class="pa-4">
        <h3 class="mb-4">Customize</h3>

        <!-- Theme -->
        <div>
          <h4 class="mb-4">Theme</h4>
          <v-btn-toggle v-model="theme" mandatory>
            <v-btn
              @click="setTheme('light')"
              :class="{ 'selected-theme': theme === 'light' }"
              >☀</v-btn
            >
            <v-btn
              @click="setTheme('dark')"
              :class="{ 'selected-theme': theme === 'dark' }"
              >🌙</v-btn
            >
          </v-btn-toggle>
        </div>

        <!-- Color -->
        <div class="mt-4">
          <div class="d-flex justify-space-between align-center mb-4">
            <h4>Text Color</h4>
            <v-btn
              variant="text"
              color="error"
              size="small"
              @click="resetColors"
            >
              Reset
            </v-btn>
          </div>
          <v-row>
            <v-col v-for="(color, index) in colors" :key="index">
              <v-btn
                :style="{
                  backgroundColor: color,
                  width: '50px !important',
                  height: '50px !important'
                }"
                @click="setColor(color)"
                icon
                :variant="selectedColor === color ? 'flat' : 'text'"
                :class="{ 'selected-color': selectedColor === color }"
              ></v-btn>
            </v-col>
          </v-row>
        </div>
      </div>
    </v-navigation-drawer>
    <v-layout style="overflow: hidden">
      <v-navigation-drawer
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
          <v-btn
            block
            color="secondary"
            prepend-icon="mdi-logout"
            @click="logout"
          >
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
          @toggle-settings="settingsDrawer = !settingsDrawer"
        />
        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
  import { ref, computed, watch, watchEffect, onMounted } from 'vue'
  import { useDisplay, useTheme } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import Header from '../components/Header.vue'

  const { t, locale } = useI18n()
  const display = useDisplay()
  const themeManager = useTheme()
  const drawer = ref(true)
  const isMobile = computed(() => display.smAndDown.value)
  const isRTL = computed(() => locale.value === 'ar')
  const settingsDrawer = ref(false)

  // Default colors for reset functionality
  const defaultColors = {
    light: {
      text: '#000000', // Default dark text for light theme
      secondary: '#424242' // Default secondary for light theme
    },
    dark: {
      text: '#FFFFFF', // Default light text for dark theme
      secondary: '#BDBDBD' // Default secondary for dark theme
    }
  }

  // Dynamic content margins
  const mainContentStyles = computed(() => ({
    transition: 'margin 0.3s ease'
  }))

  const items = [
    { title: 'dashboard', to: '/dashboard' },
    { title: 'products', to: '/products' },
    { title: 'orders', to: '/orders' },
    { title: 'customers', to: '/customers' },
    { title: 'requests', to: '/requests' },
    { title: 'storeSettings', to: '/config' }
  ]

  const theme = ref('light') // Default theme
  const selectedColor = ref('#000000') // Default text color for light theme

  const colors = [
    '#000000', // Black
    '#2196F3', // Blue
    '#4CAF50', // Green
    '#FF5722', // Orange
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#607D8B' // Blue Grey
  ]

  const setTheme = (selectedTheme) => {
    theme.value = selectedTheme
    themeManager.global.name.value = selectedTheme
  }

  const setColor = (color) => {
    selectedColor.value = color
    // Update text and secondary colors for both themes
    themeManager.themes.value.light.colors.text = color
    themeManager.themes.value.light.colors.secondary = color
    themeManager.themes.value.dark.colors.text = color
    themeManager.themes.value.dark.colors.secondary = color

    localStorage.setItem('textColor', color)
  }

  const resetColors = () => {
    // Reset to default colors
    themeManager.themes.value.light.colors.text = defaultColors.light.text
    themeManager.themes.value.light.colors.secondary =
      defaultColors.light.secondary
    themeManager.themes.value.dark.colors.text = defaultColors.dark.text
    themeManager.themes.value.dark.colors.secondary =
      defaultColors.dark.secondary

    selectedColor.value =
      theme.value === 'light'
        ? defaultColors.light.text
        : defaultColors.dark.text

    localStorage.removeItem('textColor')
  }

  // Initialize theme and color from localStorage
  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    const savedColor = localStorage.getItem('textColor')

    if (savedTheme) {
      theme.value = savedTheme
      themeManager.global.name.value = savedTheme
    }

    if (savedColor) {
      selectedColor.value = savedColor
      setColor(savedColor)
    } else {
      // Set default colors if none saved
      selectedColor.value =
        theme.value === 'light'
          ? defaultColors.light.text
          : defaultColors.dark.text
    }
  })

  // Save theme to localStorage
  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
  })

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

  .settings-drawer {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease,
      right 0.3s ease,
      left 0.3s ease;
    will-change: transform, opacity;
  }

  .settings-drawer.v-navigation-drawer--active {
    opacity: 1;
  }

  .settings-drawer:not(.v-navigation-drawer--active) {
    opacity: 0;
  }
  .selected-theme {
    border: 2px solid #2196f3 !important;
    box-shadow: 0 0 0 1px white inset !important; /* Creates a white inner border */
  }

  .selected-color {
    border: 3px solid #2196f3 !important;
    box-shadow: 0 0 0 2px white inset !important; /* Creates a white inner border */
    transform: scale(1.05);
    transition: all 0.2s ease;
  }
</style>
