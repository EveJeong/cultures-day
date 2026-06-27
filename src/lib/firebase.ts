import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** .env.local 에 Firebase config가 채워졌는지 여부 */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId)

let app: FirebaseApp | undefined
let db: Firestore | undefined

if (isFirebaseConfigured) {
  app = initializeApp(config)
  db = getFirestore(app)
}

export { app, db }
