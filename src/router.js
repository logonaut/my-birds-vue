import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/birds',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { guestOnly: true, title: 'Log in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: { guestOnly: true, title: 'Create account' },
  },
  {
    path: '/birds',
    name: 'birds',
    component: () => import('@/views/BirdsPage.vue'),
    meta: { requiresAuth: true, title: 'BirdsPage' },
  },
  {
    path: '/birds/:id(\\d+)',
    name: 'bird-detail',
    component: () => import('@/views/BirdDetailPage.vue'),
    props: (route) => ({ id: Number(route.params.id) }),
    meta: { requiresAuth: true, title: 'Bird' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/birds',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly) {
    return { name: 'birds' }
  }
})

export default router
