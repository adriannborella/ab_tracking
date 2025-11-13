import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useTrackingStore } from './trackingStore'
import { notify } from '@kyvg/vue3-notification'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  // Helper function para detectar dispositivos móviles/tablets
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768)
  }

  // Helper function para obtener mensaje de error específico
  function getAuthErrorMessage(errorCode) {
    const errorMessages = {
      'auth/popup-blocked': 'Popup bloqueado. Por favor permite popups para este sitio.',
      'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
      'auth/account-exists-with-different-credential': 'Esta cuenta ya existe con otro método de inicio de sesión.',
      'auth/cancelled-popup-request': 'Solo se puede abrir una ventana de inicio de sesión a la vez.',
      'auth/network-request-failed': 'Error de conexión. Por favor verifica tu conexión a internet.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Por favor intenta más tarde.'
    }
    return errorMessages[errorCode] || 'No se pudo iniciar sesión con Google'
  }

  // Inicializar el listener de autenticación
  async function initAuth() {
    // Primero manejar el resultado de redirect si existe (antes de que onAuthStateChanged se dispare)
    // Esto asegura que la migración y notificaciones se ejecuten antes de que el listener procese el usuario
    let redirectUser = null
    try {
      redirectUser = await handleRedirectResult()
    } catch (error) {
      // Error ya manejado por handleRedirectResult, continuar con la inicialización
      console.error('Error handling redirect result:', error)
    }
    
    // Si el redirect result proporcionó un usuario, resolver inmediatamente
    // El estado ya está establecido en handleRedirectResult
    if (redirectUser) {
      return redirectUser
    }
    
    // Si no hay redirect result, esperar por el listener de auth state
    return new Promise((resolve) => {
      // Usar una variable para asegurar que resolve solo se llama una vez
      let resolved = false
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        // Solo actualizar si no fue ya establecido por handleRedirectResult
        const wasAlreadySet = user.value && user.value.uid === firebaseUser?.uid
        if (!wasAlreadySet) {
          user.value = firebaseUser
        }
        loading.value = false
        
        if (firebaseUser && !wasAlreadySet) {
          // Usuario autenticado - cargar datos desde Firebase
          // Solo cargar si no fue ya cargado por handleRedirectResult
          const trackingStore = useTrackingStore()
          await trackingStore.loadFromFirebase()
        }
        
        // Solo resolver la promesa una vez
        if (!resolved) {
          resolved = true
          resolve(firebaseUser)
        }
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
      
      // En dispositivos móviles, usar redirect directamente
      // if (isMobileDevice()) {
      //   await signInWithRedirect(auth, provider)
      //   // El redirect causará que la página se recargue, así que no resetear loading
      //   // La página se recargará antes de que el finally se ejecute
      //   return
      // }

      // En desktop, intentar popup primero
      try {
        const result = await signInWithPopup(auth, provider)
        
        // Después del login, migrar datos del localStorage a Firebase
        const trackingStore = useTrackingStore()
        await trackingStore.migrateLocalStorageToFirebase()
        
        notify({
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión con Google',
          type: 'success'
        })
        
        loading.value = false
        return result.user
      } catch (popupError) {
        // Si el popup falla por bloqueo o cancelación, intentar redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          // Si el usuario cerró el popup, no hacer redirect automático
          if (popupError.code === 'auth/popup-closed-by-user') {
            loading.value = false
            throw popupError
          }
          // Para popup bloqueado, usar redirect
          await signInWithRedirect(auth, provider)
          // El redirect causará que la página se recargue, así que no resetear loading
          return
        }
        // Para otros errores, resetear loading y relanzar
        loading.value = false
        throw popupError
      }
    } catch (err) {
      error.value = err.message
      const errorMessage = getAuthErrorMessage(err.code)
      
      // No mostrar notificación si el usuario canceló explícitamente
      if (err.code !== 'auth/popup-closed-by-user') {
        notify({
          title: 'Error',
          text: errorMessage,
          type: 'error'
        })
      }
      
      // Solo resetear loading si no es un redirect (que causaría recarga de página)
      // Si llegamos aquí, es porque hubo un error antes del redirect
      loading.value = false
      throw err
    }
  }

  // Manejar resultado de redirect después de autenticación con Google
  async function handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth)
      if (result && result.user) {
        // Usuario autenticado después del redirect - establecer estado inmediatamente
        user.value = result.user
        loading.value = false
        
        // Migrar y cargar datos desde Firebase
        const trackingStore = useTrackingStore()
        await trackingStore.migrateLocalStorageToFirebase()
        await trackingStore.loadFromFirebase()
        
        notify({
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión con Google',
          type: 'success'
        })
        
        return result.user
      }
      return null
    } catch (err) {
      error.value = err.message
      const errorMessage = getAuthErrorMessage(err.code)
      
      notify({
        title: 'Error',
        text: errorMessage,
        type: 'error'
      })
      
      throw err
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
    handleRedirectResult,
    logout
  }
})

