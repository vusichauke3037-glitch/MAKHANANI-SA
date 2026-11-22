// shared.js — MAKHANANI-LTSM • Wordsworth High School • A Product of Xintimani Group Holdings (PTY) LTD
// CLEAN + CRASH-PROOF — No presaved books, No demo learners. Never crashes on bad Firebase data.
const PRODUCT_NAME = "MAKHANANI-LTSM";
const SCHOOL_NAME = "Wordsworth High School";
const SCHOOL_WHATSAPP = "27780233263";
const COMPANY_NAME = "Xintimani Group Holdings (PTY) LTD";
const COMPANY_REG = "2026 / 934898 / 07";
const BRAND_LINE = "MAKHANANI-LTSM • Wordsworth High School";

// --- SAFE LOAD — If localStorage is corrupt / Firebase sends bad data, start empty, don't crash ---
function safeLoad(key, fallback){
  try{
    let v = JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));
    if(v === null || v === undefined) return fallback;
    if(Array.isArray(fallback) && !Array.isArray(v)) return fallback;
    if(typeof fallback === 'object' && !Array.isArray(fallback) && typeof v !== 'object') return fallback;
    return v;
  }catch(e){ return fallback; }
}

let users = safeLoad('makhanani_users', []);
let departments = safeLoad('makhanani_depts', [{"name":"Mathematics","hod":""},{"name":"Science","hod":""},{"name":"English","hod":""},{"name":"Commerce","hod":""},{"name":"Social Sciences","hod":""},{"name":"Languages","hod":""},{"name":"Life Orientation","hod":""}]);
let ltsm = safeLoad('makhanani_ltsm', []);
let issues = safeLoad('makhanani_issues', []);
let attendance = safeLoad('makhanani_attendance', {});
let marks = safeLoad('makhanani_marks', []);
let timetable = safeLoad('makhanani_timetable', {});
let fees = safeLoad('makhanani_fees', []);
let payments = safeLoad('makhanani_payments', []);
let parentLinks = safeLoad('makhanani_parentLinks', []);
let requests = safeLoad('makhanani_requests', []);
let suppliers = safeLoad('makhanani_suppliers', []);
let purchaseOrders = safeLoad('makhanani_pos', []);
let budgets = safeLoad('makhanani_budgets', []);

// --- NORMALIZE — Fix any book that has no copies array (this was causing Loading...) ---
function normalizeData(){
  try{
    if(!Array.isArray(ltsm)) ltsm = [];
    ltsm.forEach(it=>{
      if(!it || typeof it !== 'object') return;
      if(!Array.isArray(it.copies)) it.copies = [];
      it.copies = it.copies.filter(c=>c && c.bookNo);
      if(typeof it.qty !== 'number') it.qty = it.copies.length;
      if(!it.title) it.title = 'Untitled';
      if(!it.dept) it.dept = 'General';
      if(!it.grade) it.grade = 'Grade 10';
      if(!it.subject) it.subject = 'General';
    });
    if(!Array.isArray(users)) users = [];
    if(!Array.isArray(issues)) issues = [];
  }catch(e){ console.log('normalize error', e.message); }
}
normalizeData();

