import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTrackingStore = defineStore('tracking', () => {
  const trackedValues = ref(
    JSON.parse(localStorage.getItem('trackedValues') || '{}')
  )

  function addValue(name) {
    trackedValues.value[name] = {      
      data: [],
    }
  }

  function validateMetrica(name) {
    if (trackedValues.value[name]) {
      return true
    } else {
        throw new Error(`Name "${name}" does not exist in trackedValues.`)
    }
  }

  function saveMetric(name, newValues) {
    validateMetrica(name)

    trackedValues.value[name] = {
      ...trackedValues.value[name],
      ...newValues,
    }
  }

  function addDataPoint(name, date, value) {
    validateMetrica(name)
    // Verifica si la fecha ya existe
    const existingDataPoint = trackedValues.value[name].data.find(
        (dataPoint) => dataPoint.date === date
    )
    // Si existe, actualiza el valor
    if (existingDataPoint) {
        existingDataPoint.value = value
    } else {
        // Si no existe, agrega un nuevo punto de datos
        trackedValues.value[name].data.push({ date, value })
    }
    // ordenar los puntos de datos por fecha
    orderData(name)
  }

  function orderData(name) {
    trackedValues.value[name].data = trackedValues.value[name].data.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  function getDataDesc(name) {
    return trackedValues.value[name].data.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  function deleteValue(name) {
    validateMetrica(name)
    delete trackedValues.value[name]
  }

  function deleteValueData(name, date) {
    validateMetrica(name)
    trackedValues.value[name].data = trackedValues.value[name].data.filter(
      (dataPoint) => dataPoint.date !== date
    )      
  }

  function standardizeData() {
        trackedValues.value = Object.entries(trackedValues.value).reduce(
          (acc, [key, value]) => {            
              acc[key] = {
                  ...value,
                key: value.key || key,
                name: value.name || key,
                color: value.color || '#2d0da0',
            }
            return acc
        },
        {}
    )
  }

  // Persistencia automática en Local Storage
  watch(
    trackedValues,
    (val) => {
      localStorage.setItem('trackedValues', JSON.stringify(val))
    },
    { deep: true }
  )

  return {
    trackedValues,
    addValue,
    addDataPoint,
    deleteValue,
    deleteValueData,
    getDataDesc,
    saveMetric,
    standardizeData
  }
})
