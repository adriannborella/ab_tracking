<template>
    <div class="p-4 min-h-screen bg-gray-50">
      <!-- Tabs -->
      <div class="flex border-b mb-4">
        <button
          @click="activeTab = 'value'"
          :class="tabClass('value')"
        >
          Nuevo Metrica
        </button>
        <button
          @click="activeTab = 'data'"
          :class="tabClass('data')"
        >
          Nuevo Dato
        </button>

      </div>
  
      <!-- Nueva Metrica -->
      <div v-if="activeTab === 'value'" class="space-y-4">
        <input
          v-model="newValueName"
          type="text"
          placeholder="Nombre de la metrica"
          class="w-full p-2 border rounded"
        />
        <button
          @click="addValue"
          :disabled="!newValueName || store.isSaving"
          class="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <span v-if="store.isSaving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          </span>
          <span v-else-if="showSavedMessage && authStore.user" class="flex items-center">
            <svg class="mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Guardado en Firebase
          </span>
          <span v-else>
            Agregar Metrica
          </span>
        </button>

        <ul>
            <li
              v-for="(value, key) in trackedValues"
              :key="key"
              class="bg-white rounded-2xl shadow p-4 mb-2">
                <h2 class="text-lg font-semibold mb-2">{{ key }}</h2>
                <button
                    @click="deleteMetrica(key)"
                    class="bg-red-600 text-white px-4 py-2 rounded"
                >
                    Eliminar
                </button>
            </li>
        </ul>
      </div>
  
      <!-- Nuevo DataPoint -->
      <div v-else class="space-y-4">
        <input
            v-model="dataDate"
            type="date"
            class="w-full p-2 border rounded"
        />
        <select v-model="selectedId" class="w-full p-2 border rounded">
          <option disabled value="">Selecciona una metrica</option>
          <option
            v-for="val, key in trackedValues"
            :key="key"
            :value="key"
          >
            {{ key }}
          </option>
        </select>
        <input
          v-model.number="dataValue"
          type="number"
          step="any"
          placeholder="Valor"
          class="w-full p-2 border rounded"
        />
        <button
          @click="addDataPoint"
          :disabled="!dataValue && !dataDate"
          class="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Agregar Dato
        </button>


        <ul v-if="selectedId && trackedValues[selectedId]">
            <li
              v-for="{date, value} in store.getDataDesc(selectedId)"
              :key="date"
              class="bg-white rounded-2xl shadow p-4 mb-2 flex">
                <h2 class="text-lg font-semibold mb-2 flex-2">{{ new Date(date).toLocaleDateString('es-AR') }} - {{ value }}</h2>
                <button
                    @click="editRecord(date,value)"
                    class="bg-yellow-600 text-white px-4 py-2 rounded mr-4"
                >
                    Editar
                </button>
                <button
                    @click="deleteData(selectedId, date, value)"
                    class="bg-red-600 text-white px-4 py-2 rounded"
                >
                    Eliminar
                </button>
            </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { useTrackingStore } from '@/stores/trackingStore'
  import { useAuthStore } from '@/stores/authStore'
  import { storeToRefs } from 'pinia'
  import { notify } from "@kyvg/vue3-notification";
  import Swal from 'sweetalert2'
  
  const store = useTrackingStore()
  const authStore = useAuthStore()
  const { trackedValues } = storeToRefs(store)
  
  const activeTab = ref('value')
  const showSavedMessage = ref(false)
  
  const newValueName = ref('')
  
  // Observar cambios en lastSaved para mostrar confirmación temporal
  let savedTimeout = null
  watch(() => store.lastSaved, (newValue) => {
    if (newValue && authStore.user && !store.isSaving) {
      // Mostrar mensaje de confirmación
      showSavedMessage.value = true
      
      // Limpiar timeout anterior si existe
      if (savedTimeout) {
        clearTimeout(savedTimeout)
      }
      
      // Ocultar mensaje después de 2 segundos
      savedTimeout = setTimeout(() => {
        showSavedMessage.value = false
      }, 2000)
    } else {
      showSavedMessage.value = false
    }
  })
  
  async function addValue() {
    if (newValueName.value.trim()) {
      const metricName = newValueName.value.trim()
      store.addValue(metricName)
      newValueName.value = ''
      
      // Si hay usuario autenticado, esperar a que se complete el guardado
      if (authStore.user) {
        // Esperar un momento para que el watch detecte el cambio y comience a guardar
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Esperar a que termine de guardar (máximo 5 segundos)
        const maxWait = 5000
        const startTime = Date.now()
        while (store.isSaving && (Date.now() - startTime) < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Mostrar notificación solo si se guardó exitosamente en Firebase
        if (!store.saveError) {
          notify({
            title: "Agregado exitoso",
            text: `Tu métrica "${metricName}" ha sido guardada en Firebase`,
            type: "success",
            duration: 2000,
          })
        }
      } else {
        // Si no hay usuario autenticado, mostrar notificación normal
        notify({
          title: "Agregado exitoso",
          text: "Tu metrica ha sido agregado exitosamente",
          type: "success",
          duration: 2000,
        })
      }
    }
  }

  function deleteMetrica(name) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        store.deleteValue(name)
        notify({
            title: "Eliminado exitoso",
            text: "Tu metrica ha sido eliminada exitosamente",
            type: "success",
            duration: 2000,
        });
      }
    })
  }

  function deleteData(name, date, value) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Vas a eliminar el dato del dia " + new Date(date).toLocaleDateString('es-AR') + " con valor " + value,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        store.deleteValueData(name, date)
        notify({
            title: "Eliminado exitoso",
            text: "Tu metrica ha sido eliminada exitosamente",
            type: "success",
            duration: 2000,
        });
      }
    })
  }

  function editRecord(date, value) {
    dataValue.value = value;
    dataDate.value = date;
  }
  
  const selectedId = ref('')
  const dataDate = ref(new Date().toISOString().split('T')[0])
  const dataValue = ref(null)
  
  function addDataPoint() {
    if (selectedId.value && dataDate.value && dataValue.value != null) {
      store.addDataPoint(selectedId.value, dataDate.value, dataValue.value)
      // Limpieza
      dataValue.value = null
      notify({
        title: "Agregado exitoso",
        text: "Tu dato ha sido agregado exitosamente",
        type: "success",
        duration: 2000,
     });
    }
  }
  
  function tabClass(tab) {
    return [
      'flex-1 py-2 text-center border-b-2',
      activeTab.value === tab
        ? 'border-blue-600 text-blue-600 font-semibold'
        : 'border-transparent text-gray-500',
    ]
  }
  </script>
  