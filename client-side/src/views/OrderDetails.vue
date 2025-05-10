<template>
  <!--  -->
  <!-- User Data -->
  <v-row class="px-8" no-gutters>
    <v-col cols="12" :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
      <div class="d-flex align-center">
        <h2
          style="font-size: 1.5rem"
          class="mr-3 custom-heading"
          :class="{
            'ma-3': $i18n.locale === 'ar',
            'ml-0': $i18n.locale !== 'ar'
          }"
        >
          {{ $t('Customer Name') }} :
        </h2>
        <p>{{ order.user?.firstName }} {{ order.user?.lastName }}</p>
      </div>
    </v-col>
  </v-row>

  <!-- Stepper -->
  <div class="px-sm-8 px-0 my-5">
    <v-stepper
      v-model="step"
      alt-labels
      class="elevation-0 custom-stepper"
      :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
    >
      <v-stepper-header>
        <v-stepper-item
          value="1"
          :title="$t('orderStatus.Pending')"
          class="custom-step"
          icon="mdi-clock-outline"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          value="2"
          :title="$t('orderStatus.Processing')"
          class="custom-step"
        >
          <template #icon>
            <v-icon size="28" class="mdi-spin">mdi-loading</v-icon>
          </template>
        </v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          value="3"
          :title="$t('orderStatus.Shipped')"
          class="custom-step"
          icon="mdi-truck-delivery"
        ></v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item
          value="4"
          :title="$t('orderStatus.Delivered')"
          class="custom-step"
          icon="mdi-checkbox-marked-circle-outline"
        ></v-stepper-item>
      </v-stepper-header>
    </v-stepper>
  </div>

  <!-- Order Details -->
  <section class="px-8">
    <h2
      class="custom-heading my-5"
      style="font-size: 1.5rem"
      :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
    >
      {{ $t('Order Details') }}
    </h2>
    <v-row no-gutters :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
      <v-col sm="6" cols="12" class="mb-sm-0 mb-5">
        <div class="d-flex align-center">
          <h3
            class="mr-3 custom-heading font-weight-medium"
            :class="{
              'ma-3': $i18n.locale === 'ar',
              'ml-3': $i18n.locale !== 'ar'
            }"
          >
            {{ $t('Order No.') }}
          </h3>
          <p>{{ order.orderNumber }}</p>
        </div>
      </v-col>

      <v-col sm="6" cols="12">
        <div class="d-flex align-center justify-start justify-sm-end">
          <h3
            class="mr-3 custom-heading font-weight-medium"
            :class="{
              'ma-3': $i18n.locale === 'ar',
              'ml-3': $i18n.locale !== 'ar'
            }"
          >
            {{ $t('Order Date') }}
          </h3>
          <p>{{ order.createdAt }}</p>
        </div>
      </v-col>
    </v-row>
    <div
      v-for="(item, index) in order.orderItems"
      :key="index"
      :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'"
    >
      <div
        v-for="(color, colorIndex) in item.selectedColors"
        :key="'color-' + colorIndex"
      >
        <v-row no-gutters class="mt-5 align-center elevation-1 pa-3 rounded-lg">
          <v-col
            class="mr-10"
            :class="{
              'ma-10': $i18n.locale === 'ar',
              'ma-0': $i18n.locale !== 'ar'
            }"
            cols="10"
            sm="3"
          >
            <div class="image" style="height: 250px">
              <img
                :src="color.image"
                alt=""
                width="100%"
                height="100%"
                class="rounded-lg"
              />
            </div>
          </v-col>
          <v-col cols="6" sm="4">
            <div class="product-data">
              <p>{{ item.brand }}</p>
              <h3 class="my-md-4 my-sm-2 my-3">{{ item.name }}</h3>
              <p>{{ color.colorName }}</p>
            </div>
          </v-col>
          <v-col cols="3" sm="2">
            <div class="quantity d-flex justify-end">
              <p class="text-h6">{{ color.quantity }}</p>
            </div>
          </v-col>
          <v-col cols="3" sm="2">
            <div class="price d-flex justify-end">
              <h3>{{ item.price }}$</h3>
            </div>
          </v-col>
        </v-row>
      </div>
    </div>
  </section>

  <!-- Shipped Details -->
  <section class="px-8" :dir="$i18n.locale === 'ar' ? 'rtl' : 'ltr'">
    <div
      class="mt-16 border-t-lg border-dotted border-b-0 border-e-0 border-s-0 py-10"
    >
      <v-row no-gutters>
        <v-col cols="12" sm="8" class="mb-10 mb-sm-0">
          <h2 class="custom-heading" style="font-size: 1.7rem">
            {{ $t('Payment & Shipping Details') }}
          </h2>
          <div class="mt-8">
            <div class="d-flex align-center">
              <h3
                class="mr-3 custom-heading font-weight-medium"
                :class="{
                  'ma-3': $i18n.locale === 'ar',
                  'ml-3': $i18n.locale !== 'ar'
                }"
              >
                {{ $t('Payment method') }}
              </h3>
              <p>{{ order.shippingMethod.name }}</p>
            </div>

            <div class="d-flex align-center my-3">
              <h3
                class="mr-3 custom-heading font-weight-medium"
                :class="{
                  'ma-3': $i18n.locale === 'ar',
                  'ml-3': $i18n.locale !== 'ar'
                }"
              >
                {{ $t('Deliverd to') }}
              </h3>
              <p>{{ order.user?.firstName }} {{ order.user?.lastName }}</p>
            </div>

            <div class="d-flex align-center">
              <h3
                class="mr-3 custom-heading font-weight-medium"
                :class="{
                  'ma-3': $i18n.locale === 'ar',
                  'ml-3': $i18n.locale !== 'ar'
                }"
              >
                {{ $t('Delivery address') }}
              </h3>
              <p>
                {{ order.shippingAddress?.additionalInfo }}
              </p>
            </div>
          </div>
        </v-col>

        <v-col cols="12" sm="4">
          <div
            class="total-price rounded-lg h-100 pa-sm-8 px-3 py-8 d-flex flex-column justify-space-between jus"
          >
            <div class="d-flex align-center justify-space-between">
              <h4 class="font-weight-medium">{{ $t('Subtotal') }}</h4>
              <p class="font-weight-bold">{{ order.total }}$</p>
            </div>

            <div class="d-flex align-center justify-space-between my-sm-0 my-5">
              <h4 class="font-weight-medium">{{ $t('Shipping Fee') }}</h4>
              <p class="font-weight-bold">{{ order.shippingMethod.cost }}$</p>
            </div>

            <div
              class="d-flex align-center justify-space-between custom-heading"
            >
              <h4 class="font-weight-medium">{{ $t('Total') }}</h4>
              <p class="font-weight-bold">
                {{ +order.total + +order.shippingMethod.cost }}$
              </p>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>
  </section>
