import { ref, watch } from 'vue'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@kyvg/vue3-notification'

/**
 * Composable para manejar el guardado de datos en Firebase
 * Proporciona estados reactivos y funciones para guardar datos de forma reutilizable
 */
export function useFirebaseStorage() {
  const isSaving = ref(false)
  const lastSaved = ref(null)
  const saveError = ref(null)
  let debounceTimer = null
  let lastSavedData = null

  /**
   * Compara dos objetos profundamente (excluyendo updatedAt)
   * @param {Object} obj1 - Primer objeto
   * @param {Object} obj2 - Segundo objeto
   * @returns {boolean} - true si son iguales
   */
  function deepEqual(obj1, obj2) {
    // Comparar tipos
    if (obj1 === obj2) return true
    if (obj1 == null || obj2 == null) return false
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false

    const keys1 = Object.keys(obj1).filter(k => k !== 'updatedAt')
    const keys2 = Object.keys(obj2).filter(k => k !== 'updatedAt')

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (!keys2.includes(key)) return false
      if (!deepEqual(obj1[key], obj2[key])) return false
    }

    return true
  }

  /**
   * Guarda datos en Firebase Firestore
   * Solo guarda si hay cambios reales en los datos (excluyendo updatedAt)
   * @param {Object} data - Los datos a guardar
   * @param {string} collection - Nombre de la colección (default: 'users')
   * @param {string} docId - ID del documento (default: userId del usuario autenticado)
   * @param {boolean} forceUpdate - Forzar actualización incluso si no hay cambios (default: false)
   * @returns {Promise<boolean>} - true si se guardó, false si no había cambios
   */
  async function saveToFirebase(data, collection = 'users', docId = null, forceUpdate = false) {
    const authStore = useAuthStore()
    
    // Si no hay usuario autenticado, no hacer nada
    if (!authStore.user) {
      return false
    }

    // Usar userId si no se proporciona docId
    const documentId = docId || authStore.user.uid

    // Si ya hay una operación de guardado en curso, cancelar la anterior
    if (isSaving.value) {
      return false
    }

    isSaving.value = true
    saveError.value = null

    try {
      const docRef = doc(db, collection, documentId)
      
      // Obtener datos actuales de Firebase para comparar
      const docSnap = await getDoc(docRef)
      const currentData = docSnap.exists() ? docSnap.data() : null

      // Comparar datos (excluyendo updatedAt) si no es una actualización forzada
      if (!forceUpdate && currentData) {
        // Crear copias sin updatedAt para comparar
        const currentDataWithoutTimestamp = { ...currentData }
        delete currentDataWithoutTimestamp.updatedAt

        const newDataWithoutTimestamp = { ...data }
        delete newDataWithoutTimestamp.updatedAt

        // Si los datos son iguales, no guardar
        if (deepEqual(currentDataWithoutTimestamp, newDataWithoutTimestamp)) {
          isSaving.value = false
          return false
        }
      }

      // Preparar datos con timestamp solo si hay cambios reales
      const dataToSave = {
        ...data,
        updatedAt: new Date().toISOString()
      }
      
      await setDoc(docRef, dataToSave)
      
      // Guardar referencia de los datos guardados para futuras comparaciones
      lastSavedData = JSON.parse(JSON.stringify(data))
      
      // Actualizar estado de éxito
      lastSaved.value = new Date()
      saveError.value = null
      
      return true
    } catch (error) {
      console.error('Error al guardar en Firebase:', error)
      saveError.value = error.message
      
      notify({
        title: 'Error al guardar',
        text: 'No se pudo guardar los datos en Firebase',
        type: 'error'
      })
      
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Versión con debounce del método saveToFirebase
   * Espera un tiempo antes de guardar para evitar múltiples llamadas
   * @param {Object} data - Los datos a guardar
   * @param {string} collection - Nombre de la colección
   * @param {string} docId - ID del documento
   * @param {number} delay - Tiempo de espera en ms (default: 500)
   * @returns {Promise<boolean>}
   */
  async function saveToFirebaseDebounced(data, collection = 'users', docId = null, delay = 500) {
    return new Promise((resolve) => {
      // Cancelar timer anterior si existe
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Crear nuevo timer
      debounceTimer = setTimeout(async () => {
        try {
          const result = await saveToFirebase(data, collection, docId)
          resolve(result)
        } catch (error) {
          resolve(false)
        }
      }, delay)
    })
  }

  /**
   * Observa cambios en un ref reactivo y guarda automáticamente en Firebase
   * @param {Ref} dataRef - Referencia reactiva a los datos
   * @param {string} collection - Nombre de la colección
   * @param {string} docId - ID del documento
   * @param {Function} skipCondition - Función opcional que retorna true si se debe saltar el guardado
   * @returns {Function} Función para detener el watch
   */
  function watchAndSave(dataRef, collection = 'users', docId = null, skipCondition = null) {
    const authStore = useAuthStore()
    
    return watch(
      dataRef,
      async (newValue) => {
        // Si no hay usuario autenticado, no guardar
        if (!authStore.user) {
          return
        }

        // Si hay una condición de salto y se cumple, no guardar
        if (skipCondition && skipCondition()) {
          return
        }

        // Guardar en Firebase
        await saveToFirebase(newValue, collection, docId)
      },
      { deep: true }
    )
  }

  /**
   * Limpia los estados del composable
   */
  function reset() {
    isSaving.value = false
    lastSaved.value = null
    saveError.value = null
    lastSavedData = null
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  return {
    // Estados
    isSaving,
    lastSaved,
    saveError,
    
    // Funciones
    saveToFirebase,
    saveToFirebaseDebounced,
    watchAndSave,
    reset
  }
}

