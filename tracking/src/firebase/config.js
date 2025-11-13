import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Tu configuración de Firebase
// Obtén estos valores desde Firebase Console -> Project Settings
const firebaseConfig = {
    apiKey: "AIzaSyDMboHS1Dsg1pMzbbNdeiQLiHZ6h5KafdU",
    authDomain: "ab-metrics-20594.firebaseapp.com",
    projectId: "ab-metrics-20594",
    storageBucket: "ab-metrics-20594.firebasestorage.app",
    messagingSenderId: "768076854229",
    appId: "1:768076854229:web:7d437a2e2ffd51c798435c",
    measurementId: "G-K81QTRXN5L"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Obtener servicios
export const auth = getAuth(app)
export const db = getFirestore(app)

