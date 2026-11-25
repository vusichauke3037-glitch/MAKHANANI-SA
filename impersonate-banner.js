// impersonate-banner.js - Xintimani Group - Super Admin Impersonation Banner
// Add this 1 line to ANY dashboard: <script src="impersonate-banner.js"></script>
// Shows red banner when Super Admin is viewing as someone else + Return button
(function(){
  function getSession(){
    try{ return JSON.parse(localStorage.getItem('makhanani_session')||'null'); }catch(e){ return null; }
  }
  function returnToSuperAdmin(){
    let superSess = localStorage.getItem('makhanani_superadmin_session');
    if(superSess){
      localStorage.setItem('makhanani_session', superSess);
      localStorage.removeItem('makhanani_superadmin_session');
      localStorage.removeItem('makhanani_impersonating');
      location.href='superadmin-dashboard.html';
    } else {
      localStorage.removeItem('makhanani_session');
      localStorage.removeItem('makhanani_impersonating');
      location.href='superadmin-login.html';
    }
  }
  window.returnToSuperAdmin = returnToSuperAdmin;

  // Only show if impersonating
  let s = getSession();
  if(!s || !s.isImpersonating) return;

  // Don't double-add if already there
  if(document.getElementById('impBanner')) return;

  let banner = document.createElement('div');
  banner.id = 'impBanner';
  banner.style.cssText = 'background:#dc2626;color:white;text-align:center;padding:10px 8px;font-weight:900;font-size:13px;position:sticky;top:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,0.3);';
  banner.innerHTML =
    '<span>👀 SUPER ADMIN VIEWING AS <b>' + (s.name||'') + ' (' + (s.role||'') + ') • ' + (s.school||'') + ' • EMIS ' + (s.emis||'') + '</b></span>' +
    '<button onclick="returnToSuperAdmin()" style="background:white;color:#dc2626;padding:4px 12px;border-radius:999px;font-weight:900;font-size:12px;border:none;cursor:pointer;">🔙 RETURN TO SUPER ADMIN</button>' +
    '<span style="font-weight:400;font-size:11px;opacity:0.9;">Impersonated by: ' + (s.impersonatedBy||'superadmin@xintimani.co.za') + '</span>';

  // Insert at very top of body, above everything
  if(document.body){
    document.body.insertBefore(banner, document.body.firstChild);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      document.body.insertBefore(banner, document.body.firstChild);
    });
  }

  // Also add a floating return button for mobile (bottom-right) - in case top banner is scrolled past
  let fab = document.createElement('button');
  fab.textContent = '🔙 Super Admin';
  fab.onclick = returnToSuperAdmin;
  fab.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;background:#dc2626;color:white;border:2px solid white;padding:10px 14px;border-radius:999px;font-weight:900;font-size:12px;box-shadow:0 4px 15px rgba(0,0,0,0.4);cursor:pointer;';
  if(document.body) document.body.appendChild(fab);
  else document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(fab); });
})();