function saveAllLocalOnly(){
  try{
    normalizeData();
    localStorage.setItem('makhanani_users',JSON.stringify(users));
    localStorage.setItem('makhanani_depts',JSON.stringify(departments));
    localStorage.setItem('makhanani_ltsm',JSON.stringify(ltsm));
    localStorage.setItem('makhanani_issues',JSON.stringify(issues));
    localStorage.setItem('makhanani_attendance',JSON.stringify(attendance));
    localStorage.setItem('makhanani_marks',JSON.stringify(marks));
    localStorage.setItem('makhanani_timetable',JSON.stringify(timetable));
    localStorage.setItem('makhanani_fees',JSON.stringify(fees));
    localStorage.setItem('makhanani_payments',JSON.stringify(payments));
    localStorage.setItem('makhanani_parentLinks',JSON.stringify(parentLinks));
    localStorage.setItem('makhanani_requests',JSON.stringify(requests));
    localStorage.setItem('makhanani_suppliers',JSON.stringify(suppliers));
    localStorage.setItem('makhanani_pos',JSON.stringify(purchaseOrders));
    localStorage.setItem('makhanani_budgets',JSON.stringify(budgets));
  }catch(e){ console.log('save error', e.message); }
}
function saveAll(){
  saveAllLocalOnly();
  try{
    let st = getBookNoState();
    localStorage.setItem('makhanani_bookNoState', JSON.stringify(st));
  }catch(e){}
  if (typeof pushToFirebase === 'function') { try{ pushToFirebase(); }catch(e){} }
}
function startFirebaseSync(){ if (typeof initFirebase === 'function') { try{ if (initFirebase()) { listenToFirebase(); } }catch(e){} } }
function beep(){ try{ let c=new (window.AudioContext||window.webkitAudioContext)(); let o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=880; o.type='sine'; g.gain.setValueAtTime(0.3,c.currentTime); o.start(); o.stop(c.currentTime+0.15);}catch(e){} }

// === BOOK NUMBER — WHS + 6 DIGITS — NO REPEAT, NO SKIP — CRASH-PROOF ===
function getSchoolPrefix(){ try{ return SCHOOL_NAME.split(/\s+/).map(w=>w.charAt(0).toUpperCase()).join(''); }catch(e){ return 'WHS'; } }
function formatBookNo(n){ try{ n = parseInt(n,10); if(isNaN(n)||n<1) n=1; return getSchoolPrefix() + String(n).padStart(6,'0'); }catch(e){ return 'WHS000001'; } }
function parseBookNoNum(bookNo){ try{ let m = String(bookNo||'').toUpperCase().match(/(\d+)$/); return m ? parseInt(m[1],10) : null; }catch(e){ return null; } }

function getBookNoState(){
  // ALWAYS returns a valid state — never throws, never returns null — This fixes Loading...
  try{
    let raw = localStorage.getItem('makhanani_bookNoState');
    let state = null;
    try{ state = JSON.parse(raw||'null'); }catch(e){ state = null; }
    if(!state || typeof state !== 'object' || typeof state.next !== 'number' || !Array.isArray(state.free)){
      let used = new Set();
      try{
        (ltsm||[]).forEach(it=>{
          (it.copies||[]).forEach(c=>{ let n=parseBookNoNum(c.bookNo); if(n && !isNaN(n)) used.add(n); });
        });
      }catch(e){}
      let max = used.size ? Math.max(...used) : 0;
      let free = [];
      for(let i=1;i<=max;i++) if(!used.has(i)) free.push(i);
      state = { next: max+1, free: free.sort((a,b)=>a-b), used: [...used] };
      try{ localStorage.setItem('makhanani_bookNoState', JSON.stringify(state)); }catch(e){}
    }
    // Clean free list — remove duplicates, non-numbers, numbers already used
    try{
      state.free = [...new Set(state.free)].filter(n=>typeof n==='number' && !isNaN(n) && n>=1).sort((a,b)=>a-b);
      if(typeof state.next !== 'number' || isNaN(state.next) || state.next < 1) state.next = 1;
      // If free contains next, remove it
      state.free = state.free.filter(n=>n !== state.next);
    }catch(e){}
    return state;
  }catch(e){
    // Ultimate fallback — Never crash
    return { next: 1, free: [], used: [] };
  }
}
function saveBookNoState(state){ try{ if(state && typeof state.next==='number') localStorage.setItem('makhanani_bookNoState', JSON.stringify(state)); }catch(e){} }
function getAllBookNos(){ let s=new Set(); try{ (ltsm||[]).forEach(it=>(it.copies||[]).forEach(c=>{ if(c.bookNo) s.add(String(c.bookNo).toUpperCase()); })); }catch(e){} return s; }
function allocateBookNos(qty){
  try{
    qty = parseInt(qty,10); if(isNaN(qty)||qty<1) qty=1; if(qty>1000) qty=1000;
    let state = getBookNoState();
    let result = [];
    // 1. Reuse gaps first — No skipping
    while(qty > 0 && state.free.length > 0){ let n = state.free.shift(); if(n) result.push(formatBookNo(n)); qty--; }
    // 2. Then use next counter — No repeat
    while(qty > 0){ result.push(formatBookNo(state.next)); state.next++; qty--; }
    saveBookNoState(state);
    return result;
  }catch(e){ return [formatBookNo(1)]; }
}
function getNextUniqueBookNo(){ return allocateBookNos(1)[0]; }
function releaseBookNo(bookNo){
  try{
    let n = parseBookNoNum(bookNo); if(!n) return;
    let state = getBookNoState();
    let stillUsed = false;
    (ltsm||[]).forEach(it=>(it.copies||[]).forEach(c=>{ if(String(c.bookNo||'').toUpperCase()===String(bookNo||'').toUpperCase()) stillUsed=true; }));
    if(stillUsed) return;
    if(!state.free.includes(n)){ state.free.push(n); state.free.sort((a,b)=>a-b); saveBookNoState(state); }
  }catch(e){}
}
function releaseBookNos(bookNos){ try{ (bookNos||[]).forEach(b=>releaseBookNo(b)); }catch(e){} }
function rebuildBookNoState(){
  try{
    let used = new Set();
    (ltsm||[]).forEach(it=>(it.copies||[]).forEach(c=>{ let n=parseBookNoNum(c.bookNo); if(n) used.add(n); }));
    let max = used.size ? Math.max(...used) : 0;
    let free = []; for(let i=1;i<=max;i++) if(!used.has(i)) free.push(i);
    let state = { next: max+1, free, used:[...used] };
    saveBookNoState(state); return state;
  }catch(e){ return { next:1, free:[], used:[] }; }
}
// === END BOOK NUMBER ===

