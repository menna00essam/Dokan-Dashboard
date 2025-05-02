import { createRouter, createWebHistory } from 'vue-router'

// Layouts
import AuthLayout from '../layouts/AuthLayout.vue'
import MainLayout from '../layouts/AppLayout.vue'

// Views
import NotFound from "../views/NotFound.vue";
import AddProduct from "../views/AddProduct.vue";
import EditProduct from "../views/EditProduct.vue";
import Dashboard from '../views/Dashboard.vue'
import Products from '../views/Products.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Orders from '../views/Orders.vue'
import Pending from '../views/Pending.vue'
import CustomerManagement from '../views/CustomerManagement.vue'
import CustomerDetails from '../views/CustomerDetails.vue'
import StoreConfig from '../views/StoreConfig.vue'
import Requests from '../views/Requests.vue'
import EditCustomer from '../views/EditCustomer.vue'
const routes = [
  {
    path: '/auth',
    component: AuthLayout,
    meta: { public: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: Login
      },
      {
        path: '/login',
        redirect: '/auth/login'
      },
      {
        path: 'register',
        name: 'register',
        component: Register
      },
      {
        path: '/register',
        redirect: '/auth/register'
      },
      {
        path: 'pending',
        name: 'pending',
        component: Pending
      },
      {
        path: '/pending',
        redirect: '/auth/pending'
      }
    ]
  },

  // Protected Routes (uses MainLayout)
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard
      },
      {
        path: 'dashboard',
        redirect: { name: 'dashboard' }
      },
      {
        path: 'products',
        name: 'Products',
        component: Products
      },
      {
        path: 'orders',
        name: 'orders',
        component: Orders
      },
      {
        path: 'config',
        name: 'Configration',
        component: StoreConfig
      },
      {
        path: 'requests',
        name: 'Requests',
        component: Requests
      },
      {
        path: 'customers',
        name: 'customers',
        component: CustomerManagement,
        props: true
      },
      {
        path: '/customers/edit/:id',
        name: 'edit-customer',
        props: true,
        component: EditCustomer
      },
      {
        path: "addproducts",
        name: "Addproducts",
        component:AddProduct
      },
      {
        path: "editproducts/:sku/",
        name: "editproducts",
        component:EditProduct
      },
      {
        path: '/customers/:id',
        name: 'customer-details',
        component: CustomerDetails
      }

    ],
      
      //   {
      //   path: 'CustomerDetails',
      //   name: 'CustomerDetails',
      //   component: CustomerDetails
      // },
  },

  // 404 Catch-all
  {
    path: '/:pathMatch(.*)*',
    component: NotFound,
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Improved Auth Guard
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = localStorage.getItem("token");

//   // Redirect logged-in users away from auth pages
//   if (to.meta.public && isAuthenticated) {
//     return next({ name: "dashboard" });
//   }

//   // Protect non-public routes
//   if (!to.meta.public && !isAuthenticated) {
//     return next({ name: "login" });
//   }

//   next();
// });

export default router
