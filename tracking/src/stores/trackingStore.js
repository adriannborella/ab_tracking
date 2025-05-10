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

  function addDataPoint(name, date, value) {
    if (trackedValues.value[name]) {
      trackedValues.value[name].data.push({ date, value })
    } else {
      console.warn(`Name "${name}" does not exist in trackedValues.`)
    }    
  }

  function deleteValue(name) {
    if (trackedValues.value[name]) {
      delete trackedValues.value[name]
    } else {
      console.warn(`Name "${name}" does not exist in trackedValues.`)
    }
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
    deleteValue
  }
})
