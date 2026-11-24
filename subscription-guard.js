// subscription-guard.js - MAKHANANI LTSM - Locks school if subscription expired / unpaid / no sub
// Premium Yearly = 12 MONTHS ONLY - Paid + End Passed = LOCKED
// EMIS is School ID - No Duplicate EMIS
(function(){
  window.MAKHANANI_PACKAGES = [
    {name:'Demo',price:0,setup:0,billing:'demo', maxBooks:50, maxLearners:30, allowBarcodes:false, allowFinance:false, allowReports:false, allowManuals:false},
    {name:'Starter',price:500,setup:3500,billing:'monthly', yearly:5000, maxBooks:200, maxLearners:100, allowBarcodes:false, allowFinance:false, allowReports:false, allowManuals:false},
    {name:'Standard',price:700,setup:4500,billing:'monthly', yearly:7000, maxBooks:999999, maxLearners:999999, allowBarcodes:true, allowFinance:false, allowReports:true, allowManuals:false},
    {name:'Premium',price:900,setup:5500,billing:'monthly', yearly:9000, maxBooks:999999, maxLearners:999999, allowBarcodes:true, allowFinance:true, allowReports:true, allowManuals:true, allowSupport:true}
  ];
  function getSubs(){ try{ return JSON.parse(localStorage.getItem('makhanani_subscriptions')||'[]'); }catch(e){ return []; } }
  function getPackages(){ try{ let p=JSON.parse(localStorage.getItem('makhanani_packages')||'[]'); if(p.length) return p; }catch(e){} return window.MAKHANANI_PACKAGES; }
  window.getSubscriptionFor = function(schoolName, emis){
    let subs=getSubs();
    if(emis){ let f=subs.find(s=>s.emis===emis); if(f) return f; }
    if(schoolName){ let f=subs.find(s=>s.school===schoolName); if(f) return f; }
    if(schoolName && schoolName.includes('Wordsworth')){ let f=subs.find(s=>s.school && s.school.includes('Wordsworth')); if(f) return f; }
    if(schoolName && schoolName.includes('George')){ let f=subs.find(s=>s.school && s.school.includes('George')); if(f) return f; }
    return null;
  };
  window.checkSubscription = function(schoolName, emis, opts){
    opts = opts || {}; let isSuper = false;
    try{ let sess=JSON.parse(localStorage.getItem('makhanani_session')||'null'); if(sess && (sess.role==='SUPER_ADMIN'||sess.role==='ADMIN')) isSuper=true; }catch(e){}
    let sub = getSubscriptionFor(schoolName, emis);
    let now = new Date(); now.setHours(0,0,0,0);
    let result = {locked:false, reason:'', sub:sub, package:null, daysLeft:null};
    if(!sub){
      result.locked = true; result.reason = 'NO_SUBSCRIPTION';
      result.message = '🔒 This school has NO subscription. Contact Super Admin to subscribe.';
    } else {
      let pkgs=getPackages(); let pkg = pkgs.find(p=>p.name===sub.package) || window.MAKHANANI_PACKAGES.find(p=>p.name===sub.package) || {name:sub.package, maxBooks:999999, maxLearners:999999, allowBarcodes:true, allowFinance:true};
      result.package = pkg;
      if(sub.status==='Cancelled'){ result.locked=true; result.reason='CANCELLED'; result.message='🔒 Subscription CANCELLED for '+schoolName+'. Contact Super Admin.'; }
      else if(sub.status==='Unpaid'){ result.locked=true; result.reason='UNPAID'; result.message='🔒 Subscription UNPAID for '+schoolName+' — R'+(sub.amount||0)+' due. Pay to unlock.'; }
      else if(sub.end){ let end=new Date(sub.end); end.setHours(0,0,0,0); let diff=Math.ceil((end-now)/(1000*60*60*24)); result.daysLeft=diff; if(diff<0){ result.locked=true; result.reason='EXPIRED'; result.message='🔒 Subscription EXPIRED on '+sub.end+' — 12 Months Ended. Renew to unlock.'; } else if(diff<=30){ result.warning='⚠️ Subscription expires in '+diff+' days ('+sub.end+') — 12 Months Only — Renew soon.'; } else if(diff<=7){ result.warning='⚠️ Subscription expires in '+diff+' days ('+sub.end+') — Renew now.'; } }
      else if(sub.status==='Expired'){ result.locked=true; result.reason='EXPIRED'; result.message='🔒 Subscription EXPIRED for '+schoolName+'. Renew to unlock.'; }
      if(!result.locked && pkg){
        try{
          let books=JSON.parse(localStorage.getItem('EMIS_'+emis+'_makhanani_ltsm')||'[]'); let totalBooks=0; books.forEach(b=> totalBooks+=(b.copies||[]).length);
          let learners=JSON.parse(localStorage.getItem('EMIS_'+emis+'_makhanani_learners')||'[]');
          if(totalBooks >= (pkg.maxBooks||999999)) { result.limitReached='BOOKS'; result.warning='⚠️ Package limit reached: '+totalBooks+' / '+pkg.maxBooks+' books on '+pkg.name+'. Upgrade to add more.'; }
          if(learners.length >= (pkg.maxLearners||999999)) { result.limitReached='LEARNERS'; result.warning='⚠️ Package limit reached: '+learners.length+' / '+pkg.maxLearners+' learners on '+pkg.name+'. Upgrade to add more.'; }
        }catch(e){}
      }
    }
    if(isSuper && result.locked){ result.lockedForAdmin=false; result.adminBypass=true; }
    if(opts.block && result.locked && !isSuper){
      let overlay=document.getElementById('subLockOverlay');
      if(!overlay){
        overlay=document.createElement('div'); overlay.id='subLockOverlay';
        overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
        overlay.innerHTML='<div style="background:white;border-radius:16px;padding:24px;max-width:480px;width:100%;text-align:center;"><div style="font-size:48px;">🔒</div><h2 style="font-weight:900;font-size:22px;margin:8px 0;">School Locked</h2><p id="subLockMsg" style="font-size:14px;color:#333;"></p><p style="font-size:12px;color:#666;margin-top:8px;">School: <b id="subLockSchool"></b><br>Package: <b id="subLockPkg"></b> • Status: <b id="subLockStatus"></b></p><div style="display:flex;gap:8px;margin-top:16px;justify-content:center;flex-wrap:wrap;"><a href="finance-dashboard.html" style="background:#16a34a;color:white;padding:10px 16px;border-radius:8px;font-weight:900;text-decoration:none;">💳 Pay / Renew →</a><a href="super-admin-dashboard.html" style="background:#7c3aed;color:white;padding:10px 16px;border-radius:8px;font-weight:900;text-decoration:none;">👑 Contact Super Admin</a><a href="index.html" style="background:#e5e7eb;padding:10px 16px;border-radius:8px;font-weight:700;text-decoration:none;color:black;">🏠 Home</a></div><p style="font-size:11px;color:#999;margin-top:12px;">Super Admin can still view this page to fix subscription. If you are Super Admin, this lock is bypassed — check banner at top.</p></div>';
        document.body.appendChild(overlay);
      }
      document.getElementById('subLockMsg').textContent=result.message;
      document.getElementById('subLockSchool').textContent=schoolName;
      document.getElementById('subLockPkg').textContent=sub?sub.package:'None';
      document.getElementById('subLockStatus').textContent=sub?sub.status:'No Subscription';
      overlay.style.display='flex';
    }
    return result;
  };
  window.showSubBanner = function(elId, schoolName, emis){
    let el=document.getElementById(elId); if(!el) return null;
    let r=window.checkSubscription(schoolName, emis, {block:false});
    if(r.locked && r.adminBypass){ el.innerHTML='⚠️ <b>ADMIN VIEW:</b> '+r.message+' — You are SUPER_ADMIN, so you can still view / fix. Other users are LOCKED out.'; el.style.display='block'; }
    else if(r.locked){ el.innerHTML=r.message; el.style.display='block'; }
    else if(r.warning){ el.innerHTML=r.warning+' • Package: '+(r.sub?r.sub.package:'')+' • Status: '+(r.sub?r.sub.status:''); el.style.display='block'; }
    else if(r.sub){ el.innerHTML='✅ Subscribed: <b>'+r.sub.package+'</b> • '+r.sub.status+' • R'+(r.sub.amount||0)+' • '+r.sub.start+' to '+r.sub.end+' (12 Months Only)'+(r.daysLeft!==null?' • '+r.daysLeft+' days left':''); el.style.display='block'; }
    return r;
  };
})();
