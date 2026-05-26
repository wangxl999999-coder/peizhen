import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'companions',
        name: 'Companions',
        component: () => import('@/views/companions/index.vue'),
        meta: { title: '陪诊师管理', icon: 'Avatar' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/index.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/services/index.vue'),
        meta: { title: '服务管理', icon: 'Service' }
      },
      {
        path: 'cities',
        name: 'Cities',
        component: () => import('@/views/cities/index.vue'),
        meta: { title: '城市管理', icon: 'Location' }
      },
      {
        path: 'banners',
        name: 'Banners',
        component: () => import('@/views/banners/index.vue'),
        meta: { title: 'Banner管理', icon: 'Picture' }
      },
      {
        path: 'complaints',
        name: 'Complaints',
        component: () => import('@/views/complaints/index.vue'),
        meta: { title: '投诉处理', icon: 'Warning' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('adminToken')
  
  if (to.meta.requiresAuth === false) {
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  } else {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