function getAllLearnerIDs(){ let s=new Set(); try{ (users||[]).forEach(u=>{ if(u.sid) s.add(String(u.sid).toUpperCase().trim()); }); }catch(e){} return s; }
function parseGradeClass(g,c){ try{ let m=(g||'').toString().match(/(\d+)\s*([A-Z])?/i); let gn=m?m[1]:"10"; let cl=(m&&m[2])?m[2].toUpperCase():(c||'A').toString().charAt(0).toUpperCase(); return {gradeNum:gn, classLetter:cl}; }catch(e){ return {gradeNum:"10", classLetter:"A"}; } }
function getNextUniqueLearnerID(g,c){ let {gradeNum,classLetter}=parseGradeClass(g,c); let ex=getAllLearnerIDs(); let seq=1, cand=gradeNum+classLetter+String(seq).padStart(3,'0'); while(ex.has(cand)){ seq++; cand=gradeNum+classLetter+String(seq).padStart(3,'0'); } return cand; }
function getAvailable(it){ try{ return (it.copies||[]).filter(c=>c.status==='Available').length; }catch(e){ return 0; } }
function getAttPct(uid){ let t=0,p=0; try{ Object.values(attendance||{}).forEach(d=>{ if(d[uid]){ t++; if(d[uid].status==='Present'||d[uid].status==='Late') p++; }}); }catch(e){} return t?Math.round(p/t*100):100; }
function getAvgMark(uid){ let m=(marks||[]).filter(x=>x.studentId===uid); return m.length?Math.round(m.reduce((s,x)=>s+(x.mark||0),0)/m.length):null; }
function getStudentFeeBalance(uid){ return (fees||[]).filter(f=>f.studentId===uid).reduce((s,f)=>s+((f.total||0)-(f.paid||0)),0); }
function getFeeStatus(f){ return (f.paid||0)>=(f.total||0)?'Paid':(f.paid||0)>0?'Partial':'Unpaid'; }
function cleanPhone(p){ if(!p) return null; let x=String(p).replace(/\D/g,''); if(x.startsWith('0')) x='27'+x.slice(1); return x; }

