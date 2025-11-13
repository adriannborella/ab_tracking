<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-20">
    <!-- Información del usuario -->
    <div class="bg-white rounded-2xl shadow p-6 mb-4 mt-2">
      <div class="flex flex-col items-center mb-6">
        <!-- Avatar -->
        <div class="w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-200 flex items-center justify-center">
          <img 
            v-if="authStore.user?.photoURL" 
            :src="authStore.user.photoURL" 
            :alt="authStore.user.displayName || authStore.user.email"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-3xl text-gray-500">
            {{ (authStore.user?.displayName || authStore.user?.email || 'U')[0].toUpperCase() }}
          </div>
        </div>
        
        <!-- Nombre -->
        <h2 class="text-2xl font-semibold mb-2">
          {{ authStore.user?.displayName || authStore.user?.email || 'Usuario' }}
        </h2>
        
        <!-- Email -->
        <p class="text-gray-600 text-sm" v-if="authStore.user?.displayName && authStore.user?.email">
          {{ authStore.user.email }}
        </p>
      </div>
      
      <!-- Información adicional -->
      <div class="border-t border-gray-200 pt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-600">Email:</span>
          <span class="font-medium">{{ authStore.user?.email || 'No disponible' }}</span>
        </div>
        <div class="flex justify-between items-center" v-if="authStore.user?.uid">
          <span class="text-gray-600">ID de usuario:</span>
          <span class="font-mono text-xs text-gray-500">{{ authStore.user.uid.substring(0, 8) }}...</span>
        </div>
      </div>
    </div>
    
    <!-- Botón de cerrar sesión -->
    <div class="bg-white rounded-2xl shadow p-4">
      <button 
        @click="handleLogout" 
        class="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-3 text-base font-medium transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* No additional styles needed as TailwindCSS is used */
</style>

