import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useTrackingStore } from './trackingStore'
import { notify } from '@kyvg/vue3-notification'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  // Inicializar el listener de autenticación
  function initAuth() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        
        if (firebaseUser) {
          // Usuario autenticado - cargar datos desde Firebase
          const trackingStore = useTrackingStore()
          await trackingStore.loadFromFirebase()
        }
        
        resolve(firebaseUser)
      })
    })
  }

  // Login con email y password
  async function login(email, password) {
    try {
      loading.value = true
      error.value = null
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      // Después del login, migrar datos del localStorage a Firebase
      const trackingStore = useTrackingStore()
      await trackingStore.migrateLocalStorageToFirebase()
      
      notify({
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente',
        type: 'success'
      })
      
      return result.user
    } catch (err) {
      error.value = err.message
      notify({
        title: 'Error',
        text: 'Credenciales incorrectas',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Registro con email y password
  async function register(email, password) {
    try {
      loading.value = true
      error.value = null
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Después del registro, migrar datos del localStorage a Firebase
      const trackingStore = useTrackingStore()
      await trackingStore.migrateLocalStorageToFirebase()
      
      notify({
        title: '¡Cuenta creada!',
        text: 'Tu cuenta ha sido creada exitosamente',
        type: 'success'
      })
      
      return result.user
    } catch (err) {
      error.value = err.message
      notify({
        title: 'Error',
        text: err.message,
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Login con Google
  async function loginWithGoogle() {
    try {
      loading.value = true
      error.value = null
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Después del login, migrar datos del localStorage a Firebase
      const trackingStore = useTrackingStore()
      await trackingStore.migrateLocalStorageToFirebase()
      
      notify({
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión con Google',
        type: 'success'
      })
      
      return result.user
    } catch (err) {
      error.value = err.message
      notify({
        title: 'Error',
        text: 'No se pudo iniciar sesión con Google',
        type: 'error'
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cerrar sesión
  async function logout() {
    try {
      await signOut(auth)
      user.value = null
      
      // Limpiar el store de tracking
      const trackingStore = useTrackingStore()
      trackingStore.clearData()
      
      notify({
        title: 'Sesión cerrada',
        text: 'Has cerrado sesión correctamente',
        type: 'info'
      })
    } catch (err) {
      error.value = err.message
      notify({
        title: 'Error',
        text: 'No se pudo cerrar sesión',
        type: 'error'
      })
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    initAuth,
    login,
    register,
    loginWithGoogle,
    logout
  }
})

