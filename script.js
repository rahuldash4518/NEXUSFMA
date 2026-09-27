
/* ---------- AUTH ---------- */
function switchTab(t){
  document.getElementById('tab-login').classList.toggle('active', t==='login');
  document.getElementById('tab-signup').classList.toggle('active', t==='signup');
  document.getElementById('pane-login').style.display = t==='login' ? 'block':'none';
  document.getElementById('pane-signup').style.display = t==='signup' ? 'block':'none';
  updateBackButtons();
}
let companyName = 'Acme Networks Inc.';
let currentEmail = '';
let viewHistory = [];
const SALES_EMAIL = 'sales@nexusfma.com';
function showView(viewId, remember=true){
  const viewIds = ['view-auth','view-sub','view-payment','view-dash'];
  const currentView = viewIds.find(id => getComputedStyle(document.getElementById(id)).display !== 'none');
  if(remember && currentView && currentView !== viewId) viewHistory.push(currentView);
  viewIds.forEach(id => document.getElementById(id).style.display = id === viewId ? (id === 'view-auth' ? 'flex' : 'block') : 'none');
  updateBackButtons();
}
function updateBackButtons(){
  document.getElementById('dash-back').hidden = viewHistory.length === 0;
}
function goBack(){
  if(viewHistory.length){
    showView(viewHistory.pop(), false);
  } else if(document.getElementById('view-auth').style.display !== 'none' && document.getElementById('pane-signup').style.display !== 'none'){
    switchTab('login');
  }
}
function doLogin(){
  const e=document.getElementById('li-email').value.trim(), p=document.getElementById('li-pass').value;
  const errEl=document.getElementById('li-err');
  if(!e||!p){ errEl.textContent='Enter an email and password to continue.'; errEl.style.display='block'; return; }
  const accounts=getAccounts();
  const acc=accounts[e];
  if(!acc){ errEl.textContent='No account found for this email. Create an account first.'; errEl.style.display='block'; return; }
  if(acc.password!==p){ errEl.textContent='Incorrect password. Check your credentials and try again.'; errEl.style.display='block'; return; }
  errEl.style.display='none';
  currentEmail = e;
  companyName = acc.company;
  saveSession();
  enterDashboard();
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function getAccounts(){
  try{ return JSON.parse(localStorage.getItem('nexusfma_accounts')||'{}'); }catch(e){ return {}; }
}
function saveAccounts(a){
  try{ localStorage.setItem('nexusfma_accounts', JSON.stringify(a)); }catch(e){}
}
const SESSION_KEY = 'nexusfma_session';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
function saveSession(){
  try{ localStorage.setItem(SESSION_KEY, JSON.stringify({email:currentEmail, expiresAt:Date.now()+SESSION_TTL})); }catch(e){}
}
function clearSession(){
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
}
function restoreSession(){
  let session;
  try{ session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }catch(e){ clearSession(); return; }
  if(!session || !session.email || !Number.isFinite(session.expiresAt) || session.expiresAt<=Date.now()){
    clearSession();
    return;
  }
  const account=getAccounts()[session.email];
  if(!account){ clearSession(); return; }
  currentEmail=session.email;
  companyName=account.company;
  enterDashboard(false);
}
document.addEventListener('DOMContentLoaded', restoreSession, {once:true});
function doSignup(){
  const c=document.getElementById('su-company').value.trim(), e=document.getElementById('su-email').value.trim(), p=document.getElementById('su-pass').value;
  const errEl=document.getElementById('su-err'), okEl=document.getElementById('su-ok');
  okEl.style.display='none';
  if(!c||!e||!p){ errEl.textContent='Fill in all fields to create your ID.'; errEl.style.display='block'; return; }
  if(!EMAIL_RE.test(e)){ errEl.textContent='Enter a valid work email address.'; errEl.style.display='block'; return; }
  if(p.length<6){ errEl.textContent='Password must be at least 6 characters.'; errEl.style.display='block'; return; }
  const accounts=getAccounts();
  if(accounts[e]){ errEl.textContent='An account with this email already exists. Log in instead.'; errEl.style.display='block'; return; }
  accounts[e] = {password:p, company:c, createdAt:new Date().toISOString()};
  saveAccounts(accounts);
  errEl.style.display='none';
  okEl.style.display='block';
  companyName = c;
  currentEmail = e;
  saveSession();
  document.getElementById('sub-company-name').textContent = `Choose a plan for ${c}`;
  setTimeout(()=>showView('view-sub'), 700);
}
function selectPlan(plan){
  const prices = {Growth:'₹50,000/month minimum',Business:'₹1,25,000/month minimum',Enterprise:'₹3–5 lakh/month starting'};
  const subject = encodeURIComponent(`${plan} plan payment request - ${companyName}`);
  const body = encodeURIComponent(`Hello NexusFMA Sales,\n\nPlease help us proceed with the ${plan} plan for ${companyName}.\n\nPlease provide a secure direct checkout link or contact us to discuss payment.`);
  const mailto = `mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`;
  document.getElementById('payment-plan').textContent = `${plan} for ${companyName}`;
  document.getElementById('payment-price').textContent = prices[plan];
  document.getElementById('checkout-request').href = mailto;
  document.getElementById('sales-request').href = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Sales inquiry - ${plan} plan`)}&body=${body}`;
  showView('view-payment');
}
function enterDashboard(remember=true){
  showView('view-dash', remember);
  document.getElementById('topbar-co').textContent = companyName;
  document.getElementById('profile-company').textContent = companyName;
  document.getElementById('profile-email').textContent = currentEmail || 'Signed in';
  document.getElementById('profile-avatar').textContent = companyName.trim().charAt(0).toUpperCase() || 'A';
  buildRules(); buildRemediation(); buildAudit(); startFeed();
  buildIngestionList(); buildTraining(); buildFrameworkRow();
  buildOptimizationList();
}

function toggleNav(forceOpen){
  const isOpen = forceOpen ?? !document.querySelector('.rail').classList.contains('open');
  document.querySelector('.rail').classList.toggle('open', isOpen);
  document.getElementById('nav-scrim').classList.toggle('show', isOpen);
  document.getElementById('menu-toggle').setAttribute('aria-expanded', String(isOpen));
  document.getElementById('menu-toggle').setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
}
function logout(){
  document.querySelector('.profile-menu').open = false;
  toggleNav(false);
  clearSession();
  viewHistory = [];
  showView('view-auth', false);
  document.getElementById('li-pass').value='';
  currentEmail = '';
  switchTab('login');
}

/* ---------- NAV ---------- */
function switchPage(p, el){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  toggleNav(false);
  const results=document.getElementById('search-results');
  if(results) results.hidden=true;
}

function navigateDashboard(page){
  const navItem=document.querySelector(`.nav-item[data-page="${page}"]`);
  if(navItem) switchPage(page, navItem);
}
function toggleFavorite(){
  const button=document.getElementById('favorite-policy');
  const isFavorite=button.getAttribute('aria-pressed')==='true';
  button.setAttribute('aria-pressed', String(!isFavorite));
  button.setAttribute('aria-label', isFavorite?'Add Policy Overview to favorites':'Remove Policy Overview from favorites');
  button.textContent=isFavorite?'☆':'★';
}
const optimizationSuggestions=[
  {title:'Remove 1,847 unused rules', detail:'No matching traffic observed in 90 days', risk:'low'},
  {title:'Consolidate 312 redundant rules', detail:'Equivalent policy coverage detected', risk:'medium'},
  {title:'Review 96 overly permissive rules', detail:'Broad source or destination ranges found', risk:'high'}
];
function buildOptimizationList(){
  const list=document.getElementById('optimization-list');
  if(!list) return;
  list.innerHTML=optimizationSuggestions.map((suggestion,index)=>`
    <div class="optimization-item">
      <span><strong>${suggestion.title}</strong><small>${suggestion.detail}</small></span>
      <button type="button" onclick="reviewOptimization(${index})">Review</button>
    </div>`).join('');
}
function reviewOptimization(index){
  const suggestion=optimizationSuggestions[index];
  if(!suggestion) return;
  navigateDashboard('rules');
  const rule=rules.find(item=>item.risk===suggestion.risk);
  if(rule){
    explainRule(rule.id);
    document.getElementById('modal-body').textContent=`${suggestion.title}: ${suggestion.detail}. Review this ${rule.risk}-risk sample policy before making changes.`;
  }
}
function searchDashboard(query){
  const results=document.getElementById('search-results');
  results.replaceChildren();
  const term=query.trim().toLowerCase();
  if(!term){ results.hidden=true; return; }
  const matches=[
    ...rules.filter(rule=>`${rule.id} ${rule.vendor} ${rule.action} ${rule.zone}`.toLowerCase().includes(term)).map(rule=>({type:'rule',id:rule.id,title:`${rule.action} · ${rule.zone}`,detail:`${rule.id} · ${rule.vendor}`})),
    ...ingestedDevices.filter(device=>`${device.name} ${device.vendor} ${device.model} ${device.serial}`.toLowerCase().includes(term)).map(device=>({type:'device',name:device.name,title:device.name,detail:`${device.vendor} · ${device.model}`}))
  ].slice(0,8);
  if(!matches.length){
    const empty=document.createElement('div');
    empty.className='search-result';
    empty.textContent='No matching policies or devices';
    results.append(empty);
  }
  matches.forEach(match=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='search-result';
    button.setAttribute('role','option');
    const title=document.createElement('strong');
    title.textContent=match.title;
    const detail=document.createElement('span');
    detail.textContent=match.detail;
    button.append(title,detail);
    button.addEventListener('click',()=>{
      if(match.type==='rule'){
        navigateDashboard('rules');
        explainRule(match.id);
      }else{
        navigateDashboard('compliance');
        const ingestTab=document.querySelector('.subtab-btn');
        if(ingestTab) switchSub('ingest',ingestTab);
      }
      results.hidden=true;
    });
    results.append(button);
  });
  results.hidden=false;
}

