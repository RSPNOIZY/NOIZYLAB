// Built-in web UI. Plain HTML + JS, no build step, no external scripts.
// Every value from the API is inserted with textContent (never innerHTML).

export const UI = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NOIZYBKZ</title>
<style>
:root{--bg:#fbfaf7;--fg:#1d1d1b;--muted:#6b6a65;--line:#e3e0d8;--card:#fff;--accent:#2f5d50;--bad:#a3322a}
@media (prefers-color-scheme:dark){:root{--bg:#161614;--fg:#ecebe6;--muted:#a3a29b;--line:#34332f;--card:#1f1e1c;--accent:#7cc0aa;--bad:#e2796f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:16px}h1{font-size:1.4rem;margin:.2rem 0}h2{font-size:1.05rem;margin:1.2rem 0 .4rem}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0}
label{display:block;font-size:.8rem;color:var(--muted);margin-top:6px}input,select,button{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg);max-width:100%}
button{background:var(--accent);color:var(--bg);border:0;cursor:pointer;margin-top:8px}
.row{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.row>*{flex:1 1 140px}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}td,th{padding:4px 6px;border-bottom:1px solid var(--line);text-align:left}td.n,th.n{text-align:right}
.tabs button{background:transparent;color:var(--accent);border:1px solid var(--line)}.tabs button.on{background:var(--accent);color:var(--bg)}
#msg{min-height:1.2em;color:var(--muted)}#msg.bad{color:var(--bad)}.wrap{overflow-x:auto}
</style></head><body><main>
<h1>NOIZYBKZ</h1><div style="color:var(--muted)">Free, open-source small-business books · Canada first, global by jurisdiction pack</div>
<div class="card row">
 <div><label>API token</label><input id="token" type="password" placeholder="BKZ_TOKEN"></div>
 <div><label>Book</label><select id="book"></select></div>
 <div><button id="connect">Connect</button></div>
</div>
<details class="card"><summary>New book</summary><div class="row">
 <div><label>Business name</label><input id="bname"></div>
 <div><label>Jurisdiction</label><select id="bjur"></select></div>
 <div><button id="bcreate">Create book</button></div></div></details>
<div class="card"><h2 style="margin-top:0">Invoice or bill</h2><div class="row">
 <div><label>Type</label><select id="dkind"><option value="invoices">Invoice (sale)</option><option value="bills">Bill (purchase)</option></select></div>
 <div><label>Number</label><input id="dnum"></div><div><label>Customer / supplier</label><input id="dparty"></div>
 <div><label>Date</label><input id="ddate" type="date"></div><div><label>Due</label><input id="ddue" type="date"></div></div>
 <div class="row"><div><label>Account</label><select id="dacct"></select></div><div><label>Description</label><input id="ddesc"></div>
 <div><label>Amount before tax</label><input id="damt" inputmode="decimal" placeholder="1000.00"></div>
 <div><label>Taxable</label><select id="dtax"><option value="1">Yes</option><option value="0">No (exempt / zero-rated)</option></select></div></div>
 <button id="dsave">Save</button></div>
<div class="card"><h2 style="margin-top:0">Open documents</h2><div class="wrap"><table id="docs"></table></div></div>
<div class="card"><div class="tabs row" style="flex-wrap:wrap">
 <button data-r="profit-loss" class="on">Profit &amp; loss</button><button data-r="balance-sheet">Balance sheet</button>
 <button data-r="trial-balance">Trial balance</button><button data-r="sales-tax">Sales tax</button><button data-r="aging">Receivables aging</button><button data-r="t2125">CRA T2125</button>
 <button id="export">Export (Beancount)</button></div>
 <div class="row"><div><label>From</label><input id="rfrom" type="date"></div><div><label>To / as of</label><input id="rto" type="date"></div></div>
 <div class="wrap"><table id="report"></table></div></div>
<div id="msg"></div>
<script>
const $=id=>document.getElementById(id);let report="profit-loss";
const money=c=>(c<0?"-":"")+(Math.abs(c)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
function say(t,bad){$("msg").textContent=t;$("msg").className=bad?"bad":""}
try{$("token").value=sessionStorage.getItem("bkz")||""}catch{}
async function api(path,opts={}){const r=await fetch("/api"+path,{...opts,headers:{"authorization":"Bearer "+$("token").value,"content-type":"application/json"}});
 const ct=r.headers.get("content-type")||"";const b=ct.includes("json")?await r.json():await r.text();if(!r.ok)throw new Error(b.error||r.status);return b}
const book=()=>$("book").value;
function rows(table,head,data){const t=$(table);t.replaceChildren();const tr=t.insertRow();head.forEach(h=>{const th=document.createElement("th");th.textContent=h[0];if(h[1])th.className="n";tr.appendChild(th)});
 data.forEach(d=>{const r=t.insertRow();d.forEach((v,i)=>{const c=r.insertCell();if(v instanceof Node)c.appendChild(v);else c.textContent=v;if(head[i]&&head[i][1])c.className="n"})})}
async function connect(){try{sessionStorage.setItem("bkz",$("token").value)}catch{}
 const [books,jur]=await Promise.all([api("/books"),api("/jurisdictions")]);
 $("bjur").replaceChildren(...jur.map(j=>new Option(j.code+" — "+j.name,j.code)));
 const keep=book();$("book").replaceChildren(...books.map(b=>new Option(b.name+" ("+b.jurisdiction+")",b.id)));if(keep)$("book").value=keep;
 if(books.length)await refresh();say(books.length?"Connected.":"Connected. Create your first book.")}
async function refresh(){if(!book())return;const accts=await api("/books/"+book()+"/accounts");
 const want=$("dkind").value==="invoices"?["INCOME"]:["EXPENSE","ASSET"];
 $("dacct").replaceChildren(...accts.filter(a=>want.includes(a.type)).map(a=>new Option(a.code+" "+a.name,a.code)));
 const docs=(await api("/books/"+book()+"/docs")).filter(d=>d.paid<d.total);
 rows("docs",[["Type"],["No."],["Party"],["Due"],["Total",1],["Owing",1],[""]],docs.map(d=>{const b=document.createElement("button");b.textContent="Record payment";
  b.onclick=()=>pay(d);return[d.kind,d.number,d.party,d.due||d.date,money(d.total),money(d.total-d.paid),b]}));await showReport()}
async function pay(d){const amt=prompt("Amount received/paid for "+d.kind+" "+d.number,(d.total-d.paid)/100+"");if(!amt)return;
 try{await api("/books/"+book()+"/payments",{method:"POST",body:JSON.stringify({doc_id:d.id,date:new Date().toISOString().slice(0,10),amount:Number(amt).toFixed(2)})});say("Payment recorded.");await refresh()}catch(e){say(e.message,1)}}
async function showReport(){const q=new URLSearchParams();if($("rfrom").value)q.set("from",$("rfrom").value);if($("rto").value){q.set("to",$("rto").value);q.set("as_of",$("rto").value)}
 const r=await api("/books/"+book()+"/reports/"+report+"?"+q);
 if(report==="profit-loss")rows("report",[["Account"],["Amount",1]],[...r.income.map(x=>[x.code+" "+x.name,money(x.amount)]),["Total income",money(r.total_income)],...r.expenses.map(x=>[x.code+" "+x.name,money(x.amount)]),["Total expenses",money(r.total_expenses)],["Net income",money(r.net_income)]]);
 if(report==="balance-sheet")rows("report",[["Account"],["Amount",1]],[...r.assets.map(x=>[x.code+" "+x.name,money(x.amount)]),["Total assets",money(r.total_assets)],...r.liabilities.map(x=>[x.code+" "+x.name,money(x.amount)]),["Total liabilities",money(r.total_liabilities)],...r.equity.map(x=>[x.code+" "+x.name,money(x.amount)]),["Total equity",money(r.total_equity)],[r.balanced?"Balanced ✓":"NOT BALANCED",""]]);
 if(report==="trial-balance")rows("report",[["Account"],["Debit",1],["Credit",1]],[...r.lines.map(x=>[x.code+" "+x.name,money(x.debit),money(x.credit)]),["Totals",money(r.totals.debit),money(r.totals.credit)]]);
 if(report==="sales-tax"){const d=r.families.flatMap(f=>[...f.components.map(c=>[f.family+" · "+c.code,money(c.collected),money(c.itc),""]),[f.family+" net owing",,"",money(f.net)]]);
  if(r.gst34)d.push(["GST34 line 101 (sales)",money(r.gst34.line_101_sales_and_other_revenue),"",""],["GST34 line 103 / 106 / 109",money(r.gst34.line_103_gst_hst_collected),money(r.gst34.line_106_input_tax_credits),money(r.gst34.line_109_net_tax)]);
  rows("report",[["Tax"],["Collected",1],["Recoverable",1],["Net",1]],d)}
 if(report==="t2125"){rows("report",[["Line"],["Description"],["Amount",1]],[...r.income.map(l=>[l.line,l.label,money(l.amount)]),["8299","Gross business income",money(r.line_8299_gross_business_income)],...r.expenses.map(l=>[l.line,l.label,money(l.amount)]),["9368","Total expenses",money(r.line_9368_total_expenses)],["9369","Net income before adjustments",money(r.line_9369_net_income_before_adjustments)],...r.notes.map(n=>["Note",n,""])]);return}
 if(report==="aging")rows("report",[["No."],["Customer"],["Due"],["Days overdue",1],["Owing",1]],[...r.items.map(i=>[i.number,i.party,i.due||i.date,String(i.days_overdue),money(i.owing)]),["Total","","","",money(r.total)]])}
$("connect").onclick=()=>connect().catch(e=>say(e.message,1));$("book").onchange=()=>refresh().catch(e=>say(e.message,1));$("dkind").onchange=()=>refresh().catch(e=>say(e.message,1));
$("bcreate").onclick=async()=>{try{const b=await api("/books",{method:"POST",body:JSON.stringify({name:$("bname").value,jurisdiction:$("bjur").value})});await connect();$("book").value=b.id;await refresh();say("Book created.")}catch(e){say(e.message,1)}};
$("dsave").onclick=async()=>{try{const d=await api("/books/"+book()+"/"+$("dkind").value,{method:"POST",body:JSON.stringify({number:$("dnum").value,party:$("dparty").value,date:$("ddate").value,due:$("ddue").value||null,
 lines:[{account:$("dacct").value,description:$("ddesc").value,amount:$("damt").value,taxable:$("dtax").value==="1"}]})});say("Saved. Total "+money(d.total)+".");await refresh()}catch(e){say(e.message,1)}};
document.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{report=b.dataset.r;document.querySelectorAll("[data-r]").forEach(x=>x.classList.toggle("on",x===b));showReport().catch(e=>say(e.message,1))});
$("rfrom").onchange=$("rto").onchange=()=>showReport().catch(e=>say(e.message,1));
$("export").onclick=async()=>{try{const t=await api("/books/"+book()+"/export/beancount");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"}));a.download="noizybkz.beancount";a.click()}catch(e){say(e.message,1)}};
$("ddate").value=new Date().toISOString().slice(0,10);
</script></main></body></html>`;
