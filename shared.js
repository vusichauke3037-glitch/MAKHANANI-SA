// shared.js — MAKHANANI-LTSM • Wordsworth High School • A Product of Xintimani Group Holdings (PTY) LTD
const PRODUCT_NAME = "MAKHANANI-LTSM";
const SCHOOL_NAME = "Wordsworth High School";
const SCHOOL_WHATSAPP = "27780233263";
const COMPANY_NAME = "Xintimani Group Holdings (PTY) LTD";
const COMPANY_REG = "2026 / 934898 / 07";
const BRAND_LINE = "MAKHANANI-LTSM • Wordsworth High School";

let users = JSON.parse(localStorage.getItem('makhanani_users')||'[]');
let departments = JSON.parse(localStorage.getItem('makhanani_depts')||'[{"name":"Mathematics","hod":"Dr. Smith"},{"name":"Science","hod":"Mrs. Naidoo"},{"name":"English","hod":"Mr. Patel"}]');
let ltsm = JSON.parse(localStorage.getItem('makhanani_ltsm')||'[]');
let issues = JSON.parse(localStorage.getItem('makhanani_issues')||'[]');
let attendance = JSON.parse(localStorage.getItem('makhanani_attendance')||'{}');
let marks = JSON.parse(localStorage.getItem('makhanani_marks')||'[]');
let timetable = JSON.parse(localStorage.getItem('makhanani_timetable')||'{}');
let fees = JSON.parse(localStorage.getItem('makhanani_fees')||'[]');
let payments = JSON.parse(localStorage.getItem('makhanani_payments')||'[]');
let parentLinks = JSON.parse(localStorage.getItem('makhanani_parentLinks')||'[]');
let requests = JSON.parse(localStorage.getItem('makhanani_requests')||'[]');
let suppliers = JSON.parse(localStorage.getItem('makhanani_suppliers')||'[]');
let purchaseOrders = JSON.parse(localStorage.getItem('makhanani_pos')||'[]');
let budgets = JSON.parse(localStorage.getItem('makhanani_budgets')||'[]');

function saveAllLocalOnly(){
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
}
function saveAll(){
  saveAllLocalOnly();
  let st = getBookNoState();
  localStorage.setItem('makhanani_bookNoState', JSON.stringify(st));
  if (typeof pushToFirebase === 'function') pushToFirebase();
}
function startFirebaseSync(){ if (typeof initFirebase === 'function') { if (initFirebase()) { listenToFirebase(); } } }
function beep(){ try{ let c=new (window.AudioContext||window.webkitAudioContext)(); let o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=880; o.type='sine'; g.gain.setValueAtTime(0.3,c.currentTime); o.start(); o.stop(c.currentTime+0.15);}catch(e){} }

