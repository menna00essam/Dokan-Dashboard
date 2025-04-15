<template>
  <v-app>
    <v-layout>
      <!-- App bar -->
      <!-- <Header
        :drawer="drawer"
        @toggle-drawer="drawer = !drawer"
        :isMobile="isMobile"
      /> -->

      <!-- Sidebar drawer -->
      <v-navigation-drawer
        color="primary"
        v-model="drawer"
        :permanent="!isMobile"
        :temporary="isMobile"
      >
        <div class="d-flex pa-2">
          <h2>DUKAN</h2>
        </div>
        <v-list style="padding: 0">
          <v-list-item
            v-for="item in items"
            :key="item.value"
            :to="item.to"
            link
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Page content -->
      <v-main>
        <Header
          :drawer="drawer"
          @toggle-drawer="drawer = !drawer"
          :isMobile="isMobile"
        />

        <router-view />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
import { ref, computed, watchEffect } from "vue";
import { useDisplay } from "vuetify";
import Header from "../components/Header.vue";

const display = useDisplay();
const isMobile = computed(() => display.smAndDown.value);
const drawer = ref(true);

const items = [
  { title: "Dashboard", to: "/dashboard" },
  { title: "Products", to: "/products" },
  { title: "Orders", to: "/orders" },
];

watchEffect(() => {
  drawer.value = !isMobile.value;
});
</script>
<style>
.v-application {
  transition: background-color 0.3s ease, color 0.1s ease;
}
</style>
