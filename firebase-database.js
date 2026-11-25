// firebase-data.js - Makhanani LTSM - LIVE Firebase Data for Books / Learners / Issues
// Usage: <script src="firebase-data.js"></script> then window.MakhananiDB
// Requires: firebase config already loaded? No - this file initializes Firebase itself.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, onSnapshot, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function getSession(){
  try{ return JSON.parse(localStorage.getItem('makhanani_session')||'null'); }catch(e){ return null; }
}
function getEmis(){
  let s = getSession();
  return s ? String(s.emis) : null;
}

window.MakhananiDB = {
  db, auth, getEmis, getSession,

  // ---- BOOKS ----
  async addBook(data){
    let emis = getEmis();
    return await addDoc(collection(db,'books'), {...data, emis, createdAt: new Date().toISOString(), createdBy: getSession()?.name||''});
  },
  async getBooks(){
    let emis = getEmis();
    let snap = await getDocs(query(collection(db,'books'), where('emis','==',emis)));
    return snap.docs.map(d=>({id:d.id, ...d.data()}));
  },
  listenBooks(callback){
    let emis = getEmis();
    return onSnapshot(query(collection(db,'books'), where('emis','==',emis)), (snap)=>{
      callback(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
  },
  async deleteBook(id){ await deleteDoc(doc(db,'books',id)); },

  // ---- LEARNERS ----
  async addLearner(data){
    let emis = getEmis();
    return await addDoc(collection(db,'learners'), {...data, emis, createdAt: new Date().toISOString()});
  },
  async getLearners(){
    let emis = getEmis();
    let snap = await getDocs(query(collection(db,'learners'), where('emis','==',emis)));
    return snap.docs.map(d=>({id:d.id, ...d.data()}));
  },
  listenLearners(callback){
    let emis = getEmis();
    return onSnapshot(query(collection(db,'learners'), where('emis','==',emis)), (snap)=>{
      callback(snap.docs.map(d=>({id:d.id, ...d.data()})));
    });
  },
  async deleteLearner(id){ await deleteDoc(doc(db,'learners',id)); },

  // ---- ISSUES ----
  async addIssue(data){
    let emis = getEmis();
    return await addDoc(collection(db,'issues'), {...data, emis, date: data.date||new Date().toISOString().slice(0,10), by: getSession()?.name||'', createdAt: new Date().toISOString()});
  },
  async getIssues(){
    let emis = getEmis();
    let snap = await getDocs(query(collection(db,'issues'), where('emis','==',emis)));
    let list = snap.docs.map(d=>({id:d.id, ...d.data()}));
    list.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
    return list;
  },
  listenIssues(callback){
    let emis = getEmis();
    return onSnapshot(query(collection(db,'issues'), where('emis','==',emis)), (snap)=>{
      let list = snap.docs.map(d=>({id:d.id, ...d.data()}));
      list.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
      callback(list);
    });
  },

  // ---- STATS ----
  async getStats(){
    let [books, learners, issues] = await Promise.all([this.getBooks(), this.getLearners(), this.getIssues()]);
    let issued = issues.filter(i=>i.action==='Issued').length;
    let returned = issues.filter(i=>i.action==='Returned'||i.action==='Retrieved').length;
    let out = Math.max(0, issued-returned);
    let pct = issued===0?null:(returned/issued*100);
    let copies = books.reduce((a,b)=>a+(b.totalCopies||b.copies?.length||b.copiesCount||0),0);
    return {books: books.length, copies, learners: learners.length, issued, returned, out, pct, booksList: books, learnersList: learners, issues};
  },

  // ---- MIGRATION: localStorage -> Firebase (ONE TIME) ----
  async migrateFromLocalStorage(){
    let emis = getEmis();
    if(!emis) throw new Error('No session EMIS');
    let results = {books:0, learners:0, issues:0, skipped:''};
    // Check if already migrated
    let existingBooks = await this.getBooks();
    let existingLearners = await this.getLearners();
    let existingIssues = await this.getIssues();

    // Books
    if(existingBooks.length===0){
      let localBooks = [];
      try{ localBooks = JSON.parse(localStorage.getItem('EMIS_'+emis+'_makhanani_ltsm')||'[]'); }catch(e){}
      for(let b of localBooks){
        await this.addBook({
          title: b.title||'', subject: b.subject||'', grade: String(b.grade||''),
          totalCopies: (b.copies||[]).length || b.totalCopies || 1,
          copiesCount: (b.copies||[]).length || 1
        });
        results.books++;
      }
    } else results.skipped += 'Books already in Firebase ('+existingBooks.length+'), not re-migrated. ';

    // Learners
    if(existingLearners.length===0){
      let localLearners = [];
      try{ localLearners = JSON.parse(localStorage.getItem('EMIS_'+emis+'_makhanani_learners')||'[]'); }catch(e){}
      for(let l of localLearners){
        await this.addLearner({name: l.name||'', class: String(l.class||l.grade||''), admissionId: l.id||l.admissionId||''});
        results.learners++;
      }
    } else results.skipped += 'Learners already in Firebase ('+existingLearners.length+'). ';

    // Issues
    if(existingIssues.length===0){
      let localIssues = [];
      try{ localIssues = JSON.parse(localStorage.getItem('EMIS_'+emis+'_makhanani_issues')||'[]'); }catch(e){}
      for(let iss of localIssues){
        await this.addIssue({learnerName: iss.learnerName||'', learnerClass: iss.learnerClass||'', bookTitle: iss.bookTitle||'', subject: iss.subject||'', action: iss.action||'Issued', date: iss.date||new Date().toISOString().slice(0,10)});
        results.issues++;
      }
    } else results.skipped += 'Issues already in Firebase ('+existingIssues.length+'). ';

    return results;
  }
};
