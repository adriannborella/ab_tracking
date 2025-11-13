<template>
  <div>
      <notifications />
      <div class="mt-2 p-2">
          <button @click="goBack" class="fixed top-2 left-5 bg-gray-300 rounded-full p-1 w-8 h-8"
              v-if="visibleBackButton">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 32 32"
                  fill="gray-300">                    
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                      <g id="SVGRepo_iconCarrier">
                          <path d="M14.19 16.005l7.869 7.868-2.129 2.129-9.996-9.997L19.937 6.002l2.127 2.129z"></path>
                      </g>
              </svg>
          </button>
          
          <RouterView />
      </div>
      <div class="flex justify-around fixed bottom-0 w-full bg-white border-t border-gray-300 py-2" v-if="authStore.user">
          <RouterLink class="text-primary font-bold flex items-center justify-center w-full" :to="{ name: 'home' }">
              Metricas
          </RouterLink>
          <RouterLink class="text-primary font-bold flex items-center justify-center w-full" :to="{ name: 'profile' }">
              Perfil
          </RouterLink>
      </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const visibleBackButton = ref(true);

const goBack = () => {
  router.back();
};

watch(
  () => router.currentRoute.value.name,
  (newRouteName) => {
      visibleBackButton.value = newRouteName !== 'home' && newRouteName !== 'login';
  },
  { immediate: true }
);
</script>

<style scoped>
/* No additional styles needed as TailwindCSS is used */
</style>