// === BOOK NUMBER — WHS + 6 DIGITS — NO REPEAT, NO SKIP ===
function getSchoolPrefix(){ return SCHOOL_NAME.split(/\s+/).map(w=>w.charAt(0).toUpperCase()).join(''); }
function formatBookNo(n){ return getSchoolPrefix() + String(n).padStart(6,'0'); }
function parseBookNoNum(bookNo){ let m = String(bookNo||'').toUpperCase().match(/(\d+)$/); return m ? parseInt(m[1],10) : null; }
function getBookNoState(){
  let state = JSON.parse(localStorage.getItem('makhanani_bookNoState')||'null');
  if(!state){
    let used = new Set();
    ltsm.forEach(it=>(it.copies||[]).forEach(c=>{ let n=parseBookNoNum(c.bookNo); if(n) used.add(n); }));
    let max = used.size ? Math.max(...used) : 0;
    let free = [];
    for(let i=1;i<=max;i++) if(!used.has(i)) free.push(i);
    state = { next: max+1, free: free.sort((a,b)=>a-b), used: [...used] };
    localStorage.setItem('makhanani_bookNoState', JSON.stringify(state));
  }
  return state;
}
function saveBookNoState(state){ localStorage.setItem('makhanani_bookNoState', JSON.stringify(state)); }
function getAllBookNos(){ let s=new Set(); ltsm.forEach(it=>(it.copies||[]).forEach(c=>s.add(c.bookNo.toUpperCase()))); return s; }
function allocateBookNos(qty){
  let state = getBookNoState();
  let result = [];
  while(qty > 0 && state.free.length > 0){ let n = state.free.shift(); result.push(formatBookNo(n)); qty--; }
  while(qty > 0){ result.push(formatBookNo(state.next)); state.next++; qty--; }
  saveBookNoState(state);
  return result;
}
function getNextUniqueBookNo(){ return allocateBookNos(1)[0]; }
function releaseBookNo(bookNo){
  let n = parseBookNoNum(bookNo); if(!n) return;
  let state = getBookNoState();
  let stillUsed = false;
  ltsm.forEach(it=>(it.copies||[]).forEach(c=>{ if(c.bookNo.toUpperCase()===bookNo.toUpperCase()) stillUsed=true; }));
  if(stillUsed) return;
  if(!state.free.includes(n)){ state.free.push(n); state.free.sort((a,b)=>a-b); saveBookNoState(state); }
}
function releaseBookNos(bookNos){ bookNos.forEach(b=>releaseBookNo(b)); }
function rebuildBookNoState(){
  let used = new Set();
  ltsm.forEach(it=>(it.copies||[]).forEach(c=>{ let n=parseBookNoNum(c.bookNo); if(n) used.add(n); }));
  let max = used.size ? Math.max(...used) : 0;
  let free = []; for(let i=1;i<=max;i++) if(!used.has(i)) free.push(i);
  let state = { next: max+1, free, used:[...used] };
  saveBookNoState(state); return state;
}
// === END BOOK NUMBER ===

