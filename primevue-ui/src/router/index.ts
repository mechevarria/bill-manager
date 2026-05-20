import { createRouter, createWebHistory } from 'vue-router'
import BillsView from '@/views/BillsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'bills',
      component: BillsView,
    },
    {
      path: '/bills/:id',
      name: 'bill-edit',
      component: () => import('@/views/BillEditView.vue'),
    },
    {
      path: '/chart',
      name: 'chart',
      component: () => import('@/views/ChartView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/defaults',
      name: 'defaults',
      component: () => import('@/views/SystemView.vue'),
    },
    {
      path: '/data',
      name: 'data',
      component: () => import('@/views/DataView.vue'),
    },
    // Legacy redirects
    { path: '/bills', redirect: '/' },
    { path: '/home', redirect: '/' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
