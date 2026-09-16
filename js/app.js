import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
<<<<<<< HEAD
  onSnapshot,
  query,
  where,
=======
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
  Timestamp,
>>>>>>> upstream/main
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const API_BASE_URL = window.MOVIENEST_API_URL || "http://127.0.0.1:8000";

let currentUser = null;
let currentViewData = {};
let currentAuthMode = "login";

<<<<<<< HEAD
// Update Nav Controls
export function updateNavAuthUI() {
  const container = document.getElementById("auth-nav-container");
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="flex items-center space-x-3">
        <button onclick="router('profile')" class="text-sm font-medium hover:text-rose-500">My Bookings</button>
        <span class="text-slate-400 text-sm hidden sm:inline">${currentUser.email}</span>
        <button onclick="handleLogout()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm transition">Logout</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex space-x-2">
        <button onclick="openAuthModal('login')" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm">Login</button>
        <button onclick="openAuthModal('signup')" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm">Sign Up</button>
=======
/* ============================================================
   SEAT LOCKING STATE
   ============================================================ */

let selectedSeatIds = new Set();

let seatLocksUnsubscribe = null;
let bookedSeatsUnsubscribe = null;
let seatLockTimer = null;

const SEAT_PRICE = 200;
const SEAT_LOCK_DURATION = 10 * 60 * 1000;

/* ============================================================
   AUTH STATE
   ============================================================ */

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  updateNavAuthUI();

  if (currentUser) {
    router("home");
  } else {
    cleanupSeatListeners();

    const appView = document.getElementById("app-view");

    appView.innerHTML = `
      <div class="text-center py-20">
        <h1 class="text-4xl font-extrabold mb-4">
          Welcome to MovieNest
        </h1>

        <p class="text-slate-400 mb-8">
          Please sign in to browse and book movie tickets.
        </p>

        <button
          onclick="openAuthModal('login')"
          class="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-rose-600/20"
        >
          Get Started
        </button>
      </div>
    `;

    openAuthModal("login");
  }
});

/* ============================================================
   NAV AUTH UI
   ============================================================ */

window.updateNavAuthUI = function () {
  const container = document.getElementById("auth-nav-container");

  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="relative group">

        <button
          type="button"
          class="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 transition"
          aria-label="User profile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        <div
          class="absolute right-0 top-full mt-2 hidden group-hover:block z-[100]"
        >
          <div
            class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 min-w-[230px]"
          >

            <p class="text-xs text-slate-500 mb-1">
              Signed in as
            </p>

            <p class="text-sm text-white font-medium truncate">
              ${escapeHTML(currentUser.email || "")}
            </p>

            <div class="border-t border-slate-800 my-3"></div>

            <button
              onclick="router('profile')"
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              My Bookings
            </button>

            <button
              onclick="handleLogout()"
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition"
            >
              Logout
            </button>

          </div>
        </div>

      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="flex space-x-2">

        <button
          onclick="openAuthModal('login')"
          class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
        >
          Login
        </button>

        <button
          onclick="openAuthModal('signup')"
          class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm"
        >
          Sign Up
        </button>

>>>>>>> upstream/main
      </div>
    `;
  }
}

<<<<<<< HEAD
// Router Handler
export async function router(view, data = null) {
  // Protected views
  if (!currentUser && (view === "profile" || view === "seats")) {
=======
/* ============================================================
   ROUTER
   ============================================================ */

window.router = async function (view, data = null) {
  if (!currentUser && view !== "login") {
>>>>>>> upstream/main
    openAuthModal("login");
    return;
  }

  /*
   * If leaving seat selection, stop Firestore listeners
   * and timer.
   */
  if (view !== "seats") {
    cleanupSeatListeners();
    selectedSeatIds.clear();
  }

  const appView = document.getElementById("app-view");
<<<<<<< HEAD
  if (!appView) return;
=======

>>>>>>> upstream/main
  currentViewData = data;

  if (view === "home") {
    appView.innerHTML = `
      <div class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"
        ></div>
      </div>
    `;

    const movies = await fetchMovies();

    renderHome(movies);
  } else if (view === "details") {
    renderMovieDetails(data);
  } else if (view === "seats") {
    renderSeatSelection(data);
  } else if (view === "profile") {
    renderUserProfile();
  }
<<<<<<< HEAD
}

async function fetchMovies() {
  try {
    const querySnapshot = await getDocs(collection(db, "movies"));
    let movies = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      movies.push({
        id: docSnap.id,
        title: data.title || "Untitled",
        genre: data.genre || "General",
        duration: data.duration || "",
        description: data.description || "",
        posterUrl: data.posterUrl || data.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80",
        price: data.price || 200,
      });
    });
    return movies;
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    return [];
  }
=======
};

/* ============================================================
   FETCH MOVIES
   ============================================================ */

async function fetchMovies() {
  const querySnapshot = await getDocs(collection(db, "movies"));

  let movies = [];

  querySnapshot.forEach((docSnap) => {
    movies.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });

  return movies;
>>>>>>> upstream/main
}

/* ============================================================
   HOME
   ============================================================ */

function renderHome(movies) {
  const appView = document.getElementById("app-view");

  appView.innerHTML = `
    <div class="mb-8">
<<<<<<< HEAD
      <h1 class="text-3xl font-extrabold mb-2">Now Showing</h1>
      <p class="text-slate-400">Book tickets for the latest blockbuster movies.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="movies-grid">
=======

      <h1 class="text-3xl font-extrabold mb-2">
        Now Showing
      </h1>

      <p class="text-slate-400">
        Book tickets for the latest blockbuster movies.
      </p>

    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      id="movies-grid"
    >
>>>>>>> upstream/main
      ${
        movies.length === 0
          ? '<p class="text-slate-500 col-span-full text-center py-10">No movies found. Add movies via Admin dashboard.</p>'
          : ""
      }
    </div>
  `;

  const grid = document.getElementById("movies-grid");

  movies.forEach((movie) => {
    const card = document.createElement("div");

    card.className =
<<<<<<< HEAD
      "movie-card bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition cursor-pointer flex flex-col";
=======
      "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition cursor-pointer flex flex-col";

>>>>>>> upstream/main
    card.onclick = () => router("details", movie);

    card.innerHTML = `
<<<<<<< HEAD
      <img src="${movie.posterUrl}" alt="${movie.title}" class="w-full h-80 object-cover">
      <div class="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-bold text-lg mb-1">${movie.title}</h3>
          <p class="text-sm text-slate-400">${movie.genre}</p>
        </div>
        <button class="mt-4 w-full bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white py-2 rounded-lg font-medium transition text-sm">Book Tickets</button>
      </div>
    `;
=======
      <img
        src="${movie.posterUrl || "https://via.placeholder.com/300x450"}"
        alt="${escapeHTML(movie.title || "Movie")}"
        class="w-full h-80 object-cover"
      >

      <div class="p-4 flex flex-col flex-grow justify-between">

        <div>

          <h3 class="font-bold text-lg mb-1">
            ${escapeHTML(movie.title || "Untitled Movie")}
          </h3>

          <p class="text-sm text-slate-400">
            ${escapeHTML(movie.genre || "Action/Drama")}
          </p>

        </div>

        <button
          class="mt-4 w-full bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white py-2 rounded-lg font-medium transition text-sm"
        >
          Book Tickets
        </button>

      </div>
    `;

>>>>>>> upstream/main
    grid.appendChild(card);
  });
}