</template>

<style scoped>
  .custom-heading {
    color: rgb(var(--v-theme-secondary));
    font-size: 1.2rem;
  }
  :deep(.v-stepper-item__avatar) {
    width: 70px !important;
    height: 70px !important;
    background-color: rgba(var(--v-theme-secondary), 0.1);
    color: rgb(var(--v-theme-secondary));
  }
  :deep(.v-stepper-item__avatar.v-avatar .v-icon) {
    font-size: 2rem !important;
  }
  :deep(.v-stepper-header .v-divider) {
    margin: 60px -52px 0;
  }
  :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
    background-color: rgb(var(--v-theme-secondary));
    color: white;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(var(--v-theme-secondary), 0.4);
    transform: scale(1.1);
    transition: all 0.3s ease;
  }
  :deep(.v-stepper-item--selected .v-stepper-item__title) {
    font-weight: bold;
    color: rgb(var(--v-theme-secondary));
  }
  .total-price {
    background-color: rgba(var(--v-theme-secondary), 0.1);
  }
</style>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useOrderStore } from '../store/order'

  const orderStore = useOrderStore()
  const order = orderStore.selectedOrder
  console.log(order)

  const step = ref(0)
  const statusToStep = {
    Pending: 0,
    Processing: 1,
    Shipped: 2,
    Delivered: 3
  }
  onMounted(() => {
    if (order.status) {
      step.value = statusToStep[order.status] || 0
    }
  })
</script>
