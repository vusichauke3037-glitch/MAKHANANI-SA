// shared.js — MAKHANANI ACADEMY — Shared Data + Functions
const SCHOOL_NAME = "Makhanani Academy";
const SCHOOL_WHATSAPP = "27780233263";

// --- DATA (shared across all pages) ---
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

function saveAll(){
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

// --- BEEP ---
function beep(){ try{ let c=new (window.AudioContext||window.webkitAudioContext)(); let o=c.createOscillator(),g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=880; o.type='sine'; g.gain.setValueAtTime(0.3,c.currentTime); o.start(); o.stop(c.currentTime+0.15);}catch(e){} }

// --- BOOK NO: MA + 6 digits, NO DUPLICATE, 1 Book = 1 Barcode ---
function getAllBookNos(){ let s=new Set(); ltsm.forEach(it=>(it.copies||[]).forEach(c=>s.add(c.bookNo.toUpperCase()))); return s; }
function getNextUniqueBookNo(){ let ex=getAllBookNos(); let max=0; ex.forEach(b=>{let m=b.match(/(\d+)$/); if(m) max=Math.max(max,parseInt(m[1]));}); let n=max+1, cand="MA"+String(n).padStart(6,'0'); while(ex.has(cand)){ n++; cand="MA"+String(n).padStart(6,'0'); } return cand; }

// --- LEARNER ID: Grade + Class + 3 digits, NO DUPLICATE, 1 Learner = 1 Barcode ---
function getAllLearnerIDs(){ let s=new Set(); users.forEach(u=>{ if(u.sid) s.add(u.sid.toUpperCase().trim()); }); return s; }
function parseGradeClass(g,c){ let m=(g||'').toString().match(/(\d+)\s*([A-Z])?/i); let gn=m?m[1]:"10"; let cl=(m&&m[2])?m[2].toUpperCase():(c||'A').toString().charAt(0).toUpperCase(); return {gradeNum:gn, classLetter:cl}; }
function getNextUniqueLearnerID(g,c){ let {gradeNum,classLetter}=parseGradeClass(g,c); let ex=getAllLearnerIDs(); let seq=1, cand=gradeNum+classLetter+String(seq).padStart(3,'0'); while(ex.has(cand)){ seq++; cand=gradeNum+classLetter+String(seq).padStart(3,'0'); } return cand; }

// --- HELPERS ---
function getAvailable(it){ return (it.copies||[]).filter(c=>c.status==='Available').length; }
function getAttPct(uid){ let t=0,p=0; Object.values(attendance).forEach(d=>{ if(d[uid]){ t++; if(d[uid].status==='Present'||d[uid].status==='Late') p++; }}); return t?Math.round(p/t*100):100; }
function getAvgMark(uid){ let m=marks.filter(x=>x.studentId===uid); return m.length?Math.round(m.reduce((s,x)=>s+x.mark,0)/m.length):null; }
function getFeeStatus(f){ return f.paid>=f.total?'Paid':f.paid>0?'Partial':'Unpaid'; }
function getStudentFeeBalance(uid){ return fees.filter(f=>f.studentId===uid).reduce((s,f)=>s+(f.total-f.paid),0); }
function cleanPhone(p){ if(!p) return null; let x=p.replace(/\D/g,''); if(x.startsWith('0')) x='27'+x.slice(1); return x; }

// --- SHARED NAV (paste on every page) ---
function renderNav(active){
  let links = [
    ['index.html','📊 Dashboard'],
    ['learners.html','👥 Learners'],
    ['stock.html','📚 Stock / LTSM'],
    ['attendance.html','✅ Attendance'],
    ['marks.html','🏆 Marks'],
    ['fees.html','💰 Fees'],
    ['timetable.html','📅 Timetable'],
    ['parent.html','❤️ Parent'],
    ['import.html','📥 Bulk Upload'],
    ['settings.html','⚙️ Settings']
  ];
  return `<nav class="flex gap-2 overflow-x-auto mb-4">` + links.map(([href,label])=>`<a href="${href}" class="${href===active?'bg-blue-900 text-white':'bg-white'} px-4 py-2 rounded-full text-sm shadow whitespace-nowrap">${label}</a>`).join('') + `</nav>`;
}
