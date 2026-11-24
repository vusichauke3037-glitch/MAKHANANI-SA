window.MAKHANANI_PACKAGES = [
  {name:'Demo',price:0,setup:0,billing:'demo', maxBooks:50, maxLearners:30, allowBarcodes:false, allowFinance:false},
  {name:'Starter',price:500,setup:3500,billing:'monthly', maxBooks:200, maxLearners:100, allowBarcodes:false, allowFinance:false},
  {name:'Standard',price:700,setup:4500,billing:'monthly', maxBooks:999999, maxLearners:999999, allowBarcodes:true, allowFinance:false},
  {name:'Premium',price:900,setup:5500,billing:'monthly', maxBooks:999999, maxLearners:999999, allowBarcodes:true, allowFinance:true}
];
// Yearly prices: Starter 5000, Standard 7000, Premium 9000 - checked in Finance, not in guard
// getSubscriptionFor now matches by EMIS first:
window.getSubscriptionFor = function(schoolName, emis){
  let subs=[]; try{ subs=JSON.parse(localStorage.getItem('makhanani_subscriptions')||'[]'); }catch(e){}
  if(emis) { let f=subs.find(s=>s.emis===emis); if(f) return f; }
  if(schoolName) { let f=subs.find(s=>s.school===schoolName); if(f) return f; }
  return null;
};
