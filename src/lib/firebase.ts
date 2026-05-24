import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

interface FirebaseHandles {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function readConfig() {
  const env = import.meta.env;
  const missing = REQUIRED_KEYS.filter((k) => !env[k]);
  if (missing.length > 0) return { ok: false as const, missing };
  return {
    ok: true as const,
    config: {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    },
  };
}

let handles: FirebaseHandles | null = null;
let configError: readonly string[] | null = null;

const result = readConfig();
if (result.ok) {
  const app = initializeApp(result.config);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  });
  const auth = getAuth(app);
  handles = { app, auth, db };
} else {
  configError = result.missing;
  if (import.meta.env.DEV) {
    console.warn(
      '[firebase] 必須環境変数が未設定です。オフラインモードで起動します:',
      result.missing,
    );
  }
}

export function isFirebaseConfigured(): boolean {
  return handles !== null;
}

export function getMissingFirebaseKeys(): readonly string[] {
  return configError ?? [];
}

export function getFirebase(): FirebaseHandles {
  if (!handles) {
    throw new Error(
      `Firebase 未設定: ${(configError ?? []).join(', ')}`,
    );
  }
  return handles;
}
