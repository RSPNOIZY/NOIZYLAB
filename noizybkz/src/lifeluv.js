// LIFELUV dashboard for NOIZYBKZ. Plain HTML + inline SVG, no external scripts.
// Data comes from GET /api/books/:id/reports/lifeluv. All API text is inserted with
// textContent. Colours: reference categorical slots 1–2 (validated light and dark).

export const LIFELUV = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LIFELUV Dashboard</title>
<style>
:root{color-scheme:light;--bg:#f6f5f1;--surface:#fcfcfb;--line:#e4e2dc;--grid:#ecebe6;--text:#0b0b0b;--text2:#52514e;--muted:#7a7974;
 --s1:#2a78d6;--s2:#eb6834;--accent:#2a78d6;--ok:#1d7a3a}
@media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])){color-scheme:dark;--bg:#121211;--surface:#1a1a19;--line:#33322f;--grid:#2a2a28;--text:#f0efec;--text2:#c3c2b7;--muted:#97968f;--s1:#3987e5;--s2:#d95926;--accent:#3987e5;--ok:#5cc27e}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#121211;--surface:#1a1a19;--line:#33322f;--grid:#2a2a28;--text:#f0efec;--text2:#c3c2b7;--muted:#97968f;--s1:#3987e5;--s2:#d95926;--accent:#3987e5;--ok:#5cc27e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,sans-serif}
main{max-width:1080px;margin:0 auto;padding:16px}
header{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;justify-content:space-between}
h1{font-size:1.5rem;margin:0}h2{font-size:1rem;margin:0 0 8px}.sub{color:var(--text2)}
.badge{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:.8rem;color:var(--text2);background:var(--surface)}
.badge b{color:var(--ok)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px;margin:12px 0}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}.row>*{flex:1 1 150px}
label{display:block;font-size:.78rem;color:var(--text2);margin-bottom:2px}
input,select,button{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text);width:100%}
button{background:var(--accent);color:#fff;border:0;cursor:pointer;width:auto}button.ghost{background:transparent;color:var(--accent);border:1px solid var(--line)}
.hero{display:grid;grid-template-columns:minmax(220px,1.3fr) repeat(4,minmax(120px,1fr));gap:12px}
@media (max-width:760px){.hero{grid-template-columns:1fr 1fr}.hero .big{grid-column:1/-1}}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px}
.tile .l{font-size:.8rem;color:var(--text2)}.tile .v{font-size:1.6rem;font-weight:600}.tile .d{font-size:.78rem;color:var(--muted)}
.big .v{font-size:3rem;line-height:1.1}
.grid2{display:grid;grid-template-columns:1.4fr 1fr;gap:12px}@media (max-width:860px){.grid2{grid-template-columns:1fr}}
.legend{display:flex;gap:14px;font-size:.82rem;color:var(--text2);margin-bottom:6px}.key{display:inline-block;width:12px;height:12px;border-radius:3px;vertical-align:-1px;margin-right:5px}
svg{display:block;width:100%;height:auto;overflow:visible}svg text{fill:var(--text2);font-size:11px;font-family:inherit}
.hbar{display:grid;grid-template-columns:minmax(120px,190px) 1fr auto;gap:8px;align-items:center;margin:5px 0;font-size:.88rem}
.track{height:14px;position:relative}.fill{height:14px;border-radius:0 4px 4px 0;background:var(--s1);min-width:2px}
.hbar .n{color:var(--text);font-variant-numeric:tabular-nums}.hbar:hover .fill,.hbar:focus .fill{filter:brightness(1.15)}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:.9rem}td,th{text-align:left;padding:5px 6px;border-bottom:1px solid var(--line)}th{color:var(--text2);font-weight:500}td.n,th.n{text-align:right}
#tip{position:fixed;pointer-events:none;background:var(--surface);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:.82rem;box-shadow:0 4px 14px rgba(0,0,0,.18);display:none;z-index:9}
#tip .k{display:inline-block;width:12px;height:2px;vertical-align:middle;margin-right:6px}#tip b{font-weight:600}
#msg{color:var(--text2);min-height:1.3em}#msg.bad{color:#c2412d}.hide{display:none!important}.wrap{overflow-x:auto}
.note{font-size:.82rem;color:var(--muted)}
</style></head><body><main>
<header>
 <div><h1>LIFELUV</h1><div class="sub">Everyone who helps share music, recognised in LIFELUV Tokens (LLT)</div></div>
 <span class="badge" id="policy"><b>●</b> Internal · non-fiscal</span>
