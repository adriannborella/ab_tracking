<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-20">
    <!-- Input file oculto para importar CSV -->
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      @change="handleFileImport"
      class="hidden"
    />

    <!-- Botón Importar -->
    <button
      @click="fileInput?.click()"
      class="fixed top-4 right-32 mr-4 bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors"
      title="Cargar backup CSV"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    </button>

    <!-- Botón Backup -->
    <button
      @click="store.exportToCSV"
      class="fixed top-4 right-20 bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors"
      title="Descargar backup CSV"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>

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
import { notify } from "@kyvg/vue3-notification"

const router = useRouter()
const fileInput = ref(null)
 
const store = useTrackingStore()

function addValue() {
  router.push({ name: 'add' })
}

async function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validar que sea un archivo CSV
  if (!file.name.endsWith('.csv')) {
    notify({
      title: "Error",
      text: "Por favor selecciona un archivo CSV válido",
      type: "error",
      duration: 3000,
    })
    // Limpiar el input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    return
  }

  try {
    const result = await store.importFromCSV(file)
    notify({
      title: "Importación exitosa",
      text: `Se importaron ${result.importedMetrics} métrica(s) correctamente`,
      type: "success",
      duration: 3000,
    })
    // Limpiar el input para permitir cargar el mismo archivo de nuevo si es necesario
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    notify({
      title: "Error al importar",
      text: error.message || "Ocurrió un error al procesar el archivo CSV",
      type: "error",
      duration: 4000,
    })
    // Limpiar el input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

onMounted(() => {
  store.standardizeData()
})
</script>