/* ============================================================
   MOVIE DETAILS
   ============================================================ */

function renderMovieDetails(movie) {
  if (!movie) return router("home");
  const appView = document.getElementById("app-view");
<<<<<<< HEAD
  const movieJson = encodeURIComponent(JSON.stringify(movie));

  appView.innerHTML = `
    <button onclick="router('home')" class="mb-6 text-sm text-slate-400 hover:text-white flex items-center">&larr; Back to Movies</button>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <img src="${movie.posterUrl}" class="w-full rounded-2xl shadow-xl h-[450px] object-cover" alt="${movie.title}">
      <div class="md:col-span-2 space-y-6">
        <h1 class="text-4xl font-black">${movie.title}</h1>
        <p class="text-slate-300 leading-relaxed">${movie.description || "No description available."}</p>
        
        <div class="border-t border-slate-800 pt-6">
          <h3 class="text-lg font-bold mb-4">Select Show Date & Time</h3>
          <div class="flex gap-4 mb-4">
            <button class="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium">Today</button>
          </div>
          <div class="flex flex-wrap gap-3">
            <button onclick='proceedToSeats("${movieJson}", "10:00 AM")' class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition">10:00 AM</button>
            <button onclick='proceedToSeats("${movieJson}", "02:30 PM")' class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition">02:30 PM</button>
            <button onclick='proceedToSeats("${movieJson}", "07:00 PM")' class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition">07:00 PM</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function proceedToSeats(movieEncoded, timeSlot) {
=======

  appView.innerHTML = `
    <button
      onclick="router('home')"
      class="mb-6 text-sm text-slate-400 hover:text-white flex items-center"
    >
      &larr; Back to Movies
    </button>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

      <img
        src="${movie.posterUrl || ""}"
        class="w-full rounded-2xl shadow-xl h-[450px] object-cover"
        alt="${escapeHTML(movie.title || "Movie")}"
      >

      <div class="md:col-span-2 space-y-6">

        <h1 class="text-4xl font-black">
          ${escapeHTML(movie.title || "Movie")}
        </h1>

        <p class="text-slate-300 leading-relaxed">
          ${escapeHTML(movie.description || "No description available.")}
        </p>

        <div class="border-t border-slate-800 pt-6">

          <h3 class="text-lg font-bold mb-4">
            Select Show Date & Time
          </h3>

          <div class="flex gap-4 mb-4">

            <button
              class="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium"
            >
              Today
            </button>

          </div>

          <div class="flex gap-3 flex-wrap">

            <button
              id="show-10am"
              class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition"
            >
              10:00 AM
            </button>

            <button
              id="show-230pm"
              class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition"
            >
              02:30 PM
            </button>

            <button
              id="show-7pm"
              class="px-4 py-2 border border-slate-700 hover:border-rose-500 rounded-lg text-sm font-medium transition"
            >
              07:00 PM
            </button>

          </div>

        </div>

      </div>

    </div>
  `;

  document.getElementById("show-10am").onclick = () => {
    proceedToSeats(movie, "10:00 AM");
  };

  document.getElementById("show-230pm").onclick = () => {
    proceedToSeats(movie, "02:30 PM");
  };

  document.getElementById("show-7pm").onclick = () => {
    proceedToSeats(movie, "07:00 PM");
  };
}

/* ============================================================
   PROCEED TO SEATS
   ============================================================ */

window.proceedToSeats = function (movie, timeSlot) {
>>>>>>> upstream/main
  if (!currentUser) {
    openAuthModal("login");

    return;
  }
<<<<<<< HEAD
  const movie = typeof movieEncoded === "string" ? JSON.parse(decodeURIComponent(movieEncoded)) : movieEncoded;
  router("seats", { movie, timeSlot });
}
=======

  router("seats", {
    movie,
    timeSlot,
  });
};
>>>>>>> upstream/main

/* ============================================================
   SEAT SELECTION
   ============================================================ */

function renderSeatSelection(data) {
<<<<<<< HEAD
  if (!data || !data.movie) return router("home");
  const appView = document.getElementById("app-view");
  const movieJson = encodeURIComponent(JSON.stringify(data.movie));

  appView.innerHTML = `
    <button onclick="router('home')" class="mb-6 text-sm text-slate-400 hover:text-white">&larr; Cancel Booking</button>
    <div class="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <h2 class="text-xl font-bold mb-1 text-center">${data.movie.title}</h2>
      <p class="text-sm text-slate-400 text-center mb-6">Show Time: ${data.timeSlot}</p>
      
      <div class="w-full bg-slate-800 h-2 rounded mb-10 text-center text-xs text-slate-500 uppercase tracking-widest pt-3">Screen This Way</div>
      
      <div class="grid grid-cols-6 gap-3 max-w-md mx-auto mb-8" id="seat-grid"></div>

      <div class="flex justify-center gap-6 mb-6 text-xs text-slate-400">
        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-slate-800 border border-slate-700 rounded"></div> Available</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-rose-600 rounded"></div> Selected</div>
        <div class="flex items-center gap-2"><div class="w-3 h-3 bg-slate-950 border border-slate-800 text-slate-600 rounded"></div> Occupied</div>
      </div>

      <div class="flex justify-between items-center border-t border-slate-800 pt-6">
        <div>
          <p class="text-sm text-slate-400">Selected Seats: <span id="selected-seats-count" class="text-white font-bold">0</span></p>
          <p class="text-lg font-bold text-rose-500">₹<span id="total-price">0</span></p>
        </div>
        <button onclick='initiateRazorpayPayment("${movieJson}", "${data.timeSlot}")' class="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-rose-600/20">Proceed to Payment</button>
      </div>
    </div>
  `;

  const seatDocRef = doc(db, "showSeats", `${data.movie.id}_${data.timeSlot}`);

  onSnapshot(seatDocRef, (docSnap) => {
    let bookedSeats = [];
    if (docSnap.exists()) {
      bookedSeats = docSnap.data().bookedSeats || [];
    }

    const seatGrid = document.getElementById("seat-grid");
    if (!seatGrid) return;
    seatGrid.innerHTML = "";
    const rows = ["A", "B", "C", "D"];
=======
  cleanupSeatListeners();

  selectedSeatIds.clear();

  const appView = document.getElementById("app-view");

  appView.innerHTML = `
    <button
      onclick="router('home')"
      class="mb-6 text-sm text-slate-400 hover:text-white"
    >
      &larr; Cancel Booking
    </button>

    <div
      class="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl"
    >

      <h2 class="text-xl font-bold mb-1 text-center">
        Select Your Seats
      </h2>

      <p class="text-sm text-slate-400 text-center mb-3">
        Show Time: ${escapeHTML(data.timeSlot)}
      </p>

      <!-- TIMER -->

      <div
        id="seat-lock-timer"
        class="hidden text-center mb-6"
      >

        <div
          class="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
            ></circle>

            <polyline
              points="12 7 12 12 15 14"
            ></polyline>
          </svg>

          <span>
            Seats held for
            <strong id="seat-lock-countdown">
              10:00
            </strong>
          </span>

        </div>

      </div>


      <!-- SCREEN -->

      <div
        class="w-full max-w-xl mx-auto mb-10 text-center"
      >

        <div
          class="h-2 bg-rose-500 rounded-full shadow-[0_0_25px_rgba(244,63,94,0.7)]"
        ></div>

        <p
          class="text-xs text-rose-400 uppercase tracking-[0.3em] mt-3 font-semibold"
        >
          Screen This Way
        </p>

      </div>


      <!-- SEAT GRID -->

      <div
        id="seat-grid"
        class="seat-grid"
      ></div>


      <!-- LEGEND -->

      <div
        class="flex justify-center gap-6 mb-6 text-xs text-slate-400 flex-wrap"
      >

        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 bg-slate-800 border border-slate-700 rounded"
          ></div>
          Available
        </div>

        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 bg-rose-600 rounded"
          ></div>
          Selected
        </div>

        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 bg-amber-500 rounded"
          ></div>
          Temporarily Locked
        </div>

        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 bg-slate-900 border border-slate-800 rounded"
          ></div>
          Occupied
        </div>

      </div>


      <!-- BOOKING SUMMARY -->

      <div
        class="flex justify-between items-center border-t border-slate-800 pt-6 gap-4"
      >

        <div>

          <p class="text-sm text-slate-400">
            Selected Seats:

            <span
              id="selected-seats-count"
              class="text-white font-bold"
            >
              0
            </span>
          </p>

          <p class="text-lg font-bold text-rose-500">
            ₹<span id="total-price">0</span>
          </p>

        </div>

        <button
          id="proceed-payment-btn"
          onclick='initiateRazorpayPayment(${JSON.stringify(
            data.movie,
          )}, "${data.timeSlot}")'
          class="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Payment
        </button>

      </div>

    </div>
  `;

  /*
   * Permanent booked seats listener
   */

  const seatDocRef = doc(db, "showSeats", `${data.movie.id}_${data.timeSlot}`);

  bookedSeatsUnsubscribe = onSnapshot(
    seatDocRef,
    async (docSnap) => {
      let bookedSeats = [];

      if (docSnap.exists()) {
        bookedSeats = docSnap.data().bookedSeats || [];
      } else {
        /*
         * Create showSeats document if it
         * doesn't exist.
         */
>>>>>>> upstream/main

        try {
          await setDoc(
            seatDocRef,
            {
              bookedSeats: [],
            },
            {
              merge: true,
            },
          );
        } catch (error) {
          console.error("Unable to initialize show seats:", error);
        }
      }

<<<<<<< HEAD
        if (isBooked) {
          seatBtn.className = `p-3 rounded-lg text-xs font-bold bg-slate-950 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50`;
          seatBtn.innerText = seatId;
          seatBtn.disabled = true;
        } else {
          seatBtn.className = `seat-btn p-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-600/30 border border-slate-700 text-slate-300 transition`;
          seatBtn.innerText = seatId;

          seatBtn.onclick = () => {
            const isSelected = seatBtn.classList.contains("selected-seat");
            const currentlySelected = document.querySelectorAll(".selected-seat").length;

            if (!isSelected && currentlySelected >= 6) {
              alert("You can select a maximum of 6 seats.");
              return;
            }

            seatBtn.classList.toggle("bg-rose-600");
            seatBtn.classList.toggle("text-white");
            seatBtn.classList.toggle("selected-seat");
            updateBookingSummary();
=======
      renderSeatButtons(data, bookedSeats, getCurrentLockedSeats());
    },
    (error) => {
      console.error("Booked seats listener error:", error);

      showCustomPopup("Unable to load seat availability.", "error");
    },
  );

  /*
   * Temporary lock listener
   */

  const locksQuery = query(
    collection(db, "seatLocks"),
    where("movieId", "==", data.movie.id),
    where("timeSlot", "==", data.timeSlot),
  );

  seatLocksUnsubscribe = onSnapshot(
    locksQuery,
    (snapshot) => {
      const now = Date.now();

      const locks = {};

      snapshot.forEach((docSnap) => {
        const lock = docSnap.data();

        const expiresAt = lock.expiresAt?.toMillis?.() || 0;

        /*
         * Only consider active locks.
         */

        if (lock.status === "locked" && expiresAt > now) {
          locks[lock.seatId] = {
            ...lock,
            expiresAt,
>>>>>>> upstream/main
          };
        }
      });

      currentViewData.activeLocks = locks;

      renderSeatButtons(data, currentViewData.bookedSeats || [], locks);

      updateSeatLockTimer(data.movie.id, data.timeSlot, locks);
    },
    (error) => {
      console.error("Seat lock listener error:", error);

      showCustomPopup("Unable to monitor seat locks.", "error");
    },
  );

  /*
   * Start timer
   */

  startSeatLockTimer(data.movie.id, data.timeSlot);
}

/* ============================================================
   GET CURRENT LOCKED SEATS
   ============================================================ */

function getCurrentLockedSeats() {
  if (currentViewData && currentViewData.activeLocks) {
    return currentViewData.activeLocks;
  }

  return {};
}

<<<<<<< HEAD
export async function initiateRazorpayPayment(movieEncoded, timeSlot) {
  const movie = typeof movieEncoded === "string" ? JSON.parse(decodeURIComponent(movieEncoded)) : movieEncoded;
  const selected = document.querySelectorAll(".selected-seat");
  if (selected.length === 0) {
    alert("Please select at least one seat.");
    return;
  }

  const seatIds = Array.from(selected).map((el) => el.innerText.trim());

  let order;
  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        movie_id: movie.id,
        time_slot: timeSlot,
        seats: seatIds,
      }),
    });

    if (!response.ok) {
      const errRes = await response.json();
      throw new Error(errRes.detail || "Unable to start payment.");
    }
    order = await response.json();
  } catch (err) {
    console.error("Order creation failed:", err);
    alert(err.message || "Unable to start payment. Please try again.");
    return;
  }

  const options = {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "MovieNest",
    description: `Booking for ${movie.title}`,
    handler: async function (paymentRes) {
      try {
        const token = await currentUser.getIdToken();
        const confirmRes = await fetch(`${API_BASE_URL}/api/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            movie_id: movie.id,
            time_slot: timeSlot,
            seats: seatIds,
            order_id: paymentRes.razorpay_order_id,
            payment_id: paymentRes.razorpay_payment_id,
            signature: paymentRes.razorpay_signature,
          }),
        });

        if (!confirmRes.ok) {
          const errData = await confirmRes.json();
          throw new Error(errData.detail || "Payment verification failed.");
        }

        const confirmation = await confirmRes.json();

        const bookingData = {
          userEmail: currentUser.email,
          movieTitle: movie.title,
          posterUrl: movie.posterUrl,
          movieId: movie.id,
          timeSlot: timeSlot,
          seats: seatIds,
          amount: confirmation.amount,
          paymentId: paymentRes.razorpay_payment_id,
        };

        await generateTicketPDF(bookingData);
        alert("Payment Successful! Booking Confirmed.");
        router("profile");
      } catch (err) {
        console.error("Booking confirmation error:", err);
        alert(err.message || "Booking verification failed. Contact support if amount was deducted.");
        router("seats", { movie, timeSlot });
=======
/* ============================================================
   RENDER SEAT BUTTONS
   ============================================================ */

function renderSeatButtons(data, bookedSeats = [], locks = {}) {
  /*
   * Save booked seats so the lock listener can
   * use them too.
   */

  currentViewData.bookedSeats = bookedSeats;

  const seatGrid = document.getElementById("seat-grid");

  if (!seatGrid) return;

  /*
   * Don't rebuild if we have navigated away.
   */

  if (
    currentViewData?.movie?.id &&
    currentViewData.movie.id !== data.movie.id
  ) {
    return;
  }

  seatGrid.innerHTML = "";

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];

  rows.forEach((row) => {
    for (let i = 1; i <= 10; i++) {
      const seatId = `${row}${i}`;

      const isBooked = bookedSeats.includes(seatId);

      const lock = locks[seatId];

      const isLocked = !!lock;

      const isOwnLock =
        isLocked && currentUser && lock.userId === currentUser.uid;

      const isSelected = selectedSeatIds.has(seatId);

      const seatBtn = document.createElement("button");

      seatBtn.type = "button";

      seatBtn.innerText = seatId;

      /*
       * PERMANENTLY BOOKED
       */

      if (isBooked) {
        seatBtn.className =
          "seat-btn p-3 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50";

        seatBtn.disabled = true;
      } else if (isLocked && !isOwnLock) {

      /*
       * TEMPORARILY LOCKED BY ANOTHER USER
       */
        seatBtn.className =
          "seat-btn p-3 rounded-lg text-xs font-bold bg-amber-500 border border-amber-400 text-white cursor-not-allowed opacity-90";

        seatBtn.disabled = true;

        seatBtn.title = "This seat is temporarily locked by another user.";
      } else if (isOwnLock && isSelected) {

      /*
       * CURRENT USER'S SELECTED SEAT
       */
        seatBtn.className =
          "seat-btn selected-seat p-3 rounded-lg text-xs font-bold";

        seatBtn.disabled = false;
      } else if (isOwnLock) {

      /*
       * CURRENT USER HAS LOCK BUT LOCAL
       * STATE WAS LOST
       */
        selectedSeatIds.add(seatId);

        seatBtn.className =
          "seat-btn selected-seat p-3 rounded-lg text-xs font-bold";

        seatBtn.disabled = false;
      } else {

      /*
       * NORMAL AVAILABLE SEAT
       */
        seatBtn.className =
          "seat-btn p-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-600/30 border border-slate-700 text-slate-300 transition";

        seatBtn.disabled = false;
      }

      /*
       * Seat click
       */

      seatBtn.onclick = async () => {
        if (isBooked) {
          return;
        }

        if (isLocked && !isOwnLock) {
          showCustomPopup(
            `Seat ${seatId} is currently locked by another user.`,
            "error",
          );

          return;
        }

        /*
         * UNSELECT
         */

        if (selectedSeatIds.has(seatId)) {
          try {
            await unlockSeat(data.movie.id, data.timeSlot, seatId);

            selectedSeatIds.delete(seatId);

            updateBookingSummary();

            renderSeatButtons(data, bookedSeats, getCurrentLockedSeats());
          } catch (error) {
            console.error("Unlock error:", error);

            showCustomPopup(
              error.message || "Unable to release this seat.",
              "error",
            );
          }

          return;
        }

        /*
         * SELECT / LOCK
         */

        try {
          /*
           * Immediately disable this
           * button to prevent double-clicks.
           */

          seatBtn.disabled = true;

          await lockSeat(data.movie.id, data.timeSlot, seatId);

          selectedSeatIds.add(seatId);

          updateBookingSummary();
        } catch (error) {
          console.error("Seat lock error:", error);

          showCustomPopup(
            error.message || `Unable to lock seat ${seatId}.`,
            "error",
          );

          renderSeatButtons(data, bookedSeats, getCurrentLockedSeats());
        }
      };

      seatGrid.appendChild(seatBtn);
    }
  });

  updateBookingSummary();
}

