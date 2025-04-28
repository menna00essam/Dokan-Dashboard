<template>
  <v-app-bar color="background" style="box-shadow: none; position: fixed">
    <v-app-bar-nav-icon v-if="isMobile" @click="$emit('toggle-drawer')" />
    <v-spacer></v-spacer>

    <!-- Language Selector -->
    <div
      class="w-100 d-flex"
      :class="$i18n.locale === 'ar' ? 'justify-start' : 'justify-end'"
    >
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="mx-2">
            <v-icon>mdi-translate</v-icon>
            <span v-if="isMobile" class="ml-1">{{ currentLanguageName }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="lang in availableLanguages"
            :key="lang.code"
            @click="changeLanguage(lang.code)"
            style="padding: 20px;"
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

  const { locale } = useI18n()
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

  // جلب اللغة المحفوظة عند تحميل المكون
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
    // window.location.reload() // إعادة تحميل الصفحة لتطبيق التغييرات بالكامل
  }
</script>

<style scoped>
  .v-list-item--active {
    background-color: rgba(0, 0, 0, 0.1);
  }
</style>
