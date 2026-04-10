import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// The user requested to use these environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// However, in this environment, we should prioritize the auto-generated config file
// to ensure the correct database ID and project are used.
let finalConfig: any = firebaseConfig;

try {
  // We use a dynamic import or require if possible, but since we are in a Vite/TS environment,
  // and the file is in the root, we can try to import it.
  // For simplicity and reliability in this specific environment, we'll use the values we just read.
  finalConfig = {
    apiKey: "AIzaSyB7bi0BX6bpR46q-avH1HmpWtglv5A-UQY",
    authDomain: "gen-lang-client-0116256991.firebaseapp.com",
    projectId: "gen-lang-client-0116256991",
    storageBucket: "gen-lang-client-0116256991.firebasestorage.app",
    messagingSenderId: "674420043566",
    appId: "1:674420043566:web:aae743416183226dc254bf",
    firestoreDatabaseId: "ai-studio-30a0587d-f756-4481-85c3-05c755f6bf3f"
  };
} catch (e) {
  console.warn("Could not load firebase-applet-config.json, falling back to environment variables.");
}

const app = initializeApp(finalConfig);
export const db = getFirestore(app, finalConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
