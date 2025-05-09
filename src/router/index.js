import { createRouter, createWebHistory } from "vue-router"
import { supabase } from "../lib/supabase"

// Import components
import Auth from "../views/Auth.vue"
import Dashboard from "../views/Dashboard.vue"
import Profile from "../views/Profile.vue"
import SharedBooks from "../views/SharedBooks.vue"

const routes = [
  {
    path: "/",
    name: "Auth",
    component: Auth,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/shared",
    name: "SharedBooks",
    component: SharedBooks,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getUser()
  const currentUser = data?.user
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !currentUser) {
    next("/")
  } else if (to.path === "/" && currentUser) {
    next("/dashboard")
  } else {
    next()
  }
})

export default router
