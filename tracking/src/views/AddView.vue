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
          class="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Agregar Metrica
        </button>

        <ul>
            <li
              v-for="(value, key) in trackedValues"
              :key="key"
              class="bg-white rounded-2xl shadow p-4 mb-2">
                <h2 class="text-lg font-semibold mb-2">{{ key }}</h2>
                <button
                    @click="store.deleteValue(key)"
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
          class="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Agregar Dato
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useTrackingStore } from '@/stores/trackingStore'
  import { storeToRefs } from 'pinia'
  
  const store = useTrackingStore()
  const { trackedValues } = storeToRefs(store)
  
  const activeTab = ref('value')
  
  const newValueName = ref('')
  function addValue() {
    if (newValueName.value.trim()) {
      store.addValue(newValueName.value.trim())
      newValueName.value = ''
    }
  }
  
  const selectedId = ref('')
  const dataDate = ref(new Date().toISOString().split('T')[0])
  const dataValue = ref(null)
  
  function addDataPoint() {
    if (selectedId.value && dataDate.value && dataValue.value != null) {
      store.addDataPoint(selectedId.value, dataDate.value, dataValue.value)
      // Limpieza
      dataDate.value = ''
      dataValue.value = null
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
  