/* ---------- MOCK DATA ---------- */
const vendors=['Cisco','Juniper','Fortinet'];
const actions=['Allow','Deny','Rate-limit','NAT','Log-only'];
const zones=['DMZ','Internal','Guest-VLAN','DC-Core','Edge','Mgmt'];
let rules=[];
for(let i=1;i<=20;i++){
  const risk = i%9===0?'high': i%4===0?'medium':'low';
  rules.push({
    id:'RULE-'+String(1000+i),
    vendor:vendors[i%3],
    action:actions[i%actions.length],
    zone:zones[i%zones.length],
    risk,
    status: risk==='high' && i%18===0 ? 'pending':'active'
  });
}
function riskChip(r){
  if(r==='high') return '<span class="chip danger">High</span>';
  if(r==='medium') return '<span class="chip warn">Medium</span>';
  return '<span class="chip ok">Low</span>';
}
function buildRules(){
  const body=document.getElementById('rules-body');
  body.innerHTML = rules.map(r=>`
    <tr class="rulerow">
      <td class="rid">${r.id}</td>
      <td><span class="vtag">${r.vendor}</span></td>
      <td>${r.action} · ${r.zone}</td>
      <td>${riskChip(r.risk)}</td>
      <td>${r.status==='pending'?'<span class="chip warn">Awaiting approval</span>':'<span class="chip ok">Active</span>'}</td>
      <td><button class="explain-btn" onclick="explainRule('${r.id}')">Explain</button></td>
    </tr>`).join('');
}
const explainTemplates = {
  low:(r)=>`This ${r.action.toLowerCase()} rule on ${r.vendor} governs traffic in the ${r.zone} zone. It matches a narrow, well-established pattern consistent with existing baseline policy, so the model scores it low-risk and applied it automatically. No overlapping rule conflicts were found.`,
  medium:(r)=>`This ${r.action.toLowerCase()} rule on ${r.vendor} touches the ${r.zone} zone with a broader match than typical baseline rules. The model flagged it medium-risk because it slightly widens exposure versus the last known-good config, though no active threat indicators were tied to it.`,
  high:(r)=>`This ${r.action.toLowerCase()} rule on ${r.vendor} affects the ${r.zone} zone and would materially change exposure — it overlaps a rule protecting a sensitive segment. The model scored it high-risk and routed it to human approval rather than auto-applying it.`
};
function explainRule(id){
  const r = rules.find(x=>x.id===id);
  document.getElementById('modal-title').textContent = `${r.action} · ${r.zone}`;
  document.getElementById('modal-rid').textContent = `${r.id} — ${r.vendor}`;
  document.getElementById('modal-body').textContent = explainTemplates[r.risk](r);
  document.getElementById('modal-bg').classList.add('show');
}
function closeModal(){ document.getElementById('modal-bg').classList.remove('show'); }

