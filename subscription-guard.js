// subscription-guard.js - Xintimani Group - Blocks SUSPENDED schools
// Include in EVERY dashboard: <script src="subscription-guard.js"></script>
// If school status == SUSPENDED, shows full-screen Subscription Expired block
// Super Admin impersonation BYPASSES the block (so Super Admin can still view suspended school)
(function(){
  // Don't run on login / home / superadmin pages
  let path = window.location.pathname || '';
  if(path.includes('login.html') || path.includes('index.html') || path.includes('superadmin')) return;

  function getSession(){
    try{ return JSON.parse(localStorage.getItem('makhanani_session')||'null'); }catch(e){ return null; }
  }
  function showExpired(schoolName, emis){
    // Hide page content
    document.body.innerHTML = ''
      + '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#111;padding:20px;font-family:Arial,sans-serif;">'
      + '<div style="background:white;border-radius:16px;padding:24px;max-width:480px;width:100%;text-align:center;border:4px solid #dc2626;">'
      + '<div style="font-size:48px;">⛔</div>'
      + '<h1 style="font-size:22px;font-weight:900;color:#dc2626;margin:8px 0;">SUBSCRIPTION EXPIRED</h1>'
      + '<p style="font-weight:700;">'+(schoolName||'This School')+' • EMIS '+(emis||'')+'</p>'
      + '<p style="color:#555;font-size:14px;margin:12px 0;">This school has been suspended by Xintimani Group.<br>Please contact Xintimani Group to reactivate your subscription.</p>'
      + '<div style="background:#fef3c7;border-radius:8px;padding:12px;font-size:13px;text-align:left;">'
      + '<b>What to do:</b><br>1. Contact Xintimani Group / Super Admin<br>2. Super Admin: Go to Super Admin Dashboard → Subscription Control → Activate<br>3. Then reload this page'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:16px;">'
      + '<a href="index.html" style="flex:1;background:#eab308;color:black;padding:10px;border-radius:8px;font-weight:900;text-decoration:none;">🏠 Home</a>'
      + '<a href="login.html" style="flex:1;background:black;color:white;padding:10px;border-radius:8px;font-weight:900;text-decoration:none;">🔐 Login</a>'
      + '</div>'
      + '<p style="font-size:11px;color:#888;margin-top:12px;">Xintimani Group • Makhanani LTSM • All books due 30 November</p>'
      + '</div></div>';
  }

  // Wait for DOM + session
  function check(){
    let sess = getSession();
    if(!sess || !sess.emis || sess.emis==='ALL') return; // Super Admin / no session - let dashboard handle login
    if(sess.isImpersonating) return; // Super Admin impersonating - BYPASS block so they can view / fix suspended school
    if(sess.role==='SUPER_ADMIN') return;

    // Need Firebase to check school status - load Firestore via dynamic import
    // Use the same config as other files
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js').then(async (appMod)=>{
      let firestoreMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
      let firebaseConfig = {
        apiKey: "AIzaSyDPcF5zaCD6Mp9TfpiMPoc3xG0qSPwO7oA",
        authDomain: "makhanani-ltsm.firebaseapp.com",
        databaseURL: "https://makhanani-ltsm-default-rtdb.firebaseio.com",
        projectId: "makhanani-ltsm",
        storageBucket: "makhanani-ltsm.firebasestorage.app",
        messagingSenderId: "247180363183",
        appId: "1:247180363183:web:4e5a399d4e306192e01b5a",
        measurementId: "G-PEST1XFCR8"
      };
      let app;
      try{ app = appMod.initializeApp(firebaseConfig); }catch(e){ app = appMod.getApp(); }
      let db = firestoreMod.getFirestore(app);
      try{
        let snap = await firestoreMod.getDoc(firestoreMod.doc(db,'schools', String(sess.emis)));
        if(snap.exists()){
          let data = snap.data();
          if(data.status==='SUSPENDED'){
            showExpired(data.school || sess.school, sess.emis);
          }
        }
      }catch(e){
        // If Firestore fails (offline / rules), do NOT block - let dashboard load
        console.warn('subscription-guard check failed:', e);
      }
    }).catch(()=>{});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', ()=>setTimeout(check, 500));
  } else {
    setTimeout(check, 500);
  }
  // Re-check every 60s - if Super Admin suspends while user is logged in, they get blocked
  setInterval(check, 60000);
})();
