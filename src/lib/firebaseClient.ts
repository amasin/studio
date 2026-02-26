'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, Functions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

// Idempotent initialization
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);
functions = getFunctions(app);

// Emulator support
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  const authHost = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || 'http://localhost:9099';
  const storageHost = process.env.NEXT_PUBLIC_STORAGE_EMULATOR_HOST || 'localhost:9199';
  const functionsHost = process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST || 'localhost:5001';

  try {
    // Only connect if not already connected (Firebase JS SDK handles some internal state, but double-connection throws)
    // In dev mode with HMR, we should be careful.
    if (!(auth as any)._emulatorConfig) {
      connectAuthEmulator(auth, authHost, { disableWarnings: true });
      connectFirestoreEmulator(db, firestoreHost.split(':')[0], parseInt(firestoreHost.split(':')[1]));
      connectStorageEmulator(storage, storageHost.split(':')[0], parseInt(storageHost.split(':')[1]));
      connectFunctionsEmulator(functions, functionsHost.split(':')[0], parseInt(functionsHost.split(':')[1]));
      console.log("Connected to Firebase Emulators");
    }
  } catch (e) {
    console.warn("Emulator connection warning:", e);
  }
}

export { app, auth, db, storage, functions };
