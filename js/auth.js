import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Register New User
export async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 2. Login User
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 3. Logout User
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 4. Forgot Password / Password Reset
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "Password reset email sent successfully.",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// 5. Auth State Observer
export function initAuthListener(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}
