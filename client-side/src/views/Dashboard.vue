<script setup>
  import { ref, onMounted, watch, computed, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import axios from 'axios'
  import { Line as LineChart } from 'vue-chartjs'
  import { useAuthStore } from '../store/auth'
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  } from 'chart.js'

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Filler
  )

  const chartLabels = ref([])
  const revenueChartData = ref(null)
  const ordersChartData = ref(null)
  const avgOrderValueChartData = ref(null)
  const authStore = useAuthStore()
  const cardHeight = ref('50vh')

  const userName = computed(() => {
    const email = authStore.user?.email || 'Guest'
    return email.split('@')[0]
  })

  const { t, locale } = useI18n()

  const updateChartLabels = () => {
    chartLabels.value = [
      t('Mon'),
      t('Tue'),
      t('Wed'),
      t('Thu'),
      t('Fri'),
      t('Sat'),
      t('Sun')
    ]
  }

  const updateChartData = (weeklyStatsResponse) => {
    revenueChartData.value = {
      labels: chartLabels.value,
      datasets: [
        {
          label: t('Revenue'),
          data: weeklyStatsResponse.data.map((day) => day.revenue),
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66,165,245,0.2)',
          tension: 0.4,
          fill: true,
          pointHoverRadius: 12
        }
      ]
    }

    ordersChartData.value = {
      labels: chartLabels.value,
      datasets: [
        {
          label: t('Orders'),
          data: weeklyStatsResponse.data.map((day) => day.orders),
          borderColor: '#FFA726',
          backgroundColor: 'rgba(255,167,38,0.2)',
          tension: 0.4,
          fill: true,
          pointHoverRadius: 12
        }
      ]
    }

    avgOrderValueChartData.value = {
      labels: chartLabels.value,
      datasets: [
        {
          label: t('AvgOrderValue'),
          data: weeklyStatsResponse.data.map((day) => day.avgOrderValue),
          borderColor: '#66BB6A',
          backgroundColor: 'rgba(102,187,106,0.2)',
          fill: true,
          tension: 0.4,
          pointHoverRadius: 12
        }
      ]
    }
  }

  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  }

  const kpis = ref({})
  const orders = ref([])
  const newCustomers = ref([])
  const newProducts = ref([])

  const filterOrders = ref('All')
  const isLoading = ref(true)
  const isError = ref(false)

  const filteredOrders = computed(() => {
    if (filterOrders.value === 'All') return orders.value
    return orders.value.filter((order) => order.status === filterOrders.value)
  })
  const updateCardHeight = () => {
    const width = window.innerWidth
    if (width < 600) {
      cardHeight.value = '25vh'
    } else if (width >= 600 && width < 960) {
      cardHeight.value = '30vh'
    } else if (width >= 960 && width < 1264) {
      cardHeight.value = '30vh'
    } else {
      cardHeight.value = '25vh'
    }
  }

  onMounted(async () => {
    updateCardHeight()
    window.addEventListener('resize', updateCardHeight)
    try {
      updateChartLabels()

      const revenueResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/revenue'
      )
      const ordersResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/orders'
      )
      const avgOrderValueResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/avg-order-value'
      )
      const weeklyStatsResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/weekly-stats'
      )

      const ordersDataResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/neworders'
      )
      const customersDataResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/customers'
      )
      const productsDataResponse = await axios.get(
        'https://dokan-dashboard.onrender.com/dashboard/stats/products'
      )

      kpis.value = {
        totalRevenue: revenueResponse.data.totalRevenue,
        numberOfOrders: ordersResponse.data.orderCount,
        averageOrderValue: avgOrderValueResponse.data.avgOrderValue
      }

      updateChartData(weeklyStatsResponse)

      orders.value = ordersDataResponse.data.data.orders
      newCustomers.value = customersDataResponse.data.data.users
      newProducts.value = productsDataResponse.data.data.products
      console.log(newProducts.value)

      isLoading.value = false
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      isError.value = true
      isLoading.value = false
    }
  })
  watch(locale, async () => {
    await nextTick()
    updateChartLabels()
    const weeklyStatsResponse = await axios.get(
      'https://dokan-dashboard.onrender.com/dashboard/stats/weekly-stats'
    )
    updateChartData(weeklyStatsResponse)
  })
  const headers = computed(() => [
    { text: t('OrderID'), value: 'orderNumber' },
    { text: t('Customer'), value: 'user' },
    { text: t('Products'), value: 'products' },
    { text: t('Date'), value: 'createdAt' },
    { text: t('Status'), value: 'status' },
    { text: t('Amount'), value: 'amount' }
  ])
  console.log(headers)
