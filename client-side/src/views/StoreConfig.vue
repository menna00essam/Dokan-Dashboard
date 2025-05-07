<script setup>
  import StoreSettings from '../components/Settings/StoreSettings.vue'
  import ShippingConfig from '../components/Settings/ShippingConfig.vue'
  import AdminRoleConfig from '../components/Settings/AdminRoleConfig.vue'
  import Currencies from '../components/Settings/Currencies.vue'
</script>

<template>
  <v-container fluid>
    <StoreSettings></StoreSettings>
    <ShippingConfig />
    <AdminRoleConfig></AdminRoleConfig>
    <Currencies />
  </v-container>
</template>

<style scoped>
  /* Custom card header colors matching your theme */
  .v-card-title.primary {
    background-color: rgb(var(--v-theme-primary));
    color: white;
  }

  .v-card-title.secondary {
    background-color: rgb(var(--v-theme-secondary));
    color: white;
  }

  /* Add some spacing between sections */
  .v-card {
    margin-bottom: 24px;
  }
</style>