/* ============================================================
   LOCK A SEAT
   ============================================================ */

async function lockSeat(movieId, timeSlot, seatId) {
  if (!currentUser) {
    throw new Error("Please login to select seats.");
  }

  const lockId = createLockId(movieId, timeSlot, seatId);

  const lockRef = doc(db, "seatLocks", lockId);

  const showSeatRef = doc(db, "showSeats", `${movieId}_${timeSlot}`);

  await runTransaction(db, async (transaction) => {
    /*
     * IMPORTANT:
     * Every transaction read is done
     * BEFORE any write.
     */

    const lockSnap = await transaction.get(lockRef);

    const showSeatSnap = await transaction.get(showSeatRef);

    /*
     * Check permanent booking.
     */

    const bookedSeats = showSeatSnap.exists()
      ? showSeatSnap.data().bookedSeats || []
      : [];

    if (bookedSeats.includes(seatId)) {
      throw new Error(`Seat ${seatId} is already booked.`);
    }

    /*
     * Check existing temporary lock.
     */

    if (lockSnap.exists()) {
      const existingLock = lockSnap.data();

      const expiresAt = existingLock.expiresAt?.toMillis?.() || 0;

      /*
       * Active lock owned by another
       * user.
       */

      if (
        existingLock.status === "locked" &&
        expiresAt > Date.now() &&
        existingLock.userId !== currentUser.uid
      ) {
        throw new Error(`Seat ${seatId} is currently locked by another user.`);
>>>>>>> upstream/main
      }

      /*
       * Active lock owned by current
       * user.
       */

      if (
        existingLock.status === "locked" &&
        expiresAt > Date.now() &&
        existingLock.userId === currentUser.uid
      ) {
        /*
         * Don't reset the timer.
         */

        return;
      }
    }

    /*
     * Create a fresh 10-minute lock.
     */

    const expiresAt = Timestamp.fromMillis(Date.now() + SEAT_LOCK_DURATION);

    transaction.set(lockRef, {
      userId: currentUser.uid,

      userEmail: currentUser.email || "",

      movieId: movieId,

      timeSlot: timeSlot,

      seatId: seatId,

      status: "locked",

      expiresAt: expiresAt,

      createdAt: Timestamp.now(),
    });
  });

  return true;
}