</header>
<div class="card row">
 <div><label for="token">API token</label><input id="token" type="password" placeholder="BKZ_TOKEN"></div>
 <div><label for="book">Book</label><select id="book"></select></div>
 <div><label for="months">Period</label><select id="months"><option value="6">Last 6 months</option><option value="12" selected>Last 12 months</option><option value="24">Last 24 months</option></select></div>
 <div style="flex:0 0 auto"><button id="connect">Connect</button></div>
 <div style="flex:0 0 auto"><label><input id="public" type="checkbox" style="width:auto"> Public impact view</label></div>
</div>
<div id="msg" role="status"></div>

<section class="hero" aria-label="Key figures">
 <div class="tile big"><div class="l">LLT held by members</div><div class="v" id="k-out">—</div><div class="d" id="k-out-d"></div></div>
 <div class="tile"><div class="l">Members</div><div class="v" id="k-mem">—</div></div>
 <div class="tile"><div class="l">LLT earned</div><div class="v" id="k-iss">—</div><div class="d" id="k-per"></div></div>
 <div class="tile"><div class="l">LLT redeemed</div><div class="v" id="k-red">—</div></div>
 <div class="tile"><div class="l">LLT expired</div><div class="v" id="k-exp">—</div></div>
</section>

<div class="grid2">
 <section class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="flex:1">Earned and redeemed each month</h2>
  <button class="ghost" data-table="monthly" style="flex:0 0 auto">Table view</button></div>
  <div class="legend"><span><i class="key" style="background:var(--s1)"></i>Earned</span><span><i class="key" style="background:var(--s2)"></i>Redeemed</span></div>
  <div id="monthly"></div><div class="wrap hide" id="monthly-t"><table></table></div></section>
 <section class="card"><h2>Members by tier</h2><div id="tiers"></div><p class="note">Tier = lifetime tokens earned (Seed 0 · Root 10 · Branch 50 · Canopy 200 · Forest 500).</p></section>
</div>

<section class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="flex:1">Impact: what the community did</h2>
 <button class="ghost" data-table="impact" style="flex:0 0 auto">Table view</button></div>
 <div id="impact"></div><div class="wrap hide" id="impact-t"><table></table></div></section>

<section class="card private" id="people"><h2>Members</h2><div class="wrap"><table id="members"></table></div></section>

<section class="card private"><h2>Recognise a contribution</h2>
 <div class="row">
  <div><label for="i-holder">Member id</label><input id="i-holder" placeholder="e.g. maria.t"></div>
  <div><label for="i-action">Contribution</label><select id="i-action"></select></div>
  <div><label for="i-date">Date</label><input id="i-date" type="date"></div>
  <div style="flex:0 0 auto"><button id="issue">Issue LLT</button></div>
 </div>
 <div class="row" style="margin-top:10px">
  <div><label for="r-holder">Member id</label><input id="r-holder"></div>
  <div><label for="r-credits">Credits (1 LLT = 1,000)</label><input id="r-credits" inputmode="numeric" placeholder="1000"></div>
  <div><label for="r-note">Redeemed for</label><input id="r-note" placeholder="NOIZYVOX voice credits"></div>
  <div style="flex:0 0 auto"><button id="redeem">Redeem in-system</button></div>
  <div style="flex:0 0 auto"><button class="ghost" id="expire">Expire</button></div>
 </div>
 <p class="note">LIFELUV Tokens are internal and non-fiscal: they recognise contribution and are redeemed inside NOIZY only. They are never wages and cannot be cashed out. Professional work is paid in money, at union scale or better.</p>
</section>
<div id="tip" role="tooltip"></div>
<script>
const $=id=>document.getElementById(id);const NS="http://www.w3.org/2000/svg";
const llt=c=>(c/1000).toLocaleString(undefined,{maximumFractionDigits:3});
const compact=n=>n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e4?(n/1e3).toFixed(1)+"K":n.toLocaleString();
function say(t,bad){$("msg").textContent=t;$("msg").className=bad?"bad":""}
try{$("token").value=sessionStorage.getItem("bkz")||""}catch{}
async function api(p,o={}){const r=await fetch("/api"+p,{...o,headers:{authorization:"Bearer "+$("token").value,"content-type":"application/json"}});const b=await r.json();if(!r.ok)throw new Error(b.error||r.status);return b}
const el=(t,a={},txt)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e};
const tip=$("tip");
function showTip(ev,rows,title){tip.replaceChildren();const h=document.createElement("div");h.textContent=title;h.style.color="var(--text2)";tip.appendChild(h);
 rows.forEach(([v,label,color])=>{const d=document.createElement("div");if(color){const k=document.createElement("span");k.className="k";k.style.background=color;d.appendChild(k)}
  const b=document.createElement("b");b.textContent=v;d.appendChild(b);d.appendChild(document.createTextNode(" "+label));tip.appendChild(d)});
 tip.style.display="block";const r=ev.target.getBoundingClientRect?ev.target.getBoundingClientRect():{left:ev.clientX,top:ev.clientY};
 const x=(ev.clientX||r.left+r.width/2)+14,y=(ev.clientY||r.top)+14;tip.style.left=Math.min(x,innerWidth-tip.offsetWidth-8)+"px";tip.style.top=Math.min(y,innerHeight-tip.offsetHeight-8)+"px"}
