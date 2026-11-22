// firebase.js — MAKHANANI-LTSM • Wordsworth High School • A Product of Xintimani Group Holdings (PTY) LTD
// Project: makhanani-ltsm • Database: https://makhanani-ltsm-default-rtdb.firebaseio.com
// Path: /makhanani-ltsm
// Stores: users, ltsm, issues, attendance, marks, fees, payments, timetable, bookNoState (WHS counter)

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAaxfA7f3Jz6kZl6Rr9L8mN7P4Q2sT1uV0w",
  authDomain: "makhanani-ltsm.firebaseapp.com",
  databaseURL: "https://makhanani-ltsm-default-rtdb.firebaseio.com",
  projectId: "makhanani-ltsm",
  storageBucket: "makhanani-ltsm.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

let firebaseApp = null;
let firebaseDB = null;
let firebaseReady = false;
let firebaseListenerAttached = false;
let lastPushTime = 0;
let isReceivingFromFirebase = false;

// --- INIT ---
function initFirebase() {
  if (firebaseReady) return true;
  try {
    if (typeof firebase === 'undefined') {
      console.log('Firebase SDK not loaded yet');
      updateFirebaseBadge(false);
      return false;
    }
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }
    firebaseDB = firebase.database();
    // Analytics (optional, ignore if fails)
    try { if (typeof firebase.analytics === 'function') firebase.analytics(); } catch(e){}
    firebaseReady = true;
    console.log('✅ Firebase Connected — makhanani-ltsm');
    updateFirebaseBadge(true);
    return true;
  } catch(e) {
    console.log('Firebase init failed:', e.message);
    updateFirebaseBadge(false);
    return false;
  }
}

// --- BADGE ---
function updateFirebaseBadge(connected){
  document.querySelectorAll('.firebase-badge').forEach(el=>{
    el.innerHTML = connected
      ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">🔥 LIVE • Firebase Connected</span>`
      : `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">● Offline • Local Only</span>`;
  });
}

// --- COLLECT ALL DATA — INCLUDING WHS BOOK NUMBER STATE ---
function collectDataForFirebase(){
  let bookState = null;
  try { bookState = JSON.parse(localStorage.getItem('makhanani_bookNoState')||'null'); } catch(e){ bookState = null; }
  return {
    users, departments, ltsm, issues, attendance, marks, timetable, fees, payments,
    parentLinks, requests, suppliers, purchaseOrders, budgets,
    bookNoState: bookState, // WHS000001 counter + free pool — Critical for No Repeat / No Skip
    school: "Wordsworth High School",
    product: "MAKHANANI-LTSM",
    company: "Xintimani Group Holdings (PTY) LTD",
    companyReg: "2026 / 934898 / 07",
    whatsapp: "078 023 3263",
    updatedAt: new Date().toISOString(),
    updatedBy: (typeof getSession === 'function' && getSession()) ? getSession().name : 'System'
  };
}

// --- PUSH — Local → Firebase ---
function pushToFirebase(){
  if (!firebaseReady || !firebaseDB) return;
  // Throttle — Max 1 push per 1 second (avoid loop)
  let now = Date.now();
  if (now - lastPushTime < 1000) {
    setTimeout(()=>pushToFirebase(), 1100);
    return;
  }
  lastPushTime = now;
  try {
    const data = collectDataForFirebase();
    firebaseDB.ref('makhanani-ltsm').set(data)
      .then(()=>{ updateFirebaseBadge(true); })
      .catch(e=>{ console.log('Push failed:', e.message); updateFirebaseBadge(false); });
  } catch(e){ console.log('Push error:', e.message); }
}

// --- PULL — Firebase → Local ---
function listenToFirebase(){
  if (!firebaseReady || !firebaseDB || firebaseListenerAttached) return;
  firebaseListenerAttached = true;
  firebaseDB.ref('makhanani-ltsm').on('value', (snapshot)=>{
    let d = snapshot.val();
    if (!d) {
      // First time — No data in Firebase yet — Push local data up
      console.log('Firebase empty — Pushing local data');
      pushToFirebase();
      return;
    }
    // Don't overwrite if we just pushed (avoid loop)
    if (Date.now() - lastPushTime < 1500) return;

    isReceivingFromFirebase = true;
    try {
      // Restore all data
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

      // Restore WHS Book Number State — CRITICAL
      if (d.bookNoState) {
        localStorage.setItem('makhanani_bookNoState', JSON.stringify(d.bookNoState));
        console.log('📦 WHS State restored — Next:', d.bookNoState.next, 'Free:', d.bookNoState.free);
      } else {
        // Old Firebase data without bookNoState — Rebuild from ltsm
        if (typeof rebuildBookNoState === 'function') rebuildBookNoState();
      }

      // Save to localStorage
      if (typeof saveAllLocalOnly === 'function') saveAllLocalOnly();

      // Re-render current page
      if (typeof window.onFirebaseUpdate === 'function') window.onFirebaseUpdate();
      if (typeof renderStock === 'function') { try{ renderStock(); }catch(e){} }
      if (typeof render === 'function') { try{ render(); }catch(e){} }

      updateFirebaseBadge(true);
    } catch(e){ console.log('Firebase pull error:', e.message); }
    isReceivingFromFirebase = false;
  }, (err)=>{
    console.log('Firebase listen error:', err.message);
    updateFirebaseBadge(false);
  });

  // Connection status
  firebaseDB.ref('.info/connected').on('value', (snap)=>{
    if (snap.val() === true) updateFirebaseBadge(true);
    else updateFirebaseBadge(false);
  });
}

// --- MANUAL FORCE SYNC ---
function forceSyncToFirebase(){
  if (!firebaseReady) initFirebase();
  pushToFirebase();
  alert('✅ Pushed to Firebase 🔥\nAll devices will update in ~2 seconds');
}
function forcePullFromFirebase(){
  if (!firebaseReady || !firebaseDB) return alert('Firebase not connected');
  firebaseDB.ref('makhanani-ltsm').once('value').then(snap=>{
    let d = snap.val();
    if (!d) return alert('Firebase is empty');
    if (d.users) users = d.users;
    if (d.ltsm) ltsm = d.ltsm;
    if (d.issues) issues = d.issues;
    if (d.bookNoState) localStorage.setItem('makhanani_bookNoState', JSON.stringify(d.bookNoState));
    if (typeof saveAllLocalOnly === 'function') saveAllLocalOnly();
    location.reload();
  });
}

// --- START — Called from each page via startFirebaseSync() ---
function startFirebaseSync(){
  if (initFirebase()) {
    listenToFirebase();
    // If Firebase is empty, push local after 1s
    setTimeout(()=>{
      if (firebaseDB) {
        firebaseDB.ref('makhanani-ltsm').once('value').then(snap=>{
          if (!snap.val()) pushToFirebase();
        }).catch(()=>{});
      }
    }, 1000);
  }
}
