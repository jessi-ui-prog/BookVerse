
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Reemplaza estos valores con los de Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyArB4ygMBFW-q2qQ0Uid327jYFv8mIL6Gs",
  authDomain: "bookverse-3fdca.firebaseapp.com",
  databaseURL: "https://bookverse-3fdca-default-rtdb.firebaseio.com",
  projectId: "bookverse-3fdca",
  storageBucket: "bookverse-3fdca.firebasestorage.app",
  messagingSenderId: "958988730381",
  appId: "1:958988730381:web:8b1611eb391c78bc861544",
  measurementId: "G-XDFFJ7MWD0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
