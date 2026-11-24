import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
const firebaseConfig = { apiKey: "AIzaSyDPcF5zaCD6Mp9TfpiMPoc3xG0qSPwO7oA", authDomain: "makhanani-ltsm.firebaseapp.com", databaseURL: "https://makhanani-ltsm-default-rtdb.firebaseio.com", projectId: "makhanani-ltsm", storageBucket: "makhanani-ltsm.firebasestorage.app", messagingSenderId: "247180363183", appId: "1:247180363183:web:4e5a399d4e306192e01b5a", measurementId: "G-PEST1XFCR8" };
export const app = initializeApp(firebaseConfig); export const auth = getAuth(app); export const db = getFirestore(app); export const rtdb = getDatabase(app);
