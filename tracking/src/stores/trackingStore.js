import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './authStore'
import { useFirebaseStorage } from '@/composables/useFirebaseStorage'

export const useTrackingStore = defineStore('tracking', () => {
  const trackedValues = ref({})
  const isLoadingFromFirebase = ref(false)
  let unsubscribeFirestore = null
  let unwatchFirebase = null

  // Usar composable para manejar guardado en Firebase
  const { isSaving, lastSaved, saveError, saveToFirebase: saveToFirebaseComposable, saveToFirebaseDebounced } = useFirebaseStorage()

  // Cargar desde localStorage (solo si no hay usuario autenticado)
  function loadFromLocalStorage() {
    const stored = localStorage.getItem('trackedValues')
    if (stored) {
      trackedValues.value = JSON.parse(stored)
    }
  }

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

  function exportToCSV() {
    // Obtener todo el contenido de localStorage para otros datos
    const allLocalStorageData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      try {
        allLocalStorageData[key] = JSON.parse(localStorage.getItem(key))
      } catch (e) {
        // Si no es JSON, guardar como string
        allLocalStorageData[key] = localStorage.getItem(key)
      }
    }

    // Usar trackedValues.value (puede venir de Firebase o localStorage)
    const currentTrackedValues = trackedValues.value

    let csvContent = ''

    // Sección 1: Metadata de métricas
    if (currentTrackedValues && typeof currentTrackedValues === 'object' && Object.keys(currentTrackedValues).length > 0) {
      csvContent += '=== METADATA DE MÉTRICAS ===\n'
      csvContent += 'Key,Nombre,Color\n'
      
      Object.entries(currentTrackedValues).forEach(([key, value]) => {
        const name = value.name || key
        const color = value.color || ''
        // Escapar comillas y comas en CSV
        const escapedKey = `"${String(key).replace(/"/g, '""')}"`
        const escapedName = `"${String(name).replace(/"/g, '""')}"`
        const escapedColor = `"${String(color).replace(/"/g, '""')}"`
        csvContent += `${escapedKey},${escapedName},${escapedColor}\n`
      })
      
      csvContent += '\n'
    }

    // Sección 2: Datos históricos
    if (currentTrackedValues && typeof currentTrackedValues === 'object' && Object.keys(currentTrackedValues).length > 0) {
      csvContent += '=== DATOS HISTÓRICOS ===\n'
      
      // Recopilar todas las fechas únicas de todas las métricas
      const allDates = new Set()
      Object.values(currentTrackedValues).forEach(metric => {
        if (metric.data && Array.isArray(metric.data)) {
          metric.data.forEach(dataPoint => {
            if (dataPoint.date) {
              allDates.add(dataPoint.date)
            }
          })
        }
      })
      
      // Ordenar fechas
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b))
      
      // Crear mapa de datos por métrica y fecha para acceso rápido
      const dataMap = {}
      Object.entries(currentTrackedValues).forEach(([key, metric]) => {
        dataMap[key] = {}
        if (metric.data && Array.isArray(metric.data)) {
          metric.data.forEach(dataPoint => {
            dataMap[key][dataPoint.date] = dataPoint.value
          })
        }
      })
      
      // Encabezados: Fecha + nombres de métricas
      const metricKeys = Object.keys(currentTrackedValues)
      csvContent += 'Fecha'
      metricKeys.forEach(key => {
        const metricName = currentTrackedValues[key].name || key
        csvContent += `,"${String(metricName).replace(/"/g, '""')}"`
      })
      csvContent += '\n'
      
      // Filas de datos
      sortedDates.forEach(date => {
        csvContent += `"${date}"`
        metricKeys.forEach(key => {
          const value = dataMap[key][date]
          csvContent += value !== undefined ? `,"${String(value).replace(/"/g, '""')}"` : ','
        })
        csvContent += '\n'
      })
      
      csvContent += '\n'
    }

    // Sección 3: Otros datos de localStorage (si existen)
    const otherKeys = Object.keys(allLocalStorageData).filter(key => key !== 'trackedValues')
    if (otherKeys.length > 0) {
      csvContent += '=== OTROS DATOS DE LOCALSTORAGE ===\n'
      csvContent += 'Key,Valor\n'
      otherKeys.forEach(key => {
        const value = allLocalStorageData[key]
        const escapedKey = `"${String(key).replace(/"/g, '""')}"`
        let escapedValue = ''
        if (typeof value === 'object') {
          escapedValue = `"${JSON.stringify(value).replace(/"/g, '""')}"`
        } else {
          escapedValue = `"${String(value).replace(/"/g, '""')}"`
        }
        csvContent += `${escapedKey},${escapedValue}\n`
      })
    }

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `backup_localstorage_${date}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función helper para parsear una línea CSV
  function parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Comilla escapada
          current += '"'
          i++ // Saltar la siguiente comilla
        } else {
          // Toggle quotes
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Fin del campo
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    // Agregar el último campo
    result.push(current)
    return result
  }

  function importFromCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target.result
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
          
          let currentSection = null
          let metadataHeaders = []
          let dataHeaders = []
          let otherHeaders = []
          const metadata = {}
          const dataRows = []
          const otherData = {}
          
          // Mapeo de nombres de métricas a keys (para la sección de datos)
          const nameToKeyMap = {}
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            // Detectar secciones
            if (line.includes('=== METADATA DE MÉTRICAS ===')) {
              currentSection = 'metadata'
              continue
            } else if (line.includes('=== DATOS HISTÓRICOS ===')) {
              currentSection = 'data'
              continue
            } else if (line.includes('=== OTROS DATOS DE LOCALSTORAGE ===')) {
              currentSection = 'other'
              continue
            }
            
            // Parsear según la sección actual
            if (currentSection === 'metadata') {
              if (line === 'Key,Nombre,Color') {
                metadataHeaders = ['Key', 'Nombre', 'Color']
                continue
              }
              
              const fields = parseCSVLine(line)
              if (fields.length >= 2) {
                const key = fields[0]
                const name = fields[1]
                const color = fields[2] || '#2d0da0'
                
                metadata[key] = {
                  name: name,
                  color: color,
                  key: key
                }
                
                // Crear mapeo nombre -> key para la sección de datos
                nameToKeyMap[name] = key
              }
            } else if (currentSection === 'data') {
              if (line.startsWith('Fecha')) {
                // Es la línea de encabezados
                const fields = parseCSVLine(line)
                dataHeaders = fields.slice(1) // Omitir "Fecha"
                continue
              }
              
              const fields = parseCSVLine(line)
              if (fields.length > 0) {
                const date = fields[0]
                const values = fields.slice(1)
                dataRows.push({ date, values })
              }
            } else if (currentSection === 'other') {
              if (line === 'Key,Valor') {
                otherHeaders = ['Key', 'Valor']
                continue
              }
              
              const fields = parseCSVLine(line)
              if (fields.length >= 2) {
                const key = fields[0]
                let value = fields[1]
                
                // Intentar parsear como JSON
                try {
                  value = JSON.parse(value)
                } catch (e) {
                  // Mantener como string si no es JSON válido
                }
                
                otherData[key] = value
              }
            }
          }
          
          // Validar que haya metadata de métricas
          if (Object.keys(metadata).length === 0) {
            throw new Error('El archivo CSV no contiene metadata de métricas válida')
          }
          
          // Reconstruir trackedValues
          const importedTrackedValues = {}
          
          // Inicializar métricas con metadata
          Object.entries(metadata).forEach(([key, meta]) => {
            importedTrackedValues[key] = {
              ...meta,
              data: []
            }
          })
          
          // Agregar datos históricos
          dataRows.forEach(({ date, values }) => {
            values.forEach((value, index) => {
              if (value && typeof value === 'string' && value.trim() !== '') {
                const metricName = dataHeaders[index]
                const metricKey = nameToKeyMap[metricName]
                
                if (metricKey && importedTrackedValues[metricKey]) {
                  // Convertir valor a número si es posible
                  const trimmedValue = value.trim()
                  const numValue = isNaN(trimmedValue) ? trimmedValue : parseFloat(trimmedValue)
                  importedTrackedValues[metricKey].data.push({
                    date: date,
                    value: numValue
                  })
                }
              }
            })
          })
          
          // Ordenar datos por fecha para cada métrica
          Object.keys(importedTrackedValues).forEach(key => {
            importedTrackedValues[key].data = importedTrackedValues[key].data.sort(
              (a, b) => new Date(a.date) - new Date(b.date)
            )
          })
          
          // Actualizar trackedValues
          trackedValues.value = importedTrackedValues
          
          // Restaurar otros datos de localStorage (opcional, solo si el usuario quiere)
          // Por ahora solo restauramos trackedValues para evitar conflictos
          
          resolve({ success: true, importedMetrics: Object.keys(importedTrackedValues).length })
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'))
      }
      
      reader.readAsText(file)
    })
  }

  // Cargar datos desde Firebase
  async function loadFromFirebase() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      isLoadingFromFirebase.value = true
      const userId = authStore.user.uid
      const docRef = doc(db, 'users', userId)
      
      // Usar listener en tiempo real
      unsubscribeFirestore = onSnapshot(docRef, (docSnap) => {
        // Establecer bandera antes de actualizar para prevenir loops
        isLoadingFromFirebase.value = true
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          trackedValues.value = data.trackedValues || {}
        } else {
          // Si no existe el documento, crear uno vacío
          trackedValues.value = {}
        }
        
        isLoadingFromFirebase.value = false
      }, (error) => {
        console.error('Error al cargar datos de Firebase:', error)
        isLoadingFromFirebase.value = false
      })
    } catch (error) {
      console.error('Error al configurar listener de Firebase:', error)
      isLoadingFromFirebase.value = false
    }
  }

  // Guardar en Firebase usando el composable
  async function saveToFirebase() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      await saveToFirebaseComposable(
        { trackedValues: trackedValues.value },
        'users',
        authStore.user.uid
      )
    } catch (error) {
      console.error('Error al guardar en Firebase:', error)
      throw error
    }
  }

  // Migrar datos del localStorage a Firebase
  async function migrateLocalStorageToFirebase() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      // Obtener datos del localStorage
      const localData = localStorage.getItem('trackedValues')
      
      if (localData) {
        const parsedLocalData = JSON.parse(localData)
        
        // Verificar si hay datos en localStorage
        if (Object.keys(parsedLocalData).length > 0) {
          const userId = authStore.user.uid
          const docRef = doc(db, 'users', userId)
          
          // Verificar si ya existen datos en Firebase
          const docSnap = await getDoc(docRef)
          
          // Establecer bandera para prevenir que el watch guarde durante la migración
          isLoadingFromFirebase.value = true
          
          if (docSnap.exists()) {
            // Si ya hay datos en Firebase, combinarlos con los del localStorage
            const firebaseData = docSnap.data().trackedValues || {}
            const mergedData = { ...firebaseData, ...parsedLocalData }
            
            trackedValues.value = mergedData
            await saveToFirebaseComposable(
              { trackedValues: mergedData },
              'users',
              userId
            )
          } else {
            // Si no hay datos en Firebase, usar solo los del localStorage
            trackedValues.value = parsedLocalData
            await saveToFirebaseComposable(
              { trackedValues: parsedLocalData },
              'users',
              userId
            )
          }
          
          // Limpiar localStorage después de la migración
          localStorage.removeItem('trackedValues')
          
          // Restaurar bandera
          isLoadingFromFirebase.value = false
          
          console.log('Migración de datos completada exitosamente')
        }
      }
    } catch (error) {
      console.error('Error al migrar datos:', error)
      isLoadingFromFirebase.value = false
      throw error
    }
  }

  // Limpiar datos (al cerrar sesión)
  function clearData() {
    trackedValues.value = {}
    if (unsubscribeFirestore) {
      unsubscribeFirestore()
      unsubscribeFirestore = null
    }
    if (unwatchFirebase) {
      unwatchFirebase()
      unwatchFirebase = null
    }
  }

  // Watch para guardar automáticamente (tanto en localStorage como Firebase)
  // Solo se ejecuta si NO estamos cargando desde Firebase (previene loops)
  // Usa debounce para evitar múltiples llamadas rápidas
  unwatchFirebase = watch(
    trackedValues,
    async (val) => {
      // Prevenir loops: no guardar si estamos cargando desde Firebase
      if (isLoadingFromFirebase.value) {
        return
      }

      const authStore = useAuthStore()
      
      if (authStore.user) {
        // Si el usuario está autenticado, guardar en Firebase usando el composable con debounce
        // Esto evita múltiples llamadas cuando hay cambios rápidos
        await saveToFirebaseDebounced(
          { trackedValues: trackedValues.value },
          'users',
          authStore.user.uid,
          500 // 500ms de delay
        )
      } else {
        // Si no está autenticado, guardar en localStorage
        localStorage.setItem('trackedValues', JSON.stringify(val))
      }
    },
    { deep: true }
  )

  // Cargar datos iniciales desde localStorage
  loadFromLocalStorage()

  return {
    trackedValues,
    isLoadingFromFirebase,
    // Estados del composable para acceso desde componentes
    isSaving,
    lastSaved,
    saveError,
    addValue,
    addDataPoint,
    deleteValue,
    deleteValueData,
    getDataDesc,
    saveMetric,
    standardizeData,
    exportToCSV,
    importFromCSV,
    loadFromFirebase,
    migrateLocalStorageToFirebase,
    clearData
  }
})
