import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const API_BASE_URL = window.MOVIENEST_API_URL || "http://127.0.0.1:8000";

let currentUser = null;
let currentViewData = {};
let currentAuthMode = "login";

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
      </div>
    `;
  }
}

// Router Handler
export async function router(view, data = null) {
  // Protected views
  if (!currentUser && (view === "profile" || view === "seats")) {
    openAuthModal("login");
    return;
  }

  const appView = document.getElementById("app-view");
  if (!appView) return;
  currentViewData = data;

  if (view === "home") {
    appView.innerHTML = `<div class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto"></div></div>`;
    const movies = await fetchMovies();
    renderHome(movies);
  } else if (view === "details") {
    renderMovieDetails(data);
  } else if (view === "seats") {
    renderSeatSelection(data);
  } else if (view === "profile") {
    renderUserProfile();
  }
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
}

function renderHome(movies) {
  const appView = document.getElementById("app-view");
  appView.innerHTML = `
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold mb-2">Now Showing</h1>
      <p class="text-slate-400">Book tickets for the latest blockbuster movies.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="movies-grid">
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
      "movie-card bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition cursor-pointer flex flex-col";
    card.onclick = () => router("details", movie);
    card.innerHTML = `
      <img src="${movie.posterUrl}" alt="${movie.title}" class="w-full h-80 object-cover">
      <div class="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 class="font-bold text-lg mb-1">${movie.title}</h3>
          <p class="text-sm text-slate-400">${movie.genre}</p>
        </div>
        <button class="mt-4 w-full bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white py-2 rounded-lg font-medium transition text-sm">Book Tickets</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderMovieDetails(movie) {
  if (!movie) return router("home");
  const appView = document.getElementById("app-view");
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
  if (!currentUser) {
    openAuthModal("login");
    return;
  }
  const movie = typeof movieEncoded === "string" ? JSON.parse(decodeURIComponent(movieEncoded)) : movieEncoded;
  router("seats", { movie, timeSlot });
}

function renderSeatSelection(data) {
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

    rows.forEach((row) => {
      for (let i = 1; i <= 6; i++) {
        const seatId = `${row}${i}`;
        const isBooked = bookedSeats.includes(seatId);
        const seatBtn = document.createElement("button");

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
          };
        }
        seatGrid.appendChild(seatBtn);
      }
    });
    updateBookingSummary();
  });
}

function updateBookingSummary() {
  const selected = document.querySelectorAll(".selected-seat");
  const countEl = document.getElementById("selected-seats-count");
  const priceEl = document.getElementById("total-price");

  if (countEl) countEl.innerText = selected.length;
  if (priceEl) priceEl.innerText = selected.length * 200;
}

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
      }
    },
    prefill: { email: currentUser.email },
    theme: { color: "#e11d48" },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}

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
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

async function generateTicketPDF(booking) {
  if (!window.jspdf) return;
  const { jsPDF } = window.jspdf;
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

  if (booking.posterUrl) {
    const base64Img = await getBase64ImageFromUrl(booking.posterUrl);
    if (base64Img) {
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
    20,
    140,
  );

  docPdf.save(`Ticket-${(booking.movieTitle || "Booking").replace(/\s+/g, "_")}.pdf`);
}

async function renderUserProfile() {
  const appView = document.getElementById("app-view");
  appView.innerHTML = `
    <h1 class="text-3xl font-extrabold mb-6">My Booking History</h1>
    <div class="space-y-4" id="bookings-list">
      <div class="animate-pulse bg-slate-900 h-24 rounded-xl"></div>
    </div>
  `;

  const q = query(
    collection(db, "bookings"),
    where("userId", "==", currentUser.uid),
  );
  const querySnapshot = await getDocs(q);
  const list = document.getElementById("bookings-list");
  list.innerHTML = "";

  if (querySnapshot.empty) {
    list.innerHTML = `<p class="text-slate-500">You haven't made any bookings yet.</p>`;
    return;
  }

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

export function openAuthModal(mode = "login") {
  switchAuthTab(mode);
  document.getElementById("auth-modal").classList.remove("hidden");
}

export function closeAuthModal() {
  document.getElementById("auth-modal").classList.add("hidden");
}

export async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  if (currentAuthMode === "login") {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    } catch (err) {
      alert("Login Failed: " + (err.message || "Invalid credentials"));
    }
  } else {
    const name = document.getElementById("auth-name").value;
    const phone = document.getElementById("auth-phone").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        phone: phone || "",
        createdAt: new Date(),
      });

      alert("Account created successfully!");
      closeAuthModal();
    } catch (createErr) {
      alert("Registration Failed: " + createErr.message);
    }
  }
}

export function handleLogout() {
  signOut(auth);
}

export async function handleGoogleSignIn() {
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
    alert("Google Sign-In Failed: " + err.message);
  }
}

export function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("theme-toggle-btn");
  body.classList.toggle("light-theme");
  const isLight = body.classList.contains("light-theme");
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

// Init listeners & theme
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  updateNavAuthUI();
});

// Auto-run home route on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("app-theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) btn.innerText = "☀️ Light Mode";
  }
  router("home");
});