/* ---------- REMEDIATION ---------- */
let remediations=[
  {name:'Anomalous outbound traffic block', vendor:'Fortinet', risk:'low', desc:'Automatically blocks outbound traffic matching anomalous volume/destination patterns on VLAN 40.', steps:['1. Detect anomaly signature','2. Apply deny rule at dc-fw-03','3. Verify traffic drop','4. Log to audit trail'], status:'applied'},
  {name:'SSH brute-force source rate-limit', vendor:'Cisco', risk:'low', desc:'Rate-limits source IPs exceeding SSH auth-failure thresholds on the edge firewall.', steps:['1. Detect auth-failure burst','2. Apply rate-limit ACL','3. Verify connection throttling','4. Log to audit trail'], status:'applied'},
  {name:'Exposed NAT rule quarantine', vendor:'Juniper', risk:'high', desc:'Quarantines a misconfigured NAT rule exposing an internal host to the DMZ. Changes internal reachability, so it requires sign-off.', steps:['1. Detect exposure via config diff','2. Hold for human approval','3. Apply quarantine NAT rule','4. Verify host unreachable from DMZ','5. Log to audit trail'], status:'pending'}
];
function buildRemediation(){
  const wrap=document.getElementById('rem-list');
  wrap.innerHTML = remediations.map((r,i)=>`
    <div class="rem-card">
      <div class="rem-top">
        <div><span class="vtag">${r.vendor}</span>${riskChip(r.risk)}<h4 style="margin-top:8px;">${r.name}</h4></div>
      </div>
      <div class="rem-desc">${r.desc}</div>
      <div class="rem-steps">${r.steps.join('<br>')}</div>
      <div class="rem-actions" id="rem-actions-${i}">${remActionsHTML(r,i)}</div>
    </div>`).join('');
}
function remActionsHTML(r,i){
  if(r.status==='applied') return `<span class="chip ok">Applied & verified</span><button class="btn-sm" onclick="rollback(${i})">Rollback</button>`;
  if(r.status==='pending') return `<button class="btn-sm ok" onclick="approve(${i})">Approve</button><button class="btn-sm danger-o" onclick="reject(${i})">Reject</button><span class="status-line">Requires human approval — high risk</span>`;
  if(r.status==='approved') return `<span class="chip ok">Approved · applying…</span>`;
  if(r.status==='rejected') return `<span class="chip danger">Rejected</span>`;
}
function approve(i){
  remediations[i].status='approved'; buildRemediation();
  setTimeout(()=>{ remediations[i].status='applied'; buildRemediation(); addAudit(remediations[i].name, remediations[i].vendor); }, 1200);
}
function reject(i){ remediations[i].status='rejected'; buildRemediation(); }
function rollback(i){
  remediations[i].status='pending'; buildRemediation();
  addAudit('Rollback — '+remediations[i].name, remediations[i].vendor, true);
}