const hideTip=()=>tip.style.display="none";
function table(id,head,rows){const t=$(id).querySelector("table")||$(id);t.replaceChildren();const tr=t.insertRow();head.forEach(([h,n])=>{const th=document.createElement("th");th.textContent=h;if(n)th.className="n";tr.appendChild(th)});
 rows.forEach(r=>{const x=t.insertRow();r.forEach((v,i)=>{const c=x.insertCell();c.textContent=v;if(head[i][1])c.className="n"})})}
function niceMax(v){if(v<=0)return 1;const p=10**Math.floor(Math.log10(v));return Math.ceil(v/p/(v/p>5?2:1))*p*(v/p>5?2:1)}

function monthlyChart(data){const W=640,H=240,L=44,R=8,T=10,B=28,box=$("monthly");box.replaceChildren();
 const max=niceMax(Math.max(1,...data.flatMap(d=>[d.issued,d.redeemed])));const s=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img","aria-label":"Monthly LLT earned and redeemed"});
 for(let i=0;i<=4;i++){const y=T+(H-T-B)*(1-i/4);s.appendChild(el("line",{x1:L,x2:W-R,y1:y,y2:y,stroke:"var(--grid)","stroke-width":1}));s.appendChild(el("text",{x:L-6,y:y+4,"text-anchor":"end"},llt(max*i/4)))}
 const gw=(W-L-R)/data.length,bw=Math.max(3,Math.min(18,(gw-8)/2));
 data.forEach((d,i)=>{const cx=L+gw*i+gw/2;[["issued","var(--s1)",-bw/2-1],["redeemed","var(--s2)",bw/2+1]].forEach(([k,c,off])=>{const h=(H-T-B)*d[k]/max;if(h>0){const x=cx+off-bw/2,y=H-B-h,r=Math.min(4,h,bw/2);
   s.appendChild(el("path",{d:"M"+x+","+(H-B)+"V"+(y+r)+"Q"+x+","+y+" "+(x+r)+","+y+"H"+(x+bw-r)+"Q"+(x+bw)+","+y+" "+(x+bw)+","+(y+r)+"V"+(H-B)+"Z",fill:c}))}});
  if(data.length<=12||i%2===0)s.appendChild(el("text",{x:cx,y:H-B+16,"text-anchor":"middle"},d.month.slice(2).replace("-","/")));
  const hit=el("rect",{x:L+gw*i,y:T,width:gw,height:H-T-B,fill:"transparent",tabindex:0,"aria-label":d.month+": earned "+llt(d.issued)+" LLT, redeemed "+llt(d.redeemed)+" LLT"});
  const on=e=>showTip(e,[[llt(d.issued)+" LLT","earned","var(--s1)"],[llt(d.redeemed)+" LLT","redeemed","var(--s2)"]],d.month);
  hit.addEventListener("pointermove",on);hit.addEventListener("focus",on);hit.addEventListener("pointerleave",hideTip);hit.addEventListener("blur",hideTip);s.appendChild(hit)});
 s.appendChild(el("line",{x1:L,x2:W-R,y1:H-B,y2:H-B,stroke:"var(--line)","stroke-width":1}));box.appendChild(s);
 table("monthly-t",[["Month"],["Earned (LLT)",1],["Redeemed (LLT)",1],["Expired (LLT)",1]],data.map(d=>[d.month,llt(d.issued),llt(d.redeemed),llt(d.expired)]))}