/* ============================================================
   UNLOCK A SEAT
   ============================================================ */

async function unlockSeat(movieId, timeSlot, seatId) {
  if (!currentUser) {
    return;
  }

  const lockId = createLockId(movieId, timeSlot, seatId);

  const lockRef = doc(db, "seatLocks", lockId);

  await runTransaction(db, async (transaction) => {
    const lockSnap = await transaction.get(lockRef);

    if (!lockSnap.exists()) {
      return;
    }

    const lockData = lockSnap.data();

    /*
     * Only owner can release the
     * temporary lock.
     */

    if (lockData.userId !== currentUser.uid) {
      throw new Error("You cannot release another user's seat lock.");
    }

    transaction.delete(lockRef);
  });
}

/* ============================================================
   CREATE LOCK DOCUMENT ID
   ============================================================ */

function createLockId(movieId, timeSlot, seatId) {
  return `${movieId}_${timeSlot}_${seatId}`.replace(/[^a-zA-Z0-9_-]/g, "");
}

/* ============================================================
   BOOKING SUMMARY
   ============================================================ */

function updateBookingSummary() {
  const countEl = document.getElementById("selected-seats-count");

  const priceEl = document.getElementById("total-price");

  const paymentBtn = document.getElementById("proceed-payment-btn");

  const count = selectedSeatIds.size;

  if (countEl) {
    countEl.innerText = count;
  }

  if (priceEl) {
    priceEl.innerText = count * SEAT_PRICE;
  }

  if (paymentBtn) {
    paymentBtn.disabled = count === 0;
  }
}

