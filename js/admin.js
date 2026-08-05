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

// Check if already authenticated in this specific admin session tab
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const adminDocRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
      document.getElementById("admin-auth-container").classList.add("hidden");
      document
        .getElementById("admin-dashboard-container")
        .classList.remove("hidden");
      document.getElementById("admin-user-email").innerText = user.email;
      loadAdminDashboard();
    } else {
      await signOut(auth);
      document
        .getElementById("admin-dashboard-container")
        .classList.add("hidden");
      document
        .getElementById("admin-auth-container")
        .classList.remove("hidden");
    }
  }
});

// Independent Admin Login Action
window.handleAdminLogin = async function (e) {
  e.preventDefault();
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    const adminDocRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
      document.getElementById("admin-auth-container").classList.add("hidden");
      document
        .getElementById("admin-dashboard-container")
        .classList.remove("hidden");
      document.getElementById("admin-user-email").innerText = user.email;
      loadAdminDashboard();
    } else {
      await signOut(auth);
      alert(
        "Access Denied: This account does not have administrator permissions.",
      );
    }
  } catch (err) {
    console.error("Admin Login Error:", err.code);
    alert("Invalid admin credentials. Please try again.");
  }
};

window.handleAdminLogout = function () {
  signOut(auth).then(() => {
    window.location.reload();
  });
};

async function loadAdminDashboard() {
  await Promise.all([
    renderAdminMovies(),
    renderAdminBookings(),
    updateDashboardStats(),
  ]);
}

window.handleAddMovie = async function (e) {
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
};

window.deleteMovie = async function (movieId) {
  if (!confirm("Are you sure you want to delete this movie?")) return;
  try {
    await deleteDoc(doc(db, "movies", movieId));
    alert("Movie deleted.");
    loadAdminDashboard();
  } catch (err) {
    alert("Failed to delete movie.");
  }
};

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
                    <img src="${movie.posterUrl}" class="w-10 h-14 object-cover rounded-lg">
                    <div>
                        <h4 class="font-bold text-white text-sm">${movie.title}</h4>
                        <p class="text-xs text-rose-400">${movie.genre}</p>
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

  querySnapshot.forEach((docSnap) => {
    const booking = docSnap.data();
    container.innerHTML += `
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-sm">
                <div>
                    <p class="text-rose-400 font-bold mb-0.5 text-xs">${booking.userEmail}</p>
                    <p class="text-slate-300 text-xs">Slot: <span class="font-semibold">${booking.timeSlot}</span> | Seats: <span class="text-white font-bold">${booking.seats.join(", ")}</span></p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-white">₹${booking.amount}</p>
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
  bookingsSnap.forEach((doc) => {
    revenue += doc.data().amount || 0;
  });
  document.getElementById("stat-total-revenue").innerText = `₹${revenue}`;
}

// import {
//   doc,
//   getDoc,
//   deleteDoc,
//   updateDoc,
//   arrayRemove,
//   collection,
//   getDocs,
// } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// window.deleteBooking = async function (bookingId) {
//   if (
//     !confirm(
//       "Are you sure you want to cancel and delete this booking? This will also unlock the seats.",
//     )
//   )
//     return;

//   try {
//     // 1. Get the booking details first so we know which movie slot and seats to unlock
//     const bookingRef = doc(db, "bookings", bookingId);
//     const bookingSnap = await getDoc(bookingRef);

//     if (!bookingSnap.exists()) {
//       alert("Booking not found.");
//       return;
//     }

//     const bookingData = bookingSnap.data();
//     const movieId = bookingData.movieId;
//     const timeSlot = bookingData.timeSlot;
//     const bookedSeatsArray = bookingData.seats; // e.g. ["A1", "A2"]

//     // 2. If the booking has associated seats, remove them from the showSeats document
//     if (
//       movieId &&
//       timeSlot &&
//       bookedSeatsArray &&
//       bookedSeatsArray.length > 0
//     ) {
//       const showSeatDocRef = doc(db, "showSeats", `${movieId}_${timeSlot}`);

//       // This safely removes the specific seats from the array shown in your image
//       await updateDoc(showSeatDocRef, {
//         bookedSeats: arrayRemove(...bookedSeatsArray),
//       });
//     }

//     // 3. Finally, delete the booking receipt document itself
//     await deleteDoc(bookingRef);

//     alert("Booking cancelled and seats unlocked successfully!");
//     loadAdminDashboard();
//   } catch (err) {
//     console.error("Error deleting booking and unlocking seats:", err);
//     alert("Failed to delete booking. Please check console.");
//   }
// };
