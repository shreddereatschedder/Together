// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if all required Firebase config values are present
const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value && value !== "undefined" && value !== "",
)

if (!isFirebaseConfigured) {
  console.error(
    "[v0] Firebase configuration is incomplete. Please set all NEXT_PUBLIC_FIREBASE_* environment variables in the Vars section of the sidebar.",
  )
}

// Only initialize Firebase if config is valid and app not already initialized
const app = !getApps().length && isFirebaseConfigured ? initializeApp(firebaseConfig) : getApps()[0]

export const db = app ? getFirestore(app) : null
export const auth = app ? getAuth(app) : null
export const isConfigured = isFirebaseConfigured
