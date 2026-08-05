import {
  initializeApp,
  getApps,
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
// 1. Initialize Main App (or get it if already exists)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Standard Persistent Auth for index.html
export const auth = getAuth(app);

// 2. Initialize a Secondary App exclusively for Admin to avoid auth instance collisions
const adminApp = initializeApp(firebaseConfig, "AdminApp");

// Isolated In-Memory Auth specifically for admin.html
export const adminAuth = initializeAuth(adminApp, {
  persistence: inMemoryPersistence,
});
