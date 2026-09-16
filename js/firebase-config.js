import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3Qr2g_YipaKwHWozJLe9cynKss3z7v44",
  authDomain: "movie-ticket-booking-sys-3d9e8.firebaseapp.com",
  projectId: "movie-ticket-booking-sys-3d9e8",
  storageBucket: "movie-ticket-booking-sys-3d9e8.firebasestorage.app",
  messagingSenderId: "643617596607",
  appId: "1:643617596607:web:58ef9922232cc25ee6d20a",
};

// 1. Main App
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// 2. Admin App (avoid duplicate app initialization errors)
const adminApp = getApps().some((a) => a.name === "AdminApp")
  ? getApp("AdminApp")
  : initializeApp(firebaseConfig, "AdminApp");

export const adminAuth = initializeAuth(adminApp, {
  persistence: inMemoryPersistence,
});