/* ============================================================
   START SEAT LOCK TIMER
   ============================================================ */

function startSeatLockTimer(movieId, timeSlot) {
  if (seatLockTimer) {
    clearInterval(seatLockTimer);
  }

  seatLockTimer = setInterval(() => {
    const locks = currentViewData.activeLocks || {};

    updateSeatLockTimer(movieId, timeSlot, locks);
  }, 1000);
}

/* ============================================================
   UPDATE TIMER
   ============================================================ */

function updateSeatLockTimer(movieId, timeSlot, locks) {
  const timerContainer = document.getElementById("seat-lock-timer");

  const countdown = document.getElementById("seat-lock-countdown");

  if (!timerContainer || !countdown || !currentUser) {
    return;
  }

  let earliestExpiry = null;

  Object.values(locks || {}).forEach((lock) => {
    if (lock.userId !== currentUser.uid) {
      return;
    }

    if (!lock.expiresAt) {
      return;
    }

    if (!earliestExpiry || lock.expiresAt < earliestExpiry) {
      earliestExpiry = lock.expiresAt;
    }
  });

  /*
   * No active locks owned by current
   * user.
   */

  if (!earliestExpiry) {
    timerContainer.classList.add("hidden");

    return;
  }

  const remaining = Math.max(0, earliestExpiry - Date.now());

  const minutes = Math.floor(remaining / 60000);

  const seconds = Math.floor((remaining % 60000) / 1000);

  timerContainer.classList.remove("hidden");

  countdown.innerText = `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;

  /*
   * Lock expired.
   */

  if (remaining <= 0) {
    releaseExpiredUserLocks(movieId, timeSlot);
  }
}

/* ============================================================
   RELEASE EXPIRED LOCKS
   ============================================================ */

async function releaseExpiredUserLocks(movieId, timeSlot) {
  if (!currentUser) {
    return;
  }

  const lockQuery = query(
    collection(db, "seatLocks"),
    where("movieId", "==", movieId),
    where("timeSlot", "==", timeSlot),
    where("userId", "==", currentUser.uid),
  );

  try {
    const snapshot = await getDocs(lockQuery);

    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      const expiresAt = data.expiresAt?.toMillis?.() || 0;

      if (expiresAt <= now) {
        await deleteDoc(docSnap.ref);

        selectedSeatIds.delete(data.seatId);
      }
    }

    updateBookingSummary();
  } catch (error) {
    console.error("Expired lock cleanup error:", error);
  }
}

/* ============================================================
   CLEANUP SEAT LISTENERS
   ============================================================ */

function cleanupSeatListeners() {
  if (seatLocksUnsubscribe) {
    seatLocksUnsubscribe();

    seatLocksUnsubscribe = null;
  }

  if (bookedSeatsUnsubscribe) {
    bookedSeatsUnsubscribe();

    bookedSeatsUnsubscribe = null;
  }

  if (seatLockTimer) {
    clearInterval(seatLockTimer);

    seatLockTimer = null;
  }

  if (currentViewData) {
    currentViewData.activeLocks = {};
  }
}

/* ============================================================
   RAZORPAY PAYMENT
   ============================================================ */

window.initiateRazorpayPayment = async function (movie, timeSlot) {
  if (!currentUser) {
    openAuthModal("login");

    return;
  }

  const seatIds = Array.from(selectedSeatIds);

  if (seatIds.length === 0) {
    showCustomPopup("Please select at least one seat.", "error");

    return;
  }

  /*
   * Before opening Razorpay,
   * verify that every selected seat
   * still belongs to this user.
   */

  try {
    await verifyUserSeatLocks(movie.id, timeSlot, seatIds);
  } catch (error) {
    console.error("Seat lock verification failed:", error);

    showCustomPopup(
      error.message || "One or more selected seats are no longer available.",
      "error",
    );

    return;
  }

  const amount = seatIds.length * SEAT_PRICE * 100;

  const options = {
    key: "rzp_test_Tb3ytl5Wq7Sd9Q",

    amount: amount,

    currency: "INR",

    name: "MovieNest",

    description: "Movie Ticket Booking",

    handler: async function (response) {
      await completeBookingAfterPayment(
        movie,
        timeSlot,
        seatIds,
        amount,
        response,
      );
    },

    prefill: {
      email: currentUser.email,
    },

    theme: {
      color: "#e11d48",
    },

    modal: {
      ondismiss: function () {
        showCustomPopup(
          "Payment cancelled. Your seats remain locked until the 10-minute timer expires.",
          "info",
        );
      },
    },
  };

<<<<<<< HEAD
  const rzp = new window.Razorpay(options);
  rzp.open();
}

=======
  try {
    const rzp1 = new Razorpay(options);

    rzp1.open();
  } catch (error) {
    console.error("Razorpay error:", error);

    showCustomPopup("Unable to open payment gateway.", "error");
  }
};

/* ============================================================
   VERIFY USER SEAT LOCKS
   ============================================================ */

async function verifyUserSeatLocks(movieId, timeSlot, seatIds) {
  const now = Date.now();

  for (const seatId of seatIds) {
    const lockId = createLockId(movieId, timeSlot, seatId);

    const lockRef = doc(db, "seatLocks", lockId);

    const lockSnap = await getDoc(lockRef);

    if (!lockSnap.exists()) {
      throw new Error(`Your lock for seat ${seatId} no longer exists.`);
    }

    const lock = lockSnap.data();

    const expiresAt = lock.expiresAt?.toMillis?.() || 0;

    if (lock.userId !== currentUser.uid) {
      throw new Error(`You do not own seat ${seatId}.`);
    }

    if (lock.status !== "locked") {
      throw new Error(`Seat ${seatId} is no longer locked.`);
    }

    if (expiresAt <= now) {
      throw new Error(`Your 10-minute lock for seat ${seatId} has expired.`);
    }
  }
}

/* ============================================================
   COMPLETE BOOKING AFTER PAYMENT
   ============================================================ */

async function completeBookingAfterPayment(
  movie,
  timeSlot,
  seatIds,
  amount,
  response,
) {
  if (!currentUser) {
    showCustomPopup("Your login session has expired.", "error");

    return;
  }

  const seatDocRef = doc(db, "showSeats", `${movie.id}_${timeSlot}`);

  const lockRefs = seatIds.map((seatId) => {
    const lockId = createLockId(movie.id, timeSlot, seatId);

    return doc(db, "seatLocks", lockId);
  });

  try {
    await runTransaction(db, async (transaction) => {
      /*
       * =====================================================
       * IMPORTANT FIRESTORE TRANSACTION RULE
       *
       * ALL READS FIRST
       * ALL WRITES AFTER
       * =====================================================
       */

      const seatSnap = await transaction.get(seatDocRef);

      const lockSnapshots = [];

      for (const lockRef of lockRefs) {
        const lockSnap = await transaction.get(lockRef);

        lockSnapshots.push(lockSnap);
      }

      /*
       * Existing permanently booked seats
       */

      const currentBooked = seatSnap.exists()
        ? seatSnap.data().bookedSeats || []
        : [];

      /*
       * Check permanent booking
       */

      for (const seatId of seatIds) {
        if (currentBooked.includes(seatId)) {
          throw new Error(`Seat ${seatId} was already booked.`);
        }
      }

      /*
       * Check temporary locks
       */

      const now = Date.now();

      for (let i = 0; i < seatIds.length; i++) {
        const seatId = seatIds[i];

        const lockSnap = lockSnapshots[i];

        if (!lockSnap.exists()) {
          throw new Error(
            `Your lock for seat ${seatId} has expired or was released.`,
          );
        }

        const lock = lockSnap.data();

        const expiresAt = lock.expiresAt?.toMillis?.() || 0;

        if (lock.userId !== currentUser.uid) {
          throw new Error(`You do not own seat ${seatId}.`);
        }

        if (lock.status !== "locked") {
          throw new Error(`Seat ${seatId} is not available anymore.`);
        }

        if (expiresAt <= now) {
          throw new Error(
            `Your 10-minute lock for seat ${seatId} has expired.`,
          );
        }
      }

      /*
       * =====================================================
       * WRITE 1
       * Permanently book seats
       * =====================================================
       */

      transaction.set(
        seatDocRef,
        {
          bookedSeats: [...currentBooked, ...seatIds],
        },
        {
          merge: true,
        },
      );

      /*
       * =====================================================
       * WRITE 2
       * Delete temporary locks
       * =====================================================
       */

      for (const lockRef of lockRefs) {
        transaction.delete(lockRef);
      }
    });

    /*
     * =======================================================
     * CREATE BOOKING DOCUMENT
     * =======================================================
     */

    const bookingData = {
      userId: currentUser.uid,

      userEmail: currentUser.email,

      movieId: movie.id,

      movieTitle: movie.title,

      posterUrl: movie.posterUrl,

      timeSlot: timeSlot,

      seats: seatIds,

      amount: amount / 100,

      paymentId: response.razorpay_payment_id,

      createdAt: new Date(),
    };

    await addDoc(collection(db, "bookings"), bookingData);

    /*
     * Generate ticket
     */

    await generateTicketPDF(bookingData);

    selectedSeatIds.clear();

    showCustomPopup(
      "Payment Successful! Booking Confirmed & PDF downloading.",
      "success",
    );

    router("profile");
  } catch (error) {
    console.error("Booking completion error:", error);

    /*
     * VERY IMPORTANT:
     *
     * Payment may have succeeded at Razorpay
     * but Firestore booking may have failed.
     *
     * Therefore don't silently claim that
     * everything succeeded.
     */

    showCustomPopup(
      error.message ||
        "Payment was processed, but the booking could not be completed. Please contact support.",
      "error",
    );
  }
}

/* ============================================================
   PDF IMAGE HELPER
   ============================================================ */

>>>>>>> upstream/main
function getBase64ImageFromUrl(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();

    img.crossOrigin = "Anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = img.width;

      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/jpeg"));
    };
<<<<<<< HEAD
    img.onerror = () => resolve(null);
=======

    img.onerror = () => resolve(null);

>>>>>>> upstream/main
    img.src = imageUrl;
  });
}

<<<<<<< HEAD
=======
/* ============================================================
   GENERATE PDF TICKET
   ============================================================ */

>>>>>>> upstream/main
async function generateTicketPDF(booking) {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
<<<<<<< HEAD
  const docPdf = new jsPDF();

  docPdf.setFillColor(15, 23, 42);
  docPdf.rect(0, 0, 210, 297, "F");

  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(22);
  docPdf.text("MOVIENEST TICKET RECEIPT", 20, 25);

  docPdf.setFontSize(12);
  docPdf.setTextColor(244, 63, 94);
  docPdf.text("Confirmed Booking Pass", 20, 33);

  docPdf.setDrawColor(51, 65, 85);
  docPdf.line(20, 38, 190, 38);
=======

  const pdf = new jsPDF();

  /*
   * Background
   */

  pdf.setFillColor(15, 23, 42);

  pdf.rect(0, 0, 210, 297, "F");

  /*
   * Header
   */

  pdf.setTextColor(255, 255, 255);

  pdf.setFont("helvetica", "bold");

  pdf.setFontSize(22);

  pdf.text("MOVIE TICKET RECEIPT", 20, 25);

  pdf.setFontSize(12);

  pdf.setTextColor(244, 63, 94);

  pdf.text("Confirmed Booking Pass", 20, 33);

  pdf.setDrawColor(51, 65, 85);

  pdf.line(20, 38, 190, 38);

  /*
   * Poster
   */
>>>>>>> upstream/main

  if (booking.posterUrl) {
    const base64Img = await getBase64ImageFromUrl(booking.posterUrl);

    if (base64Img) {
<<<<<<< HEAD
      docPdf.addImage(base64Img, "JPEG", 140, 45, 50, 70);
    }
  }

  docPdf.setFontSize(16);
  docPdf.setTextColor(255, 255, 255);
  docPdf.setFont("helvetica", "bold");
  docPdf.text(`Movie: ${booking.movieTitle || "Movie"}`, 20, 52);

  docPdf.setTextColor(203, 213, 225);
  docPdf.setFont("helvetica", "normal");
  docPdf.setFontSize(11);

  let y = 65;
  docPdf.text(`User Email: ${booking.userEmail}`, 20, y);
  y += 10;
  docPdf.text(`Showtime Slot: ${booking.timeSlot}`, 20, y);
  y += 10;
  docPdf.text(`Selected Seats: ${booking.seats.join(", ")}`, 20, y);
  y += 10;
  docPdf.text(`Total Paid Amount: Rs. ${booking.amount}`, 20, y);
  y += 10;
  docPdf.text(`Razorpay Payment ID: ${booking.paymentId}`, 20, y);
  y += 10;
  docPdf.text(`Booking Date: ${new Date().toLocaleString()}`, 20, y);

  docPdf.line(20, 130, 190, 130);
  docPdf.setFontSize(10);
  docPdf.setTextColor(148, 163, 184);
  docPdf.text(
    "Please present this ticket confirmation at the counter. Enjoy your movie!",
=======
      pdf.addImage(base64Img, "JPEG", 140, 45, 50, 70);
    }
  }

  /*
   * Movie name
   */

  pdf.setFontSize(16);

  pdf.setTextColor(255, 255, 255);

  pdf.setFont("helvetica", "bold");

  pdf.text(`Movie: ${booking.movieTitle || "N/A"}`, 20, 52);

  /*
   * Booking details
   */

  pdf.setTextColor(203, 213, 225);

  pdf.setFont("helvetica", "normal");

  pdf.setFontSize(11);

  let y = 65;

  pdf.text(`User Email: ${booking.userEmail || ""}`, 20, y);

  y += 10;

  pdf.text(`Showtime Slot: ${booking.timeSlot || ""}`, 20, y);

  y += 10;

  pdf.text(`Selected Seats: ${booking.seats.join(", ")}`, 20, y);

  y += 10;

  pdf.text(`Total Paid Amount: Rs.${booking.amount}`, 20, y);

  y += 10;

  pdf.text(`Razorpay Payment ID: ${booking.paymentId || ""}`, 20, y);

  y += 10;

  pdf.text(`Booking Date: ${new Date().toLocaleString()}`, 20, y);

  pdf.line(20, 125, 190, 125);

  pdf.setFontSize(10);

  pdf.setTextColor(148, 163, 184);

  pdf.text(
    "Please present this ticket confirmation at the entrance counter. Enjoy your movie!",
>>>>>>> upstream/main
    20,
    140,
  );

<<<<<<< HEAD
  docPdf.save(`Ticket-${(booking.movieTitle || "Booking").replace(/\s+/g, "_")}.pdf`);
=======
  pdf.save(
    `Ticket-${
      booking.movieTitle ? booking.movieTitle.replace(/\s+/g, "_") : "Booking"
    }.pdf`,
  );
>>>>>>> upstream/main
}

/* ============================================================
   USER BOOKING HISTORY
   ============================================================ */

async function renderUserProfile() {
  const appView = document.getElementById("app-view");

  appView.innerHTML = `
<<<<<<< HEAD
    <h1 class="text-3xl font-extrabold mb-6">My Booking History</h1>
    <div class="space-y-4" id="bookings-list">
      <div class="animate-pulse bg-slate-900 h-24 rounded-xl"></div>
    </div>
  `;
=======
    <h1 class="text-3xl font-extrabold mb-6">
      My Booking History
    </h1>
>>>>>>> upstream/main

    <div
      class="space-y-4"
      id="bookings-list"
    >

      <div
        class="animate-pulse bg-slate-900 h-24 rounded-xl"
      ></div>

<<<<<<< HEAD
  querySnapshot.forEach((docSnap) => {
    const booking = docSnap.data();
    const card = document.createElement("div");
    card.className =
      "bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center";
    card.innerHTML = `
      <div>
        <p class="text-xs text-rose-500 font-bold mb-1">Booking ID: ${docSnap.id}</p>
        <h3 class="text-lg font-bold">Time Slot: ${booking.timeSlot}</h3>
        <p class="text-sm text-slate-400">Seats: ${(booking.seats || []).join(", ")}</p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold text-rose-500">₹${booking.amount || 0}</p>
        <span class="inline-block bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-1 rounded-full font-medium mt-1">Confirmed</span>
      </div>
    `;
    list.appendChild(card);
  });
}

// Modal and Auth Actions
export function switchAuthTab(mode) {
=======
    </div>
  `;

  try {
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", currentUser.uid),
    );

    const querySnapshot = await getDocs(q);

    const list = document.getElementById("bookings-list");

    list.innerHTML = "";

    if (querySnapshot.empty) {
      list.innerHTML = `
        <p class="text-slate-500">
          You haven't made any bookings yet.
        </p>
      `;

      return;
    }

    querySnapshot.forEach((docSnap) => {
      const booking = docSnap.data();

      const card = document.createElement("div");

      card.className =
        "bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center gap-4";

      card.innerHTML = `
          <div>

            <p
              class="text-xs text-rose-500 font-bold mb-1"
            >
              Booking ID:
              ${docSnap.id}
            </p>

            <h3
              class="text-lg font-bold"
            >
              ${escapeHTML(booking.movieTitle || "Movie")}
            </h3>

            <p
              class="text-sm text-slate-400"
            >
              Time Slot:
              ${escapeHTML(booking.timeSlot || "")}
            </p>

            <p
              class="text-sm text-slate-400"
            >
              Seats:
              ${escapeHTML((booking.seats || []).join(", "))}
            </p>

          </div>

          <div class="text-right">

            <p
              class="text-lg font-bold"
            >
              ₹${booking.amount}
            </p>

            <span
              class="inline-block bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-1 rounded-full font-medium mt-1"
            >
              Confirmed
            </span>

          </div>
        `;

      list.appendChild(card);
    });
  } catch (error) {
    console.error("Booking history error:", error);

    showCustomPopup("Unable to load your booking history.", "error");
  }
}

