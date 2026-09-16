import { db, adminAuth as auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const adminDocRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
      document.getElementById("admin-auth-container").classList.add("hidden");
      document.getElementById("admin-dashboard-container").classList.remove("hidden");
      document.getElementById("admin-user-email").innerText = user.email;
      loadAdminDashboard();
    } else {
      await signOut(auth);
      document.getElementById("admin-dashboard-container").classList.add("hidden");
      document.getElementById("admin-auth-container").classList.remove("hidden");
    }
  }
});

export async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const adminDocRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
      document.getElementById("admin-auth-container").classList.add("hidden");
      document.getElementById("admin-dashboard-container").classList.remove("hidden");
      document.getElementById("admin-user-email").innerText = user.email;
      loadAdminDashboard();
    } else {
      await signOut(auth);
      alert("Access Denied: Account lacks admin permissions.");
    }
  } catch (err) {
    alert("Invalid admin credentials.");
  }
}

export function handleAdminLogout() {
  signOut(auth).then(() => window.location.reload());
}

async function loadAdminDashboard() {
  await Promise.all([
    renderAdminMovies(),
    renderAdminBookings(),
    updateDashboardStats(),
  ]);
}

export async function handleAddMovie(e) {
  e.preventDefault();
  const title = document.getElementById("admin-movie-title").value;
  const genre = document.getElementById("admin-movie-genre").value;
  const description = document.getElementById("admin-movie-desc").value;
  const posterUrl = document.getElementById("admin-movie-poster").value;

  try {
    await addDoc(collection(db, "movies"), {
      title,
      genre,
      description,
      posterUrl,
      createdAt: new Date(),
    });
    alert("Movie added successfully!");
    document.getElementById("add-movie-form").reset();
    loadAdminDashboard();
  } catch (err) {
    alert("Failed to add movie.");
  }
}

export async function deleteMovie(movieId) {
  if (!confirm("Are you sure you want to delete this movie?")) return;
  try {
    await deleteDoc(doc(db, "movies", movieId));
    loadAdminDashboard();
  } catch (err) {
    alert("Failed to delete movie.");
  }
}

async function renderAdminMovies() {
  const container = document.getElementById("admin-movies-list");
  if (!container) return;

  const querySnapshot = await getDocs(collection(db, "movies"));
  container.innerHTML = "";

  if (querySnapshot.empty) {
    container.innerHTML = `<p class="text-slate-500 text-sm">No movies found.</p>`;
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const movie = docSnap.data();
    container.innerHTML += `
      <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <img src="${movie.posterUrl || movie.poster || ''}" class="w-10 h-14 object-cover rounded-lg">
          <div>
            <h4 class="font-bold text-white text-sm">${movie.title}</h4>
            <p class="text-xs text-rose-400">${movie.genre || ''}</p>
          </div>
        </div>
        <button onclick="deleteMovie('${docSnap.id}')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">Delete</button>
      </div>
    `;
  });
}

async function renderAdminBookings() {
  const container = document.getElementById("admin-bookings-list");
  if (!container) return;

  const querySnapshot = await getDocs(collection(db, "bookings"));
  container.innerHTML = "";

  if (querySnapshot.empty) {
    container.innerHTML = `<p class="text-slate-500 text-sm">No bookings recorded.</p>`;
    return;
  }

  const bookings = [];
  querySnapshot.forEach((docSnap) => {
    bookings.push({ id: docSnap.id, ...docSnap.data() });
  });

  bookings.sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  bookings.forEach((booking) => {
    let dateStr = "N/A";
    let timeStr = "";

    if (booking.createdAt) {
      const dateObj = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
      dateStr = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    const seatsList = Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats || "N/A";

    container.innerHTML += `
      <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-sm">
        <div>
          <p class="text-rose-400 font-bold mb-0.5 text-xs">${booking.userEmail || "Anonymous"}</p>
          <p class="text-slate-300 text-xs">
            Slot: <span class="font-semibold text-white">${booking.timeSlot}</span> | Seats: <span class="text-white font-bold">${seatsList}</span>
          </p>
          <p class="text-slate-500 text-[11px] mt-1">
            📅 Date: <span class="text-slate-400 font-medium">${dateStr}</span> 
            ${timeStr ? `| 🕒 Time: <span class="text-slate-400 font-medium">${timeStr}</span>` : ""}
          </p>
        </div>
        <div class="text-right">
          <p class="font-bold text-white">₹${booking.amount || 0}</p>
        </div>
      </div>
    `;
  });
}

async function updateDashboardStats() {
  const moviesSnap = await getDocs(collection(db, "movies"));
  const bookingsSnap = await getDocs(collection(db, "bookings"));

  document.getElementById("stat-total-movies").innerText = moviesSnap.size;
  document.getElementById("stat-total-bookings").innerText = bookingsSnap.size;

  let revenue = 0;
  bookingsSnap.forEach((d) => {
    revenue += d.data().amount || 0;
  });
  document.getElementById("stat-total-revenue").innerText = `₹${revenue}`;
}

export function toggleAdminTheme() {
  const body = document.body;
  const btn = document.getElementById("theme-toggle-btn");
  body.classList.toggle("light-theme");
  const isLight = body.classList.contains("light-theme");
  localStorage.setItem("app-theme", isLight ? "light" : "dark");
  if (btn) btn.innerText = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
}

window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.handleAddMovie = handleAddMovie;
window.deleteMovie = deleteMovie;
window.toggleAdminTheme = toggleAdminTheme;

const savedTheme = localStorage.getItem("app-theme");
if (savedTheme === "light") {
  document.body.classList.add("light-theme");
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) btn.innerText = "☀️ Light Mode";
}