/* ---------- AUDIT ---------- */
let auditLog=[
  {t:'09:14:02', change:'Applied SSH brute-force rate-limit', vendor:'Cisco', verified:true, rollback:true},
  {t:'08:52:41', change:'Applied outbound anomaly block', vendor:'Fortinet', verified:true, rollback:true}
];
function buildAudit(){
  const body=document.getElementById('audit-body');
  body.innerHTML = auditLog.map(a=>`
    <tr>
      <td class="rid">${a.t}</td>
      <td><span class="vtag">${a.vendor}</span> ${a.change}</td>
      <td>${a.verified?'<span class="chip ok">Verified</span>':'<span class="chip warn">Verifying…</span>'}</td>
      <td>${a.rollback?'<button class="btn-sm">Rollback</button>':'—'}</td>
    </tr>`).join('');
}
function addAudit(change, vendor, verified){
  const now=new Date(); const t=now.toTimeString().slice(0,8);
  auditLog.unshift({t, change, vendor, verified: !!verified===false?true:true, rollback:true});
  buildAudit();
}

/* ---------- SIMULATED LIVE FEED ---------- */
const feedMsgs = [
  (v)=>`<b>${v}</b> policy sync completed — no drift detected`,
  (v)=>`AI scored a new <b>${v}</b> change as low-risk and auto-applied it`,
  (v)=>`<b>${v}</b> flagged a rule as high-risk — routed for approval`,
  (v)=>`Verification passed for a recent change on <b>${v}</b>`,
  (v)=>`Heartbeat OK — <b>${v}</b> device reachable`,
];
function startFeed(){
  const feed=document.getElementById('live-feed');
  function push(){
    const v=vendors[Math.floor(Math.random()*3)];
    const msg=feedMsgs[Math.floor(Math.random()*feedMsgs.length)](v);
    const now=new Date().toTimeString().slice(0,8);
    const el=document.createElement('div');
    el.className='feed-item';
    el.innerHTML=`<span class="t">${now}</span><span class="m">${msg}</span>`;
    feed.prepend(el);
    while(feed.children.length>12) feed.removeChild(feed.lastChild);
  }
  push(); push();
  setInterval(push, 4000);
}