/* ============================================================
   CUSTOM POPUP
   ============================================================ */

window.showCustomPopup = function (message, type = "info") {
  const existingPopup = document.getElementById("custom-popup");

  if (existingPopup) {
    existingPopup.remove();
  }

  const popup = document.createElement("div");

  popup.id = "custom-popup";

  let icon = "";
  let iconClass = "";

  if (type === "success") {
    icon = `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      `;

    iconClass = "bg-emerald-500/20 text-emerald-400";
  } else if (type === "error") {
    icon = `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      `;

    iconClass = "bg-rose-500/20 text-rose-400";
  } else {
    icon = `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
          />
        </svg>
      `;

    iconClass = "bg-sky-500/20 text-sky-400";
  }

  popup.innerHTML = `
      <div
        class="fixed top-6 right-6 z-[9999] max-w-sm w-[calc(100%-2rem)]"
      >

        <div
          class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 flex items-start gap-3"
        >

          <div
            class="w-9 h-9 shrink-0 rounded-full ${iconClass} flex items-center justify-center"
          >
            ${icon}
          </div>

          <p
            class="text-sm text-slate-200 leading-relaxed flex-1 pt-1"
          >
            ${escapeHTML(String(message))}
          </p>

          <button
            type="button"
            onclick="document.getElementById('custom-popup')?.remove()"
            class="text-slate-500 hover:text-white text-xl leading-none transition"
            aria-label="Close"
          >
            &times;
          </button>

        </div>

      </div>
    `;

  document.body.appendChild(popup);

  setTimeout(() => {
    const currentPopup = document.getElementById("custom-popup");

    if (currentPopup) {
      currentPopup.remove();
    }
  }, 4000);
};