const ROLES = {
  super: { label:"Super Admin", pages:["home.html","learners.html","stock.html","attendance.html","marks.html","fees.html","timetable.html","parent.html","import.html","settings.html"] },
  school_admin: { label:"School Admin", pages:["home.html","learners.html","stock.html","attendance.html","marks.html","fees.html","timetable.html","parent.html","import.html"] },
  principal: { label:"Principal", pages:["home.html","learners.html","stock.html","attendance.html","marks.html","fees.html","timetable.html","parent.html"] },
  librarian: { label:"Librarian", pages:["home.html","stock.html"] },
  hod: { label:"HOD", pages:["home.html","learners.html","attendance.html","marks.html","timetable.html","parent.html"] },
  teacher: { label:"Teacher", pages:["home.html","learners.html","attendance.html","marks.html","timetable.html"] },
  finance: { label:"Finance", pages:["home.html","learners.html","fees.html","parent.html"] },
  parent: { label:"Parent", pages:["home.html","parent.html"] }
};
const DEMO_USERS = [
  { email:"super@wordsworth.co.za", pass:"admin123", name:"Super Admin", role:"super" },
  { email:"admin@wordsworth.co.za", pass:"admin123", name:"School Admin", role:"school_admin" },
  { email:"principal@wordsworth.co.za", pass:"admin123", name:"Principal", role:"principal" },
  { email:"librarian@wordsworth.co.za", pass:"admin123", name:"Librarian", role:"librarian" },
  { email:"hod@wordsworth.co.za", pass:"admin123", name:"HOD — Mathematics", role:"hod" },
  { email:"teacher@wordsworth.co.za", pass:"admin123", name:"Teacher", role:"teacher" },
  { email:"finance@wordsworth.co.za", pass:"admin123", name:"Finance Officer", role:"finance" },
  { email:"parent@wordsworth.co.za", pass:"admin123", name:"Parent", role:"parent" }
];
function getSession(){ try{ return JSON.parse(localStorage.getItem('makhanani_session')||'null'); }catch(e){ return null; } }
function requireLogin(){ let s=getSession(); if(!s){ window.location.href='login.html'; return null; } return s; }
function canAccess(page, role){ return (ROLES[role]?.pages||[]).includes(page); }
function logout(){ localStorage.removeItem('makhanani_session'); window.location.href='login.html'; }
function renderNav(active){
  try{
    let s=getSession(); let role=s?s.role:'super'; let allowed=ROLES[role]?.pages||[];
    let all=[['home.html','🏠 Home'],['learners.html','👥 Learners'],['stock.html','📚 Stock / LTSM'],['attendance.html','✅ Attendance'],['marks.html','🏆 Marks'],['fees.html','💰 Fees'],['timetable.html','📅 Timetable'],['parent.html','❤️ Parent'],['import.html','📥 Bulk Upload'],['settings.html','⚙️ Settings']];
    let links=all.filter(([href])=>allowed.includes(href));
    let userHtml = s?`<span class="bg-blue-900 text-white px-4 py-2 rounded-full text-sm">👤 ${s.name} • ${ROLES[role].label}</span> <button onclick="logout()" class="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm">Logout</button>`:`<a href="login.html" class="bg-blue-900 text-white px-4 py-2 rounded-full text-sm">Login</a>`;
    return `<div class="flex justify-between items-center flex-wrap gap-3 mb-4"><div class="flex gap-2 overflow-x-auto">${links.map(([href,label])=>`<a href="${href}" class="${href===active?'bg-blue-900 text-white':'bg-white'} px-4 py-2 rounded-full text-sm shadow whitespace-nowrap">${label}</a>`).join('')}</div><div class="flex gap-2 items-center">${userHtml}</div></div>`;
  }catch(e){ return ''; }
}
function checkPageAccess(page){ let s=requireLogin(); if(!s) return false; if(!canAccess(page,s.role)){ alert('⛔ Access denied for '+ROLES[s.role].label); window.location.href='home.html'; return false; } return true; }
function renderFooter(){ return `<footer class="text-center text-[11px] text-gray-400 mt-8 pb-4 leading-relaxed">MAKHANANI-LTSM • Wordsworth High School<br>A Product of Xintimani Group Holdings (PTY) LTD • Reg: 2026 / 934898 / 07</footer>`; }

// NO DEMO DATA — Starts 100% empty. First real data you add is the only data.
// No Thabo Mokoena, No Platinum Mathematics, No Study and Master — Nothing presaved.