function getAllLearnerIDs(){ let s=new Set(); users.forEach(u=>{ if(u.sid) s.add(u.sid.toUpperCase().trim()); }); return s; }
function parseGradeClass(g,c){ let m=(g||'').toString().match(/(\d+)\s*([A-Z])?/i); let gn=m?m[1]:"10"; let cl=(m&&m[2])?m[2].toUpperCase():(c||'A').toString().charAt(0).toUpperCase(); return {gradeNum:gn, classLetter:cl}; }
function getNextUniqueLearnerID(g,c){ let {gradeNum,classLetter}=parseGradeClass(g,c); let ex=getAllLearnerIDs(); let seq=1, cand=gradeNum+classLetter+String(seq).padStart(3,'0'); while(ex.has(cand)){ seq++; cand=gradeNum+classLetter+String(seq).padStart(3,'0'); } return cand; }
function getAvailable(it){ return (it.copies||[]).filter(c=>c.status==='Available').length; }
function getAttPct(uid){ let t=0,p=0; Object.values(attendance).forEach(d=>{ if(d[uid]){ t++; if(d[uid].status==='Present'||d[uid].status==='Late') p++; }}); return t?Math.round(p/t*100):100; }
function getAvgMark(uid){ let m=marks.filter(x=>x.studentId===uid); return m.length?Math.round(m.reduce((s,x)=>s+x.mark,0)/m.length):null; }
function getStudentFeeBalance(uid){ return fees.filter(f=>f.studentId===uid).reduce((s,f)=>s+(f.total-f.paid),0); }
function getFeeStatus(f){ return f.paid>=f.total?'Paid':f.paid>0?'Partial':'Unpaid'; }
function cleanPhone(p){ if(!p) return null; let x=p.replace(/\D/g,''); if(x.startsWith('0')) x='27'+x.slice(1); return x; }

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
  { email:"parent@wordsworth.co.za", pass:"admin123", name:"Mama Mokoena (Parent)", role:"parent" }
];
function getSession(){ try{ return JSON.parse(localStorage.getItem('makhanani_session')||'null'); }catch(e){ return null; } }
function requireLogin(){ let s=getSession(); if(!s){ window.location.href='login.html'; return null; } return s; }
function canAccess(page, role){ return (ROLES[role]?.pages||[]).includes(page); }
function logout(){ localStorage.removeItem('makhanani_session'); window.location.href='login.html'; }
function renderNav(active){
  let s=getSession(); let role=s?s.role:'super'; let allowed=ROLES[role]?.pages||[];
  let all=[['home.html','🏠 Home'],['learners.html','👥 Learners'],['stock.html','📚 Stock / LTSM'],['attendance.html','✅ Attendance'],['marks.html','🏆 Marks'],['fees.html','💰 Fees'],['timetable.html','📅 Timetable'],['parent.html','❤️ Parent'],['import.html','📥 Bulk Upload'],['settings.html','⚙️ Settings']];
  let links=all.filter(([href])=>allowed.includes(href));
  let userHtml = s?`<span class="bg-blue-900 text-white px-4 py-2 rounded-full text-sm">👤 ${s.name} • ${ROLES[role].label}</span> <button onclick="logout()" class="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm">Logout</button>`:`<a href="login.html" class="bg-blue-900 text-white px-4 py-2 rounded-full text-sm">Login</a>`;
  return `<div class="flex justify-between items-center flex-wrap gap-3 mb-4"><div class="flex gap-2 overflow-x-auto">${links.map(([href,label])=>`<a href="${href}" class="${href===active?'bg-blue-900 text-white':'bg-white'} px-4 py-2 rounded-full text-sm shadow whitespace-nowrap">${label}</a>`).join('')}</div><div class="flex gap-2 items-center">${userHtml}</div></div>`;
}
function checkPageAccess(page){ let s=requireLogin(); if(!s) return false; if(!canAccess(page,s.role)){ alert('⛔ Access denied for '+ROLES[s.role].label); window.location.href='home.html'; return false; } return true; }
function renderFooter(){ return `<footer class="text-center text-[11px] text-gray-400 mt-8 pb-4 leading-relaxed">MAKHANANI-LTSM • Wordsworth High School<br>A Product of Xintimani Group Holdings (PTY) LTD • Reg: 2026 / 934898 / 07</footer>`; }
if(users.length===0){
  users=[
    {id:1,name:"Thabo Mokoena",email:"thabo@wordsworth.co.za",role:"Student",dept:"Mathematics",grade:"Grade 10",classLetter:"A",phone:"082 123 4567",sid:"10A001",status:"Active",parentEmail:"parent@wordsworth.co.za"},
    {id:2,name:"Lerato Nkosi",email:"lerato@wordsworth.co.za",role:"Student",dept:"Science",grade:"Grade 10",classLetter:"A",phone:"",sid:"10A002",status:"Active",parentEmail:""},
    {id:3,name:"James Van Wyk",email:"james@wordsworth.co.za",role:"Student",dept:"English",grade:"Grade 10",classLetter:"B",phone:"083 333 4444",sid:"10B001",status:"Active",parentEmail:""}
  ];
  ltsm=[{id:1,title:"Platinum Mathematics Grade 10",category:"Textbook",grade:"Grade 10",dept:"Mathematics",subject:"Mathematics",author:"Pearson",price:350,min:5,copies:[{bookNo:"WHS000001",status:"Issued",issuedTo:"10A001"},{bookNo:"WHS000002",status:"Available",issuedTo:null},{bookNo:"WHS000003",status:"Available",issuedTo:null}],qty:3}];
  issues=[{id:101,bookNo:"WHS000001",itemId:1,itemTitle:"Platinum Mathematics Grade 10",toId:1,toName:"Thabo Mokoena",toSID:"10A001",qty:1,issued:new Date().toISOString().slice(0,10),due:new Date(Date.now()+30*86400000).toISOString().slice(0,10),status:"Issued"}];
  marks=[{id:1,studentId:1,studentName:"Thabo Mokoena",subject:"Mathematics",assessment:"Test 1",mark:82}];
  fees=[{id:1,studentId:1,studentName:"Thabo Mokoena",type:"Tuition - Term 1",total:2500,paid:2500,due:"2026-02-28"},{id:2,studentId:2,studentName:"Lerato Nkosi",type:"Tuition - Term 1",total:2500,paid:1000,due:"2026-02-28"}];
  payments=[{id:1,feeId:1,studentName:"Thabo Mokoena",amount:2500,method:"EFT",ref:"MAK-1001",date:new Date().toISOString().slice(0,10)}];
  saveAllLocalOnly();
  localStorage.setItem('makhanani_bookNoState', JSON.stringify({next:4, free:[], used:[1,2,3]}));
}