/* ---------- COMPLIANCE ENGINE: sub-tabs ---------- */
function switchSub(p, el){
  document.querySelectorAll('.sub-page').forEach(x=>x.classList.remove('active'));
  document.getElementById('sub-'+p).classList.add('active');
  document.querySelectorAll('.subtab-btn').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
}

/* ---------- 1. UNIFIED INGESTION ENGINE ---------- */
let ingestedDevices = [
  {name:'edge-fw-01.cfg', vendor:'Cisco', model:'ASA 5525-X', serial:'JMX2210L0AB', score:92, findings:[
    {rule:'Disable Telnet', status:'pass', sev:'high'},
    {rule:'SSHv2 enforced', status:'pass', sev:'high'},
    {rule:'Session timeout ≤ 10min', status:'fail', sev:'medium', fix:'ssh timeout 10'},
    {rule:'AAA logging enabled', status:'pass', sev:'medium'}
  ]},
  {name:'core-fw-02.cfg', vendor:'Juniper', model:'SRX345', serial:'AH3719AF0021', score:78, findings:[
    {rule:'Strong cipher suite', status:'pass', sev:'high'},
    {rule:'Unused interfaces disabled', status:'fail', sev:'medium', fix:'set interfaces ge-0/0/3 disable'},
    {rule:'NTP authentication', status:'fail', sev:'low', fix:'set system ntp authentication-key 1 type md5'},
    {rule:'Granular ACLs present', status:'pass', sev:'high'}
  ]}
];
function detectVendor(filename){
  const n=filename.toLowerCase();
  if(n.includes('cisco')||n.includes('asa')||n.includes('ios')) return {vendor:'Cisco', model:'IOS/ASA device'};
  if(n.includes('juniper')||n.includes('srx')||n.includes('junos')) return {vendor:'Juniper', model:'SRX series'};
  if(n.includes('forti')) return {vendor:'Fortinet', model:'FortiGate'};
  if(n.includes('paloalto')||n.includes('panos')) return {vendor:'Palo Alto', model:'PAN-OS firewall'};
  const guess=vendors[Math.floor(Math.random()*vendors.length)];
  return {vendor:guess, model:guess+' device (unverified)'};
}
function handleUpload(files){
  if(!files || !files.length) return;
  Array.from(files).forEach(f=>{
    const det=detectVendor(f.name);
    const score = Math.floor(60+Math.random()*38);
    ingestedDevices.push({
      name:f.name, vendor:det.vendor, model:det.model,
      serial:'SN'+Math.random().toString(36).slice(2,10).toUpperCase(),
      score,
      findings:[
        {rule:'Insecure protocol disabled (Telnet/HTTP)', status: score>75?'pass':'fail', sev:'high', fix:'no service telnet ; no ip http server'},
        {rule:'Strong cryptographic suite', status:'pass', sev:'high'},
        {rule:'Granular ACLs configured', status: score>70?'pass':'fail', sev:'medium', fix:'define least-privilege ACL per zone'},
        {rule:'Admin access logging', status:'pass', sev:'medium'}
      ]
    });
  });
  buildIngestionList();
  switchSub('ingest', document.querySelector('.subtab-btn'));
  document.getElementById('cfg-input').value='';
}
function buildIngestionList(){
  const wrap=document.getElementById('ingest-list');
  if(!wrap) return;
  if(!ingestedDevices.length){ wrap.innerHTML='<div class="hint-box">No devices ingested yet.</div>'; return; }
  wrap.innerHTML = ingestedDevices.map((d,i)=>{
    const c = d.score>=85?'ok':d.score>=65?'warn':'danger';
    return `<div class="dev-card">
      <div><div class="dname">${d.name}</div><div class="dsub"><span class="vtag">${d.vendor}</span> ${d.model} · SN ${d.serial}</div></div>
      <div style="text-align:right;"><div class="score-ring chip ${c}" style="font-size:13px;">${d.score}% baseline</div></div>
    </div>`;
  }).join('');
  buildReportList();
}

