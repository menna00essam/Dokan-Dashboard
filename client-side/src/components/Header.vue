<template>
  <v-app-bar color="background" style="box-shadow: none; position: fixed">
    <v-app-bar-nav-icon v-if="isMobile" @click="$emit('toggle-drawer')" />

    <!-- Improved Breadcrumbs -->
    <v-breadcrumbs
      class="px-4 py-2 breadcrumbs"
      style="width: 100%"
      divider="/"
    >
      <v-breadcrumbs-item
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        :to="crumb.to"
        :disabled="crumb.disabled"
        exact
        class="breadcrumb-item"
        :class="{ 'active-crumb': index === breadcrumbs.length - 1 }"
        style="align-items: center"
      >
        <template v-if="index === 0">
          <v-icon class="me-1" color="secondary" style="font-size: 25px"
            >mdi-home</v-icon
          >
          <span style="font-weight: bold">{{ crumb.text }}</span>
        </template>
        <template v-else> / {{ crumb.text }} </template>
      </v-breadcrumbs-item>
    </v-breadcrumbs>

    <v-spacer></v-spacer>

    <!-- Language Selector -->
    <div
      class="w-100 d-flex"
      :class="$i18n.locale === 'ar' ? 'justify-start' : 'justify-end'"
    >
      <v-btn icon @click="$emit('toggle-settings')">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="mx-2">
            <v-icon>mdi-translate</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="lang in availableLanguages"
            :key="lang.code"
            @click="changeLanguage(lang.code)"
            style="padding: 20px"
            :class="{ 'v-list-item--active': locale === lang.code }"
          >
            <v-list-item-title>{{ lang.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        icon
        @click="toggleTheme"
        :title="isDark ? $t('switchToLight') : $t('switchToDark')"
      >
        <v-icon>{{
          isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'
        }}</v-icon>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import { computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import useThemeToggle from '../composables/useThemeToggle'

  const { locale, t } = useI18n()
  const route = useRoute()
  const { isDark, toggleTheme } = useThemeToggle()

  defineProps(['drawer', 'isMobile'])
  defineEmits(['toggle-drawer'])

  const pageTitle = computed(() => route.meta.title || route.name)

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'French' }
  ]

  const breadcrumbs = computed(() => {
    const crumbs = route.matched
      .filter((r) => r.name && r.meta?.breadcrumb !== false)
      .map((r) => ({
        text: r.meta?.breadcrumb || formatName(r.name),
        to: r.path.includes(':') ? undefined : r.path,
        disabled: false
      }))

    // Add Home as first item
    return [
      {
        text: t('Home'),
        to: '/',
        disabled: false
      },
      ...crumbs
    ]
  })

  function formatName(name) {
    if (typeof name !== 'string') return ''
    return name.replace(/-/g, ' ').replace(/(^|\s)\S/g, (l) => l.toUpperCase())
  }

  onMounted(() => {
    const savedLanguage = localStorage.getItem('userLanguage')
    if (savedLanguage) {
      locale.value = savedLanguage
    }
  })

  const currentLanguageName = computed(() => {
    const lang = availableLanguages.find((l) => l.code === locale.value)
    return lang ? lang.name : ''
  })

  const changeLanguage = (langCode) => {
    locale.value = langCode
    localStorage.setItem('userLanguage', langCode)
  }
</script>

<style scoped>
  .v-list-item--active {
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* RTL support */
  [dir='rtl'] .breadcrumbs {
    direction: ltr;
    justify-content: flex-end;
  }
</style>