</script>

<template>
  <v-container fluid>
    <template v-if="isLoading">
      <v-card class="pa-4" elevation="2">
        <v-skeleton-loader type="table" class="my-4"></v-skeleton-loader>
        <div class="d-flex justify-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
            class="mb-4"
          ></v-progress-circular>
        </div>
      </v-card>
    </template>

    <v-row v-if="isError">
      <v-col
        cols="12"
        class="text-center d-flex align-center justify-center"
        style="height: 80vh; flex-direction: column"
      >
        <div class="error-message">
          <v-icon color="red" size="64">mdi-alert-circle-outline</v-icon>
          <p class="text-h7" style="color: red">
            Error fetching data. Please try again later.
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <v-container fluid v-if="!isLoading && !isError">
    <!-- greeting cards -->
    <v-row class="mb-6 mt-6 relative">
      <v-col cols="12" sm="6" md="6" lg="6">
        <v-card
          class="px-15 py-12 greeting-card text-center"
          elevation="2"
          :style="{ height: cardHeight }"
        >
          <div class="">
            <h3 class="mb-2">
              {{ $t('visitors') }}
            </h3>
            <h6 class="text-h6 font-weight-semi-bold">
              <p>2000</p>
            </h6>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="6">
        <v-card
          class="px-15 py-4 card-with-img text-center greeting-card"
          elevation="2"
          :style="{ height: cardHeight }"
        >
          <div class="greeting">
            <h3 class="mb-2">
              <p>{{ $t('greeting.hello') }} {{ userName }}</p>
            </h3>
            <h6 class="text-h6 font-weight-semi-bold">
              <p>{{ $t('greeting.welcome') }}</p>
            </h6>
          </div>
          <div class="img-wrapper ml-4">
            <img
              class="girlImg"
              src="/3d-female-character-waving-DBC38tAu.png"
              alt=""
            />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- cards -->
    <v-row class="mb-6 relative" justify="center">
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <h3 class="mb-2 text-blue">{{ t('TotalRevenue') }}</h3>
          <div class="text-h4 font-weight-bold">${{ kpis.totalRevenue }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <h3 class="mb-2 text-orange-lighten-1">{{ t('NumberofOrders') }}</h3>
          <div class="text-h4 font-weight-bold">{{ kpis.numberOfOrders }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card elevation="2" class="pa-4 text-center">
          <h3 class="mb-2 text-green">{{ t('AverageOrderValue') }}</h3>
          <div class="text-h4 font-weight-bold">
            ${{ kpis.averageOrderValue }}
          </div>
        </v-card>
      </v-col>
    </v-row>
    <!-- charts -->
    <v-row class="mb-6" justify-center>
      <v-col cols="12" sm="6" md="6" lg="4" class="m-auto center-on-sm">
        <v-card
          class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
          elevation="2"
        >
          <h3 class="mb-4">{{ t('RevenueOverLastWeek') }}</h3>
          <div class="line-chart">
            <LineChart
              v-if="revenueChartData"
              :data="revenueChartData"
              :options="defaultChartOptions"
            />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" class="m-auto center-on-sm">
        <v-card
          class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
          elevation="2"
        >
          <h3 class="mb-4">{{ t('OrdersOverLastWeek') }}</h3>
          <div class="line-chart">
            <LineChart
              v-if="ordersChartData"
              :data="ordersChartData"
              :options="defaultChartOptions"
            />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="6" lg="4" class="m-auto center-on-sm">
        <v-card
          class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
          elevation="2"
        >
          <h3 class="mb-4">{{ t('AvgOrderValueOverLastWeek') }}</h3>
          <div class="line-chart">
            <LineChart
              v-if="avgOrderValueChartData"
              :data="avgOrderValueChartData"
              :options="defaultChartOptions"
            />
          </div>
        </v-card>
      </v-col>
    </v-row>
    <!-- tables -->
    <!-- order table -->
    <v-row class="mb-6 align-center justify-center">
      <v-col cols="12">
        <v-card class="pa-4" elevation="2">
          <h4 class="mb-4">{{ t('NewOrders') }}</h4>
          <v-table>
            <thead>
              <tr>
                <th>{{ t('OrderID') }}</th>
                <th>{{ t('Customer') }}</th>
                <th>{{ t('Products') }}</th>
                <th>{{ t('Date') }}</th>
                <th>{{ t('Status') }}</th>
                <th>{{ t('Amount') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(o, index) in orders" :key="index">
                <td>{{ o.orderNumber }}</td>
                <td>{{ o.user.firstName + ' ' + o.user.lastName }}</td>
                <td>{{ o.orderItems[0].name }}</td>
                <td>{{ o.createdAt }}</td>
                <td>
                  <v-chip
                    :color="o.status === 'Pending' ? 'orange' : 'green'"
                    class="text-white"
                    size="small"
                  >
                    {{ o.status }}
                  </v-chip>
                </td>
                <td>{{ o.orderItems.length }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- <v-row class="mb-6 align-center justify-center">
            <v-data-table :headers="headers" :items="orders" :items-per-page="5" class="elevation-1">
                <template #item.user="{ item }">
                    {{ item.user?.firstName || '' }} {{ item.user?.lastName || '' }}
                </template>

<template #item.products="{ item }">
                    {{ item.orderItems[0]?.name || '' }}
                </template>

<template #item.createdAt="{ item }">
                    {{ new Date(item.createdAt).toLocaleDateString() }}
                </template>

<template #item.status="{ item }">
                    <v-chip :color="item.status === 'Pending' ? 'orange' : 'green'" class="text-white" size="small">
                        {{ item.status }}
                    </v-chip>
                </template>

<template #item.amount="{ item }">
                    {{ item.orderItems.length }}
                </template>
</v-data-table>
</v-row> -->

    <!-- 2tables -->
    <v-row class="mb-6" justify="center" gap="1">
      <!-- customer table -->
      <v-col cols="12" sm="6" md="6">
        <v-card class="pa-4" elevation="2">
          <h4 class="mb-4">{{ t('NewCustomers') }}</h4>
          <v-table height="300px">
            <thead>
              <tr>
                <th>{{ t('CustomerID') }}</th>
                <th>{{ t('Name') }}</th>
                <th>{{ t('Email') }}</th>
                <th>{{ t('DateJoined') }}</th>
                <th>{{ t('Status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(customer, index) in newCustomers" :key="index">
                <td>{{ customer.id }}</td>
                <td>
                  {{
                    customer.firstName && customer.lastName
                      ? customer.firstName + ' ' + customer.lastName
                      : ''
                  }}
                </td>
                <td>{{ customer.email }}</td>
                <td>{{ new Date(customer.joinDate).toLocaleDateString() }}</td>
                <td>
                  <v-chip
                    :color="customer.status === 'Active' ? 'green' : 'red'"
                    class="text-white"
                    size="small"
                  >
                    {{ customer.status }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <!-- product table -->
      <v-col cols="12" sm="6" md="6">
        <v-card class="pa-4" elevation="2">
          <h4 class="mb-4">{{ t('NewProducts') }}</h4>
          <v-table height="300px">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Subtitle</th>
                <th>Price</th>
                <th>Sale</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(product, index) in newProducts" :key="index">
                <td>{{ product._id }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.subtitle }}</td>
                <td>{{ product.price }}</td>
                <td>{{ product.sale }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
  .chart-container {
    width: 100%;
    height: 400px;
    max-width: 400px;
    position: relative;
  }

  .error-message {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }

  .error-message v-icon {
    margin-bottom: 20px;
  }

  .error-message p {
    font-size: 18px;
    color: red;
    font-weight: 600;
  }

  .line-chart {
    height: 320px;
  }

  @media (max-width: 599px) {
    .center-on-sm {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .card-with-img {
    position: relative;
    overflow: visible;

    display: flex;
  }

  .img-wrapper {
    max-width: 120px;
    position: absolute;
    top: -45px;
    left: -40px;
  }

  .girlImg {
    height: 200px;
    width: auto;
  }

  :dir(rtl) .img-wrapper {
    inset-inline-start: auto;
    inset-inline-end: 5px;
  }

  /* .girlImg {
    height: 200px;
    width: auto;
} */

  :dir(rtl) .img-wrapper {
    inset-inline-start: auto;
    inset-inline-end: 5px;
  }

  .v-data-table {
    min-height: 300px;
  }

  .greeting {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .greeting-card {
    height: 120px;
    display: flex;
    justify-content: center;
  }
</style>
