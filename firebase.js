// firebase.js — MAKHANANI-LTSM • Wordsworth High School • A Product of Xintimani Group Holdings (PTY) LTD
// Firebase Project: makhanani-ltsm

const firebaseConfig = {
  apiKey: "AIzaSyDPcF5zaCD6Mp9TfpiMPoc3xG0qSPwO7oA",
  authDomain: "makhanani-ltsm.firebaseapp.com",
  databaseURL: "https://makhanani-ltsm-default-rtdb.firebaseio.com",
  projectId: "makhanani-ltsm",
  storageBucket: "makhanani-ltsm.firebasestorage.app",
  messagingSenderId: "247180363183",
  appId: "1:247180363183:web:4e5a399d4e306192e01b5a",
  measurementId: "G-PEST1XFCR8"
};

// Will be set by shared.js
let firebaseApp = null;
let firebaseDB = null;
let firebaseReady = false;

function initFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.log('Firebase SDK not loaded yet');
      return false;
    }
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.app();
    }
    firebaseDB = firebase.database();
    firebaseReady = true;
    console.log('✅ Firebase Connected: makhanani-ltsm');
    updateFirebaseBadge();
    return true;
  } catch (e) {
    console.log('Firebase init failed:', e.message);
    return false;
  }
}

function updateFirebaseBadge() {
  let els = document.querySelectorAll('.firebase-badge');
  els.forEach(el => {
    el.innerHTML = firebaseReady
      ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">🔥 LIVE • Firebase Connected</span>`
      : `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">● Offline Mode</span>`;
  });
}

// Push all local data to Firebase
function pushToFirebase() {
  if (!firebaseReady || !firebaseDB) return;
  const data = {
    users, departments, ltsm, issues, attendance, marks, timetable, fees, payments,
    parentLinks, requests, suppliers, purchaseOrders, budgets,
    school: "Wordsworth High School",
    product: "MAKHANANI-LTSM",
    company: "Xintimani Group Holdings (PTY) LTD",
    companyReg: "2026 / 934898 / 07",
    updatedAt: new Date().toISOString()
  };
  firebaseDB.ref('makhanani-ltsm').set(data).catch(e => console.log('Push failed:', e.message));
}

// Listen for live changes from other devices
function listenToFirebase() {
  if (!firebaseReady || !firebaseDB) return;
  firebaseDB.ref('makhanani-ltsm').on('value', (snapshot) => {
    let d = snapshot.val();
    if (!d) {
      // First time — push local data up
      pushToFirebase();
      return;
    }
    // Don't overwrite if data is same timestamp (avoid loop)
    if (d.users) users = d.users;
    if (d.departments) departments = d.departments;
    if (d.ltsm) ltsm = d.ltsm;
    if (d.issues) issues = d.issues;
    if (d.attendance) attendance = d.attendance;
    if (d.marks) marks = d.marks;
    if (d.timetable) timetable = d.timetable;
    if (d.fees) fees = d.fees;
    if (d.payments) payments = d.payments;
    if (d.parentLinks) parentLinks = d.parentLinks;
    if (d.requests) requests = d.requests;
    if (d.suppliers) suppliers = d.suppliers;
    if (d.purchaseOrders) purchaseOrders = d.purchaseOrders;
    if (d.budgets) budgets = d.budgets;
    // Save locally too
    if (typeof saveAllLocalOnly === 'function') saveAllLocalOnly();
    // Re-render if page has render function
    if (typeof window.onFirebaseUpdate === 'function') window.onFirebaseUpdate();
  });
}
