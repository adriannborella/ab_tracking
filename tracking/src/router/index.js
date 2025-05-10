import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/metrica/:metrica',
      name: 'metrica',
      props: (route) => {
        return { metrica: route.params.metrica };
      },
      component: () => import('@/views/MetricaView.vue')
    }, 
    {
      path: '/add',
      name: 'add',
      component: () => import('@/views/AddView.vue')
    }
  ],
})

export default router
