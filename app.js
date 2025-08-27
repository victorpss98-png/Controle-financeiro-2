
/* App logic: storage, calculations, charts */
const LS_FIN = "pwa_fin_rows_v1";
const LS_COR = "pwa_cor_rows_v1";
const LS_CAT = "pwa_fin_cats_v1";

const DEFAULT_CATS = ["Alimentação","Moradia","Transporte","Lazer","Contas","Saúde","Educação","Outros"];

let fin = JSON.parse(localStorage.getItem(LS_FIN)||"[]");
let cor = JSON.parse(localStorage.getItem(LS_COR)||"[]");
let cats = JSON.parse(localStorage.getItem(LS_CAT)||"null") || DEFAULT_CATS;

function $(id){return document.getElementById(id);}
function fmt(n){return "R$ "+Number(n||0).toFixed(2).replace(".",",");}

function save(){ localStorage.setItem(LS_FIN, JSON.stringify(fin)); localStorage.setItem(LS_COR, JSON.stringify(cor)); localStorage.setItem(LS_CAT, JSON.stringify(cats)); }

document.getElementById("tab-fin").addEventListener("click",()=>{showTab("fin")});
document.getElementById("tab-cor").addEventListener("click",()=>{showTab("cor")});
function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById("tab-"+id).classList.add("active");
  document.getElementById("fin").style.display = id==="fin" ? "block" : "none";
  document.getElementById("cor").style.display = id==="cor" ? "block" : "none";
}

function fillCats(){
  const sel = $("f-cat"); sel.innerHTML = "";
  cats.forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=c; sel.appendChild(o); });
}
fillCats();

let finPie=null, corPie=null;
function drawFinPie(data){
  const ctx = $("fin-pie").getContext("2d");
  if(finPie) finPie.destroy();
  finPie = new Chart(ctx, {type:"pie", data:{labels:data.map(d=>d.label), datasets:[{data:data.map(d=>d.value)}]}, options:{responsive:true}});
}
function drawCorPie(data){
  const ctx = $("cor-pie").getContext("2d");
  if(corPie) corPie.destroy();
  corPie = new Chart(ctx, {type:"pie", data:{labels:data.map(d=>d.label), datasets:[{data:data.map(d=>d.value)}]}, options:{responsive:true}});
}