function hbars(id,rows,valueText,tipRows){const box=$(id);box.replaceChildren();if(!rows.length){const p=document.createElement("p");p.className="note";p.textContent="Nothing recorded in this period yet.";box.appendChild(p);return}
 const max=Math.max(...rows.map(r=>r.v),1);rows.forEach(r=>{const row=document.createElement("div");row.className="hbar";row.tabIndex=0;
  const lab=document.createElement("span");lab.textContent=r.label;const tr=document.createElement("div");tr.className="track";const f=document.createElement("div");f.className="fill";f.style.width=(100*r.v/max)+"%";tr.appendChild(f);
  if(!r.v)f.style.minWidth="0";const n=document.createElement("span");n.className="n";n.textContent=valueText(r);row.append(lab,tr,n);
  if(tipRows){const on=e=>showTip(e,tipRows(r),r.label);row.addEventListener("pointermove",on);row.addEventListener("focus",on);row.addEventListener("pointerleave",hideTip);row.addEventListener("blur",hideTip)}
  box.appendChild(row)})}

let current=null;
async function connect(){try{sessionStorage.setItem("bkz",$("token").value)}catch{}
 const books=await api("/books");const keep=$("book").value;$("book").replaceChildren(...books.map(b=>new Option(b.name+" ("+b.jurisdiction+")",b.id)));if(keep)$("book").value=keep;
 if(!books.length){say("Connected. Create a book in NOIZYBKZ first.");return}
 const acts=await api("/books/"+$("book").value+"/llt/actions");$("i-action").replaceChildren(...Object.entries(acts).map(([k,v])=>new Option(k.replace(/_/g," ").toLowerCase().replace(/^./,c=>c.toUpperCase())+" · "+v+" credits",k)));
 await load();say("Connected.")}
async function load(){const pub=$("public").checked;document.querySelectorAll(".private").forEach(e=>e.classList.toggle("hide",pub));
 const d=await api("/books/"+$("book").value+"/reports/lifeluv?months="+$("months").value+(pub?"&public=1":""));current=d;
 $("policy").replaceChildren();const b=document.createElement("b");b.textContent="●";$("policy").append(b," Internal · "+d.policy);
 $("k-out").textContent=llt(d.kpis.outstanding);$("k-out-d").textContent="LLT · "+d.kpis.outstanding.toLocaleString()+" credits";
 $("k-mem").textContent=compact(d.kpis.members);$("k-iss").textContent=llt(d.kpis.issued);$("k-red").textContent=llt(d.kpis.redeemed);$("k-exp").textContent=llt(d.kpis.expired);
 $("k-per").textContent=d.from.slice(0,7)+" to "+d.to.slice(0,7);
 monthlyChart(d.monthly);
 hbars("tiers",d.tiers.map(t=>({label:t.name+" · "+t.status,v:t.members})),r=>r.v.toLocaleString(),r=>[[r.v.toLocaleString(),"members"]]);
 hbars("impact",d.impact.map(i=>({label:i.label,v:i.times,c:i.credits})).sort((a,b)=>b.v-a.v),r=>r.v.toLocaleString(),r=>[[r.v.toLocaleString(),"times"],[llt(r.c)+" LLT","earned"]]);
 table("impact-t",[["Contribution"],["Times",1],["LLT earned",1]],d.impact.map(i=>[i.label,i.times.toLocaleString(),llt(i.credits)]));
 if(d.members)table("members",[["Member"],["Tier"],["Earned (LLT)",1],["Holding (LLT)",1]],d.members.map(m=>[m.holder,m.tier,llt(m.earned),llt(m.held)]))}
async function act(path,body,ok){try{await api("/books/"+$("book").value+path,{method:"POST",body:JSON.stringify(body)});say(ok);await load()}catch(e){say(e.message,1)}}
$("connect").onclick=()=>connect().catch(e=>say(e.message,1));["book","months","public"].forEach(id=>$(id).onchange=()=>load().catch(e=>say(e.message,1)));
$("issue").onclick=()=>act("/llt/issue",{holder:$("i-holder").value.trim(),date:$("i-date").value,action:$("i-action").value},"LLT issued. Thank you, "+$("i-holder").value.trim()+".");
$("redeem").onclick=()=>act("/llt/redeem",{holder:$("r-holder").value.trim(),date:new Date().toISOString().slice(0,10),credits:$("r-credits").value.trim(),note:$("r-note").value},"Redeemed.");
$("expire").onclick=()=>{if(confirm("Expire these credits? This cannot be undone."))act("/llt/expire",{holder:$("r-holder").value.trim(),date:new Date().toISOString().slice(0,10),credits:$("r-credits").value.trim()},"Expired.")};
document.querySelectorAll("[data-table]").forEach(b=>b.onclick=()=>{const id=b.dataset.table;const t=$(id+"-t");const show=t.classList.contains("hide");t.classList.toggle("hide",!show);$(id).classList.toggle("hide",show);b.textContent=show?"Chart view":"Table view"});
$("i-date").value=new Date().toISOString().slice(0,10);
</script></main></body></html>`;