/* ---------- 2. MULTI-FRAMEWORK ENGINE ---------- */
const frameworks=[
  {id:'cis', name:'CIS Benchmarks'}, {id:'nist', name:'NIST SP 800-53'},
  {id:'stig', name:'DISA STIGs'}, {id:'iso', name:'ISO/IEC 27001'}
];
let activeFrameworks = new Set(['cis']);
function buildFrameworkRow(){
  const row=document.getElementById('fw-row');
  if(!row) return;
  row.innerHTML = frameworks.map(f=>`<button class="fw-chip ${activeFrameworks.has(f.id)?'on':''}" onclick="toggleFramework('${f.id}',this)">${f.name}</button>`).join('');
  updateFwHint();
}
function toggleFramework(id, el){
  if(activeFrameworks.has(id)) activeFrameworks.delete(id); else activeFrameworks.add(id);
  el.classList.toggle('on');
  updateFwHint();
}
function updateFwHint(){
  const hint=document.getElementById('fw-hint');
  const names = frameworks.filter(f=>activeFrameworks.has(f.id)).map(f=>f.name);
  hint.textContent = names.length ? `Evaluating ${ingestedDevices.length} ingested device(s) against: ${names.join(', ')}.` : 'Select at least one framework to run deviation analysis.';
}
function runComplianceScan(){
  if(!activeFrameworks.size){ updateFwHint(); return; }
  ingestedDevices = ingestedDevices.map(d=>({...d, score: Math.max(50, Math.min(99, d.score + Math.floor(Math.random()*7-2)))}));
  buildIngestionList();
  const hint=document.getElementById('fw-hint');
  hint.textContent = `Deviation analysis complete for ${ingestedDevices.length} device(s) — scores refreshed on the Ingestion tab.`;
}