/* ============================================================
   AUTH TAB SWITCHER
   ============================================================ */

window.switchAuthTab = function (mode) {
>>>>>>> upstream/main
  currentAuthMode = mode;

  const tabLogin = document.getElementById("tab-login");

  const tabSignup = document.getElementById("tab-signup");

  const title = document.getElementById("auth-modal-title");

  const submitBtn = document.getElementById("auth-submit-btn");

  const extraFields = document.getElementById("signup-extra-fields");

  if (mode === "login") {
    tabLogin.className =
      "flex-1 pb-3 text-center font-bold text-rose-500 border-b-2 border-rose-500 transition";

    tabSignup.className =
      "flex-1 pb-3 text-center font-bold text-slate-400 border-b-2 border-transparent transition";

    title.innerText = "Welcome Back";

    submitBtn.innerText = "Sign In";

    extraFields.classList.add("hidden");

    document.getElementById("auth-name").removeAttribute("required");
  } else {
    tabSignup.className =
      "flex-1 pb-3 text-center font-bold text-rose-500 border-b-2 border-rose-500 transition";

    tabLogin.className =
      "flex-1 pb-3 text-center font-bold text-slate-400 border-b-2 border-transparent transition";

    title.innerText = "Create New Account";

    submitBtn.innerText = "Register & Sign Up";

    extraFields.classList.remove("hidden");

    document.getElementById("auth-name").setAttribute("required", "true");
  }
}

