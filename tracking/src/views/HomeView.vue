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
    <div class="space-y-4 mt-2">
      <div
        v-for="value, key in store.trackedValues"
        :key="key"
        class="bg-white rounded-2xl shadow p-4 mb-2"
      >
        <h2 class="text-lg font-semibold mb-2">{{ key }}</h2>
        <LineChart :dataPoints="value.data" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LineChart from '@/components/LineChart.vue'
import { useTrackingStore } from '@/stores/trackingStore'
import { useRouter } from 'vue-router'

const  router = useRouter()
 
const store = useTrackingStore()

function addValue() {
  router.push({ name: 'add' })
}
</script>
