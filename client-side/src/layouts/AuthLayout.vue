<template>
  <v-layout class="auth-layout">
    <!-- Background (optional) -->
    <!-- <v-img
      src="@/assets/auth-bg.jpg"
      cover
      class="auth-bg"
    ></v-img> -->

    <!-- Centered card for auth forms -->
    <v-container class="fill-height">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="auth-card pa-6" elevation="12">
            <!-- Logo -->
            <div class="text-center mb-6">
              <!-- <v-img
                src="@/assets/logo.png"
                max-height="60"
                contain
              ></v-img> -->
              logo
            </div>

            <!-- Dynamic slot for login/register/etc. -->
            <slot></slot>

            <!-- Footer links -->
            <div class="text-center mt-4">
              <router-link 
                v-if="$route.name !== 'login'"
                to="/login"
                class="text-caption"
              >
                Already have an account? Sign In
              </router-link>
              <router-link 
                v-if="$route.name !== 'register'"
                to="/register"
                class="text-caption ml-2"
              >
                Need an account? Sign Up
              </router-link>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-layout>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  position: relative;
}
.auth-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.2;
}
.auth-card {
  position: relative;
  z-index: 1;
}
</style>