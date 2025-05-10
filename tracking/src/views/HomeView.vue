<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-20">
    <!-- Botón Agregar -->
    <button
      @click="addValue"
      class="fixed top-4 right-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
    >
      +
    </button>

    <!-- Lista de valores -->
    <div class="space-y-4 mt-2" v-if="Object.keys(store.trackedValues).length > 0">
      <div        
      v-for="(value, key) in store.trackedValues"
      :key="key"
      class="bg-white rounded-2xl shadow p-4 mb-2"
      @click="$router.push({ name: 'metrica', params: { metrica: key } })"
      >
        <h2 class="text-lg font-semibold mb-2">{{ value.name || key }}</h2>
        <LineChart v-if="value.data.length !== 0" :metric="value" />
        <span v-else> Por favor haga click aqui para editar su metrica y cargar nuevos datos</span>
      </div>
    </div>
    <div
      v-else
      class="bg-white rounded-2xl shadow p-4 mb-2 text-center"
    >
      <h2 class="text-lg font-semibold mb-2">No hay datos disponibles</h2>
      <p class="text-gray-500">Agrega una métrica para comenzar a rastrear.</p>   
      <p class="text-gray-500">Presiona en el boton + en la esquina superior derecha.</p>   
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LineChart from '@/components/LineChart.vue'
import { useTrackingStore } from '@/stores/trackingStore'
import { useRouter } from 'vue-router'

const  router = useRouter()
 
const store = useTrackingStore()

function addValue() {
  router.push({ name: 'add' })
}

onMounted(() => {
  store.standardizeData()
})
</script>
