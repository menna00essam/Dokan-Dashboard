import { createRouter, createWebHistory } from 'vue-router'

// Layouts
import AuthLayout from '../layouts/AuthLayout.vue'
const AppLayout = () => import('../layouts/AppLayout.vue')
import AdminLayout from '../layouts/AdminLayout.vue' // Add this

// Views
import NotFound from '../views/NotFound.vue'
import AddProduct from '../views/AddProduct.vue'
import EditProduct from '../views/EditProduct.vue'
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
import Currencies from '../components/Settings/Currencies.vue'

import { useAuthStore } from '../store/auth'

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

  // Super Admin Routes
  {
    path: '/',
    component: AppLayout,
    meta: {
      requiresAuth: true,
      allowedRoles: ['super_admin'],
      breadcrumb: 'Dashboard'
    },
    children: [
      {
        path: '',
        name: 'super-admin-dashboard', // Dedicated name
        component: Dashboard,
        breadcrumb: 'Dashboard'
      },
      {
        path: 'dashboard',
        redirect: { name: 'super-admin-dashboard' }
      },
      {
        path: 'products',
        name: 'super-admin-products',
        component: Products,
        breadcrumb: 'Products'
      },
      {
        path: 'orders',
        name: 'super-admin-orders',
        component: Orders,
        breadcrumb: 'Orders'
      },
      {
        path: 'config',
        name: 'super-admin-config',
        component: StoreConfig,
        breadcrumb: 'Store Configration'
      },
      {
        path: 'requests',
        name: 'super-admin-requests',
        component: Requests,
        breadcrumb: 'Requests'
      },
      {
        path: 'customers',
        name: 'super-admin-customers',
        component: CustomerManagement,
        props: true,
        breadcrumb: 'Customers'
      },
      {
        path: 'customers/edit/:id',
        name: 'super-admin-edit-customer',
        props: true,
        component: EditCustomer,
        breadcrumb: 'Edit Customers'
      },
      {
        path: 'addproducts',
        name: 'super-admin-add-products',
        component: AddProduct,
        breadcrumb: 'Add Customers'
      },
      {
        path: 'editproducts/:sku/',
        name: 'super-admin-edit-products',
        component: EditProduct,
        breadcrumb: 'Edit Product'
      },
      {
        path: 'customers/:id',
        name: 'super-admin-customer-details',
        component: CustomerDetails,
        breadcrumb: 'Customers Details'
      },
      {
        path: 'currencies',
        name: 'super-admin-currencies',
        component: Currencies
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      allowedRoles: ['admin'],
      breadcrumb: 'Dashboard'
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard', // Dedicated name
        component: Dashboard,
        breadcrumb: 'Dashboard'
      },
      {
        path: 'dashboard',
        redirect: { name: 'admin-dashboard' }
      },
      {
        path: 'products',
        name: 'admin-products',
        component: Products,
        breadcrumb: 'Products'
      },
      {
        path: 'orders',
        name: 'admin-orders',
        component: Orders,
        breadcrumb: 'Orders'
      },
      {
        path: 'customers',
        name: 'admin-customers',
        component: CustomerManagement,
        props: true,
        breadcrumb: 'Customers'
      },
      {
        path: 'customers/edit/:id',
        name: 'admin-edit-customer',
        props: true,
        component: EditCustomer,
        breadcrumb: 'Edit Customer'
      },
      {
        path: 'addproducts',
        name: 'admin-add-products',
        component: AddProduct,
        breadcrumb: 'Add Product'
      },
      {
        path: 'editproducts/:sku',
        name: 'admin-edit-products',
        component: EditProduct,
        breadcrumb: 'Edit Product'
      },
      {
        path: 'customers/:id',
        name: 'admin-customer-details',
        component: CustomerDetails,
        breadcrumb: 'Customer Details'
      },
      {
        path: 'currencies',
        name: 'admin-currencies',
        component: Currencies
      }
    ]
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
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  console.log('User:', authStore.user)
  console.log('Role:', authStore.userRole)
  if (!authStore.user && authStore.token) {
    await authStore.loadUserFromStorage()
  }

  if (to.meta.public && authStore.isLoggedIn) {
    return next(redirectBasedOnRole(authStore.userRole))
  }

  if (!to.meta.public && !authStore.isLoggedIn) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (
    to.meta.allowedRoles &&
    !to.meta.allowedRoles.includes(authStore.userRole)
  ) {
    return next(redirectBasedOnRole(authStore.userRole))
  }

  return next()
})

function redirectBasedOnRole(role) {
  switch (role) {
    case 'super_admin':
      return { name: 'super-admin-dashboard' }
    case 'admin':
      return { name: 'admin-dashboard' }
    default:
      return { name: 'login' }
  }
}

export default router
