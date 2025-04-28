<script setup>
import { ref, onMounted } from 'vue';
import { Line as LineChart } from 'vue-chartjs';
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
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler);

const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const revenueChartData = ref(null);
const ordersChartData = ref(null);
const avgOrderValueChartData = ref(null);

const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    }
};

const kpis = ref({
    totalRevenue: 10000,
    numberOfOrders: 50,
    averageOrderValue: 200,
    newCustomers: 10,
    newProducts: 5,
    newOrders: 15
});
const orders = ref([
    {
        orderId: "ORD12345",
        customerName: "Ahmed Mohamed",
        date: "2025-04-21",
        status: "Shipped",
        amount: 2,
        products: ["chair", "ped"]
    },
    {
        orderId: "ORD12346",
        customerName: "Sara Ali",
        date: "2025-04-20",
        status: "Pending",
        amount: 1,
        products: ["chair", "ped"]
    },
    {
        orderId: "ORD12346",
        customerName: "Sara Ali",
        date: "2025-04-20",
        status: "Pending",
        amount: 1,
        products: ["chair", "ped"]
    },
    {
        orderId: "ORD12346",
        customerName: "Sara Ali",
        date: "2025-04-20",
        status: "Pending",
        amount: 3,
        products: ["chair", "ped"]
    },

]);
const newCustomers = ref([
    { id: 1, name: 'John Doe', email: 'john@example.com', dateJoined: '2025-04-20', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', dateJoined: '2025-04-21', status: 'Inactive' },
]);

const newProducts = ref([
    { id: 101, name: 'Product 1', category: 'Electronics', price: 199.99, dateAdded: '2025-04-18', status: 'Available' },
    { id: 102, name: 'Product 2', category: 'Clothing', price: 49.99, dateAdded: '2025-04-19', status: 'Out of Stock' },
]);


onMounted(() => {

    revenueChartData.value = {
        labels: chartLabels,
        datasets: [{
            label: 'Revenue',
            data: [2100, 2500, 1800, 3000, 2700, 1800, 1500],
            borderColor: '#42A5F5',
            backgroundColor: 'rgba(66,165,245,0.2)',
            fill: true,
            pointHoverRadius: 12
        }]
    };
    ordersChartData.value = {
        labels: chartLabels,
        datasets: [{
            label: 'Orders',
            data: [18, 20, 17, 25, 22, 20, 18],
            borderColor: '#66BB6A',
            backgroundColor: 'rgba(102,187,106,0.2)',
            fill: true,
            pointHoverRadius: 12
        }]
    };
    avgOrderValueChartData.value = {
        labels: chartLabels,
        datasets: [{
            label: 'Avg Order Value',
            data: [115, 125, 130, 120, 135, 122, 110],
            borderColor: '#FFA726',
            backgroundColor: 'rgba(255,167,38,0.2)',
            fill: true,
 tension:.4,
                // borderDash:[5,5],
            pointHoverRadius: 12
        }]
    };

});
</script>
<template>
    <v-container fluid>
        <v-row class="mb-6" justify="center">
            <v-col cols="12" sm="6" md="4">
                <v-card elevation="2" class="pa-4 text-center">
                    <h3 class="mb-2 text-blue">Total Revenue</h3>
                    <div class="text-h4 font-weight-bold">${{ kpis.totalRevenue }}</div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="4">
                <v-card elevation="2" class="pa-4 text-center">
                    <h3 class="mb-2 text-orange-lighten-1">Number of Orders</h3>
                    <div class="text-h4 font-weight-bold">{{ kpis.numberOfOrders }}</div>
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="4">
                <v-card elevation="2" class="pa-4 text-center">
                    <h3 class="mb-2 text-green">Average Order Value</h3>
                    <div class="text-h4 font-weight-bold">${{ kpis.averageOrderValue }}</div>
                </v-card>
            </v-col>
        </v-row>

        <v-row class="mb-6">
            <v-col cols="12" sm="6" md="6" lg="4">
                <v-card
                    class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
                    elevation="2">
                    <h3 class="mb-2">Revenue Over Last Week</h3>
                    <LineChart v-if="revenueChartData" :data="revenueChartData" :options="defaultChartOptions" />
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="6" lg="4" class="m-auto">
                <v-card
                    class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
                    elevation="2">
                    <h3 class="mb-2">Orders Over Last Week</h3>
                    <LineChart v-if="ordersChartData" :data="ordersChartData" :options="defaultChartOptions" />
                </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="6" lg="4">
                <v-card
                    class="pb-12 pt-4 px-4 pb-sm-12 pt-sm-2 pb-md-12 pt-md-2 pt-lg-2 pb-lg-12 chart-container m-auto"
                    elevation="2">
                    <h3             class="mb-2 ">Avg Order Value Over Last Week</h3>
                    <LineChart v-if="avgOrderValueChartData" :data="avgOrderValueChartData"
                        :options="defaultChartOptions" />
                </v-card>
            </v-col>
        </v-row>



        <v-row class="mb-6 align-center justify-center">
            <v-col cols="12">
                <v-card class="pa-4" elevation="2">
                    <h4 class="mb-4">New Orders</h4>
                    <v-table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Products</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <!-- <th>Action</th> -->
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(o, index) in orders" :key="index">
                                <td>{{ o.orderId }}</td>
                                <td>{{ o.customerName }}</td>
                                <td>{{ o.products.join(', ') }}</td>
                                <td>{{ o.date }}</td>
                                <td>
                                    <v-chip :color="o.status === 'Pending' ? 'orange' : 'green'" class="text-white"
                                        size="small">
                                        {{ o.status }}
                                    </v-chip>
                                </td>
                                <td>{{ o.amount }}</td>
                                <!-- <td>
                                    <v-btn size="x-small" variant="outlined" color="primary">View</v-btn>
                                </td> -->
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>
        </v-row>



        <v-row class="mb-6" justify="center" gap='1'>

            <v-col cols="12" sm="6" md="6">
                <v-card class="pa-4" elevation="2">
                    <h4 class="mb-4">New Customers</h4>
                    <v-table>
                        <thead>
                            <tr>
                                <th>Customer ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Date Joined</th>
                                <th>Status</th>
                                <!-- <th>Action</th> -->
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(customer, index) in newCustomers" :key="index">
                                <td>{{ customer.id }}</td>
                                <td>{{ customer.name }}</td>
                                <td>{{ customer.email }}</td>
                                <td>{{ customer.dateJoined }}</td>
                                <td>
                                    <v-chip :color="customer.status === 'Active' ? 'green' : 'red'" class="text-white"
                                        size="small">
                                        {{ customer.status }}
                                    </v-chip>
                                </td>
                                <!-- <td>
                                    <v-btn size="x-small" variant="outlined" color="primary">View</v-btn>
                                </td> -->
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>


            <v-col cols="12" sm="6" md="6">
                <v-card class="pa-4" elevation="2">
                    <h4 class="mb-4">New Products</h4>
                    <v-table>
                        <thead>
                            <tr>
                                <th>Product ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Date Added</th>
                                <th>Status</th>
                                <!-- <th>Action</th> -->
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(product, index) in newProducts" :key="index">
                                <td>{{ product.id }}</td>
                                <td>{{ product.name }}</td>
                                <td>{{ product.category }}</td>
                                <td>${{ product.price }}</td>
                                <td>{{ product.dateAdded }}</td>
                                <td>
                                    <v-chip :color="product.status === 'Available' ? 'green' : 'red'" class="text-white"
                                        size="small">
                                        {{ product.status }}
                                    </v-chip>
                                </td>
                                <!-- <td>
                                    <v-btn size="x-small" variant="outlined" color="primary">View</v-btn>
                                </td> -->
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
    height: 380px;
    max-width: 400px;
}

.sm-chart-container {
    width: 100%;
    height: 400px;
    max-width: 400px;
}
</style>