function renderFin(){
  const entradas = fin.filter(r=>r.type==="Entrada").reduce((a,b)=>a+Number(b.value),0);
  const saidas = fin.filter(r=>r.type==="Saída").reduce((a,b)=>a+Number(b.value),0);
  $("total-entr").textContent = fmt(entradas);
  $("total-sai").textContent = fmt(saidas);
  $("total-saldo").textContent = fmt(entradas-saidas);

  const container = $("fin-table"); container.innerHTML = "";
  if(fin.length===0){ container.innerHTML="<div class='small'>Sem lançamentos.</div>"; } else {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Data</th><th>Desc</th><th>Cat</th><th>Tipo</th><th>Valor</th><th></th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    fin.forEach((r,idx)=>{
      const tr=document.createElement("tr");
      tr.innerHTML = `<td>${r.date}</td><td>${r.desc||""}</td><td>${r.cat}</td><td>${r.type}</td><td>${fmt(r.value)}</td><td><button data-i="${idx}" class="btn" style="background:#ef4444">Excluir</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
    container.querySelectorAll("button[data-i]").forEach(b=>b.addEventListener("click",e=>{
      const i = Number(e.target.dataset.i); fin.splice(i,1); save(); renderFin(); renderFinChart();
    }));
  }
  renderFinChart();
}

function renderFinChart(){
  const gastos = {};
  fin.filter(r=>r.type==="Saída").forEach(r=>{ gastos[r.cat]=(gastos[r.cat]||0)+Number(r.value); });
  const data = Object.keys(gastos).map(k=>({label:k,value:Math.round(gastos[k]*100)/100}));
  if(data.length===0) drawFinPie([{label:"Sem gastos",value:1}]); else drawFinPie(data);
}

function renderCor(){
  const ganhos = cor.reduce((a,b)=>a+Number(b.ganhos),0);
  const combust = cor.reduce((a,b)=>a+Number(b.combustivel),0);
  const outros = cor.reduce((a,b)=>a+Number(b.outros),0);
  const lucro = ganhos - combust - outros;
  const km = cor.reduce((a,b)=>a+Number(b.km),0);
  $("g-total").textContent = fmt(ganhos);
  $("g-comb").textContent = fmt(combust);
  $("g-outros").textContent = fmt(outros);
  $("g-lucro").textContent = fmt(lucro);
  $("g-km").textContent = km.toFixed(1);

  const container = $("cor-table"); container.innerHTML = "";
  if(cor.length===0){ container.innerHTML="<div class='small'>Sem registros.</div>"; } else {
    const table=document.createElement("table");
    const thead=document.createElement("thead");
    thead.innerHTML = "<tr><th>Data</th><th>Km</th><th>App</th><th>Ganhos</th><th>Comb</th><th>Outros</th><th>Lucro</th><th></th></tr>";
    table.appendChild(thead);
    const tbody=document.createElement("tbody");
    cor.forEach((r,idx)=>{
      const lucroDay = Number(r.ganhos)-Number(r.combustivel)-Number(r.outros);
      const tr=document.createElement("tr");
      tr.innerHTML = `<td>${r.date}</td><td>${r.km}</td><td>${r.app||""}</td><td>${fmt(r.ganhos)}</td><td>${fmt(r.combustivel)}</td><td>${fmt(r.outros)}</td><td>${fmt(lucroDay)}</td><td><button data-i="${idx}" class="btn" style="background:#ef4444">Excluir</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); container.appendChild(table);
    container.querySelectorAll("button[data-i]").forEach(b=>b.addEventListener("click",e=>{
      const i = Number(e.target.dataset.i); cor.splice(i,1); save(); renderCor(); renderCorChart();
    }));
  }
  renderCorChart();
}

function renderCorChart(){
  const ganhos = cor.reduce((a,b)=>a+Number(b.ganhos),0);
  const combust = cor.reduce((a,b)=>a+Number(b.combustivel),0);
  const outros = cor.reduce((a,b)=>a+Number(b.outros),0);
  const lucro = Math.max(ganhos - combust - outros,0);
  const data = [{label:"Combustível",value:combust},{label:"Outros Gastos",value:outros},{label:"Lucro",value:Math.round(lucro*100)/100}];
  drawCorPie(data);
}

$("add-fin").addEventListener("click",()=>{
  const date=$("f-date").value || new Date().toISOString().slice(0,10);
  const desc=$("f-desc").value;
  const cat=$("f-cat").value || "Outros";
  const type=$("f-type").value;
  const value=Number($("f-val").value)||0;
  fin.unshift({date,desc,cat,type,value}); save(); renderFin();
  $("f-desc").value=""; $("f-val").value="";
});

$("add-cor").addEventListener("click",()=>{
  const date=$("c-date").value || new Date().toISOString().slice(0,10);
  const km=Number($("c-km").value)||0;
  const app=$("c-app").value;
  const ganhos=Number($("c-gan").value)||0;
  const combust=Number($("c-comb").value)||0;
  const outros=Number($("c-outros").value)||0;
  cor.unshift({date,km,app,ganhos,combustivel:combust,outros}); save(); renderCor();
  $("c-km").value=""; $("c-app").value=""; $("c-gan").value=""; $("c-comb").value=""; $("c-outros").value="";
});

$("export-json").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify({fin,cor,cats},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`backup_controle_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
});
$("export-json-cor").addEventListener("click",()=> $("export-json").click() );
$("import-btn").addEventListener("click",()=> $("import-json").click() );
$("import-json").addEventListener("change",(e)=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); if(Array.isArray(data.fin)) fin=data.fin; if(Array.isArray(data.cor)) cor=data.cor; if(Array.isArray(data.cats)) cats=data.cats; save(); fillCats(); renderFin(); renderCor(); alert("Restaurado!"); }catch(err){alert("Arquivo inválido");} }; r.readAsText(f);
});

document.querySelectorAll('input[type="date"]').forEach(i=>{ i.value = new Date().toISOString().slice(0,10); });

renderFin(); renderCor(); renderFinChart(); renderCorChart();

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
