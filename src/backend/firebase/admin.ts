import "dotenv/config";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { env } from "@/backend/validation/env";

const globalForFirebase = globalThis as unknown as {
  firebaseApp?: App;
  firestoreDb?: Firestore;
  firebaseStorage?: Storage;
};

export function getFirebaseAdminApp(): App {
  if (globalForFirebase.firebaseApp) {
    return globalForFirebase.firebaseApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    globalForFirebase.firebaseApp = existingApps[0];
    return existingApps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "freelancepay-ai";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

  if (clientEmail && privateKey) {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket,
    });
    globalForFirebase.firebaseApp = app;
    return app;
  }

  // Fallback to default credentials in Google Cloud environment
  const app = initializeApp({
    projectId,
    storageBucket,
  });
  globalForFirebase.firebaseApp = app;
  return app;
}

export function getFirestoreDb(): Firestore {
  if (globalForFirebase.firestoreDb) {
    return globalForFirebase.firestoreDb;
  }
  const app = getFirebaseAdminApp();
  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Settings already applied
  }
  globalForFirebase.firestoreDb = db;
  return db;
}

export function getFirebaseStorage(): Storage {
  if (globalForFirebase.firebaseStorage) {
    return globalForFirebase.firebaseStorage;
  }
  const app = getFirebaseAdminApp();
  const storage = getStorage(app);
  globalForFirebase.firebaseStorage = storage;
  return storage;
}

export const firestore = getFirestoreDb();
export const storage = getFirebaseStorage();
