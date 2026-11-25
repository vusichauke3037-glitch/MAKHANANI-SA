// Makhanani LTSM — Subscription Guard
// If no subscription system yet, this file just shows banner and never blocks.
// To add real subscription later, replace checkSubscription logic with your API.
(function(){
  window.checkSubscription=function(school, emis, opts){
    // opts: {block:true}
    // Return {locked:false, adminBypass:false} = allow all
    // To lock a school later, set localStorage: makhanani_sub_<EMIS> = {"locked":true, "until":"2027-01-31"}
    try{
      let raw=localStorage.getItem('makhanani_sub_'+emis);
      if(!raw) return {locked:false, adminBypass:false};
      let sub=JSON.parse(raw);
      if(sub && sub.locked){
        if(opts && opts.block){
          let el=document.getElementById('subBanner');
          if(el){ el.classList.remove('hidden'); el.innerHTML='🔒 Subscription expired for '+school+' — Contact Xintimani Group to renew. Showing read-only view.'; }
        }
        return {locked:true, adminBypass:false};
      }
      return {locked:false, adminBypass:false};
    }catch(e){ return {locked:false, adminBypass:false}; }
  };
  window.showSubBanner=function(elId, school, emis){
    try{
      let el=document.getElementById(elId); if(!el) return;
      let raw=localStorage.getItem('makhanani_sub_'+emis);
      if(!raw){ el.classList.add('hidden'); return; }
      let sub=JSON.parse(raw);
      if(sub && sub.until){ el.classList.remove('hidden'); el.innerHTML='✅ Subscription active for '+school+' until '+sub.until+' • Makhanani LTSM'; }
      else if(sub && sub.locked){ el.classList.remove('hidden'); el.innerHTML='🔒 Subscription expired — Contact Xintimani Group.'; }
      else el.classList.add('hidden');
    }catch(e){}
  };
})();