/* ---------- 3. AI TRAINING MODULE ---------- */
let trainingQueue=[
  {id:1, vendor:'Hillstone', raw:'sg-policy edge deny-log strict-mode enable', category:null},
  {id:2, vendor:'SONiC (White Box)', raw:'config qos map dscp-tc binding apply-persist', category:null},
  {id:3, vendor:'Sangfor', raw:'auth-timeout session 900 idle-kick on', category:null},
  {id:4, vendor:'MikroTik', raw:'/ip ssh set strong-crypto=yes forwarding-enabled=no', category:null}
];
const trainCategories=['Access Control / ACL','Authentication & Password Policy','Session Timeout','Logging & Audit','Encryption / Cipher Suite','Insecure Protocol'];
function buildTraining(){
  const wrap=document.getElementById('training-list');
  if(!wrap) return;
  const pending = trainingQueue.filter(t=>!t.category);
  if(!trainingQueue.length){ wrap.innerHTML='<div class="hint-box">Nothing queued — every ingested syntax pattern is recognized.</div>'; return; }
  wrap.innerHTML = `<div class="hint-box">${pending.length} unrecognized command line(s) need a mapping before they can be scored.</div>` +
    trainingQueue.map(t=>`
    <div class="train-row ${t.category?'learned':''}" id="train-${t.id}">
      <div class="dsub" style="margin-bottom:8px;"><span class="vtag">${t.vendor}</span> unrecognized syntax</div>
      <div class="train-cmd">${t.raw}</div>
      ${t.category
        ? `<span class="chip ok">Learned → mapped to "${t.category}"</span>`
        : `<select id="cat-${t.id}"><option value="">Map to category…</option>${trainCategories.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><button class="btn-sm primary" onclick="teachAI(${t.id})">Teach AI</button>`
      }
    </div>`).join('');
}
function teachAI(id){
  const sel=document.getElementById('cat-'+id);
  if(!sel || !sel.value) return;
  const item=trainingQueue.find(t=>t.id===id);
  item.category=sel.value;
  buildTraining();
}

/* ---------- 4. PDF REPORTING ---------- */
function buildReportList(){
  const wrap=document.getElementById('report-list');
  if(!wrap) return;
  wrap.innerHTML = ingestedDevices.map((d,i)=>`
    <div class="dev-card">
      <div><div class="dname">${d.name}</div><div class="dsub"><span class="vtag">${d.vendor}</span> ${d.model} · ${d.findings.filter(f=>f.status==='fail').length} finding(s) to fix</div></div>
      <button class="btn-sm primary" onclick="generateReport(${i})">Generate PDF report</button>
    </div>`).join('') || '<div class="hint-box">Ingest a device first to generate its report.</div>';
}
function generateReport(i){
  const d=ingestedDevices[i];
  const w=window.open('', '_blank');
  if(!w) return;
  const rows=d.findings.map(f=>`
    <tr>
      <td>${f.rule}</td>
      <td style="text-transform:capitalize">${f.sev}</td>
      <td style="color:${f.status==='pass'?'#188a5c':'#c0243b'};font-weight:700;">${f.status.toUpperCase()}</td>
      <td style="font-family:monospace;font-size:11px;">${f.status==='fail' ? (f.fix||'Apply vendor hardening guidance') : '—'}</td>
    </tr>`).join('');
  w.document.write(`<!DOCTYPE html><html><head><title>Compliance Report — ${d.name}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif; color:#111; padding:36px; max-width:820px; margin:0 auto;}
    h1{font-size:22px; margin-bottom:4px;} .sub{color:#666; font-size:12.5px; margin-bottom:24px;}
    .box{border:1px solid #ddd; border-radius:8px; padding:14px 18px; margin-bottom:18px;}
    table{width:100%; border-collapse:collapse; font-size:12.5px;} th,td{text-align:left; padding:8px 10px; border-bottom:1px solid #e2e2e2;}
    th{background:#f5f5f7; font-size:11px; text-transform:uppercase; color:#666;}
    .score{font-size:30px; font-weight:800;}
  </style></head><body>
  <h1>Network Device Compliance Report</h1>
  <div class="sub">Generated ${new Date().toLocaleString()} · Frameworks: ${[...activeFrameworks].map(id=>frameworks.find(f=>f.id===id).name).join(', ') || 'CIS Benchmarks (default)'}</div>
  <div class="box"><b>Device Identification</b><br>File: ${d.name} &nbsp;·&nbsp; Vendor: ${d.vendor} &nbsp;·&nbsp; Model: ${d.model} &nbsp;·&nbsp; Serial: ${d.serial}</div>
  <div class="box"><b>Overall baseline score</b><div class="score">${d.score}%</div></div>
  <div class="box"><b>Compliance Findings</b>
  <table><thead><tr><th>Control</th><th>Severity</th><th>Result</th><th>Remediation CLI</th></tr></thead><tbody>${rows}</tbody></table></div>
  <p style="color:#999;font-size:11px;">NexusFMA AI-Augmented Compliance Engine — vendor-agnostic, framework-mapped findings.</p>
  <script>window.onload=()=>setTimeout(()=>window.print(),300);<\/script>
  </body></html>`);
  w.document.close();
}