<<<<<<< HEAD
export function openAuthModal(mode = "login") {
=======
/* ============================================================
   OPEN AUTH MODAL
   ============================================================ */

window.openAuthModal = function (mode = "login") {
>>>>>>> upstream/main
  switchAuthTab(mode);

  document.getElementById("auth-modal").classList.remove("hidden");
}

<<<<<<< HEAD
export function closeAuthModal() {
=======
/* ============================================================
   CLOSE AUTH MODAL
   ============================================================ */

window.closeAuthModal = function () {
>>>>>>> upstream/main
  document.getElementById("auth-modal").classList.add("hidden");
}

<<<<<<< HEAD
export async function handleAuthSubmit(e) {
=======
/* ============================================================
   AUTH SUBMIT
   ============================================================ */

window.handleAuthSubmit = async function (e) {
>>>>>>> upstream/main
  e.preventDefault();

  const email = document.getElementById("auth-email").value;

  const password = document.getElementById("auth-password").value;

  if (currentAuthMode === "login") {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      closeAuthModal();
    } catch (err) {
<<<<<<< HEAD
      alert("Login Failed: " + (err.message || "Invalid credentials"));
=======
      console.error("Login Error:", err.code);

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        showCustomPopup(
          "Invalid email or password. Please verify your credentials or create a new account.",
          "error",
        );
      } else {
        showCustomPopup("Login Failed: " + err.message, "error");
      }
>>>>>>> upstream/main
    }
  } else {
    const name = document.getElementById("auth-name").value;

    const phone = document.getElementById("auth-phone").value;

    try {
<<<<<<< HEAD
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
=======
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

>>>>>>> upstream/main
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,

        name: name,

        email: email,

        phone: phone || "",

        createdAt: new Date(),
      });

      showCustomPopup("Account created successfully!", "success");

      closeAuthModal();
    } catch (createErr) {
<<<<<<< HEAD
      alert("Registration Failed: " + createErr.message);
=======
      console.error("Signup Error:", createErr.code);

      if (createErr.code === "auth/email-already-in-use") {
        showCustomPopup(
          "This email is already registered. Please switch to the Sign In tab.",
          "error",
        );
      } else {
        showCustomPopup("Registration Failed: " + createErr.message, "error");
      }
>>>>>>> upstream/main
    }
  }
}

<<<<<<< HEAD
export function handleLogout() {
=======
/* ============================================================
   LOGOUT
   ============================================================ */

window.handleLogout = function () {
  cleanupSeatListeners();

  selectedSeatIds.clear();

>>>>>>> upstream/main
  signOut(auth);
}

<<<<<<< HEAD
export async function handleGoogleSignIn() {
=======
/* ============================================================
   GOOGLE SIGN IN
   ============================================================ */

window.handleGoogleSignIn = async function () {
>>>>>>> upstream/main
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    const userDocRef = doc(db, "users", user.uid);

    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,

        name: user.displayName || "Google User",

        email: user.email,

        phone: user.phoneNumber || "",

        createdAt: new Date(),
      });
    }

    closeAuthModal();
  } catch (err) {
<<<<<<< HEAD
    alert("Google Sign-In Failed: " + err.message);
=======
    console.error("Google Sign-In Error:", err);

    showCustomPopup("Google Sign-In Failed: " + err.message, "error");
>>>>>>> upstream/main
  }
}

<<<<<<< HEAD
export function toggleTheme() {
=======
/* ============================================================
   THEME SWITCHER
   ============================================================ */

window.toggleTheme = function () {
>>>>>>> upstream/main
  const body = document.body;

  const btn = document.getElementById("theme-toggle-btn");
  body.classList.toggle("light-theme");

  const isLight = body.classList.contains("light-theme");
<<<<<<< HEAD
=======

>>>>>>> upstream/main
  localStorage.setItem("app-theme", isLight ? "light" : "dark");
  if (btn) btn.innerText = isLight ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Global window bindings for HTML event attributes
window.router = router;
window.proceedToSeats = proceedToSeats;
window.initiateRazorpayPayment = initiateRazorpayPayment;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleAuthSubmit = handleAuthSubmit;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleLogout = handleLogout;
window.toggleTheme = toggleTheme;

<<<<<<< HEAD
// Init listeners & theme
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavAuthUI();
});

// Auto-run home route on page load
document.addEventListener("DOMContentLoaded", () => {
=======
/* ============================================================
   INITIALIZE THEME
   ============================================================ */

(function initTheme() {
>>>>>>> upstream/main
  const savedTheme = localStorage.getItem("app-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-theme");

    const btn = document.getElementById("theme-toggle-btn");

    if (btn) {
      btn.innerText = "☀️ Light Mode";
    }
  }
<<<<<<< HEAD
  router("home");
});
=======
})();

/* ============================================================
   PASSWORD SHOW / HIDE
   ============================================================ */

function initPasswordToggle() {
  const passwordInput = document.getElementById("auth-password");

  const togglePassword = document.getElementById("toggle-password");

  const eyeOpen = document.getElementById("eye-open");

  const eyeClosed = document.getElementById("eye-closed");

  if (!passwordInput || !togglePassword) {
    return;
  }

  /*
   * Prevent duplicate listeners
   */

  if (togglePassword.dataset.initialized === "true") {
    return;
  }

  togglePassword.dataset.initialized = "true";

  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    if (eyeOpen) {
      eyeOpen.classList.toggle("hidden", !isPassword);
    }

    if (eyeClosed) {
      eyeClosed.classList.toggle("hidden", isPassword);
    }

    togglePassword.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
  });
}

/*
 * Because auth HTML is already present
 * when app.js loads in your index.html,
 * initialize it now.
 */

initPasswordToggle();

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

window.openForgotPassword = async function () {
  const emailInput = document.getElementById("auth-email");

  const email = emailInput.value.trim();

  if (!email) {
    showCustomPopup("Please enter your email address first.", "error");

    emailInput.focus();

    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);

    showCustomPopup(
      "Password reset email sent successfully. Please check your inbox.",
      "success",
    );
  } catch (error) {
    console.error("Password reset error:", error);

    showCustomPopup(
      error.message || "Failed to send password reset email.",
      "error",
    );
  }
};

/* ============================================================
   HTML ESCAPE HELPER
   ============================================================ */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
>>>>>>> upstream/main
