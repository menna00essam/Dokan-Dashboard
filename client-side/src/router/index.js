import { createRouter, createWebHistory } from "vue-router";

// Layouts
import AuthLayout from "../layouts/AuthLayout.vue";
import MainLayout from "../layouts/AppLayout.vue";

// Views
import Dashboard from "../views/Dashboard.vue";
import Products from "../views/Products.vue";
import Login from "../views/Login.vue";

import Register from "../views/Register.vue";
import Orders from "../views/Orders.vue";
import NotFound from "../views/NotFound.vue";
import Pending from "../views/Pending.vue";

const routes = [
  {
    path: "/auth",
    component: AuthLayout,
    meta: { public: true },
    children: [
      {
        path: "login",
        name: "login",
        component: Login,
      },
      {
        path: "/login",
        redirect: "/auth/login",
      },
      {
        path: "register",
        name: "register",
        component: Register,
      },
      {
        path: "/register",
        redirect: "/auth/register",
      },
      {
        path: "pending",
        name:"pending",
        component :Pending,
      },
      {
        path:'/pending',
        redirect:'/auth/pending',
      }
    ],
  },

  // Protected Routes (uses MainLayout)
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "dashboard",
        component: Dashboard,
      },
      {
        path: "dashboard",
        redirect: { name: "dashboard" },
      },
      {
        path: "products",
        name: "products",
        component: Products,
      },
      {
        path: "orders",
        name: "orders",
        component: Orders,
      },
    ],
  },

  // 404 Catch-all
  {
    path: "/:pathMatch(.*)*",
    component: NotFound,
    meta: { public: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

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

export default router;
