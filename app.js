let catalog, data, currentSet, list=[], index=0, answers=[], timerId=null, remaining=1800;

const $=id=>document.getElementById(id);
const show=id=>{["home","sets","quiz","result"].forEach(x=>$(x).classList.toggle("hidden",x!==id));$("home-link").classList.toggle("hidden",id==="home");window.scrollTo(0,0)};

async function init(){
  try{
    const response=await fetch("data/subjects.json",{cache:"no-store"});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    catalog=await response.json();
    if(!catalog || !Array.isArray(catalog.materials)) throw new Error("Catálogo inválido");
    $("materials").innerHTML=catalog.materials.map(m=>`
    <section class="material-block">
      <div class="material-header">
        <div>
          <h2>${m.name}</h2>
          ${m.id==="rubens-pa"?'<span class="material-subtitle">Simulado de Rubens P.A.</span>':""}
        </div>
        <a class="source-link" href="${m.sourceUrl}" target="_blank" rel="noopener">${m.sourceLabel} →</a>
      </div>
      <div class="cards">${m.subjects.map(s=>
        `<button class="card" onclick="showSets('${s.id}')"><h3>${s.id==="regulamentos-e-trafego-rubens-pa"?"173 questões":s.name}</h3><p>Selecionar matéria →</p></button>`
      ).join("")}</div>
    </section>
  `).join("");
  }catch(error){
    console.error("Falha ao carregar o catálogo:",error);
    const box=document.createElement("div");
    box.className="load-error";
    box.innerHTML="Não foi possível carregar o catálogo automaticamente. Os materiais abaixo são o catálogo de reserva.";
    $("materials").prepend(box);
  }
}
async function showSets(subjectId){
  let subject=null;
  for(const material of catalog.materials){
    const found=material.subjects.find(s=>s.id===subjectId);
    if(found){subject=found;break}
  }
  if(!subject) return;
  const response=await fetch(subject.file,{cache:"no-store"});
  if(!response.ok) throw new Error(`Falha ao carregar ${subject.file}: HTTP ${response.status}`);
  data=await response.json();
  $("subjectTitle").textContent=data.subject;
  $("setCards").innerHTML=data.sections.map(s=>{
    const n=s.to-s.from+1;
    return `<button class="card" onclick="startSet(${s.id})"><h3>${s.name}</h3><p>Questões ${s.from}–${s.to} · ${n} questões · 30 minutos</p></button>`;
  }).join("");
  show("sets");
}
function startSet(id){
  currentSet=data.sections.find(s=>s.id===id);
  list=data.questions.slice(currentSet.from-1,currentSet.to);
  index=0; answers=[]; remaining=data.timeLimitSeconds;
  $("quizName").textContent=`${data.subject} — ${currentSet.name}`;
  clearInterval(timerId); timerId=setInterval(tick,1000); updateTimer();
  show("quiz"); render();
}
function updateTimer(){
  const m=String(Math.floor(remaining/60)).padStart(2,"0"),s=String(remaining%60).padStart(2,"0");
  $("timer").textContent=`${m}:${s}`;
}
function tick(){
  remaining=Math.max(0,remaining-1); updateTimer();
  if(remaining===0){clearInterval(timerId); finish();}
}
function render(){
  const q=list[index];
  const selected=answers[index];
  $("progress").textContent=`Questão ${index+1} de ${list.length}`;
  $("qnum").textContent=`QUESTÃO ${q.number}`;
  $("question").textContent=q.question;
  $("bar").style.width=`${((index+1)/list.length)*100}%`;
  $("prev").disabled=index===0;
  $("options").innerHTML=Object.entries(q.options).map(([k,v])=>
    `<button class="option ${selected===k?"selected":""}" data-k="${k}" ${selected?"disabled":""} onclick="answer('${k}')"><b>${k}</b> — ${v}</button>`
  ).join("");

  const f=$("feedback");
  const next=$("next");
  if(selected){
    const ok=selected===q.correct;
    f.className=`feedback ${ok?"ok":"bad"}`;
    f.textContent=ok?"✓ Acerto":"✕ Erro";
    const detail=document.createElement("div");
    detail.textContent=ok?"A resposta está correta.":`A resposta correta é ${q.correct}.`;
    f.appendChild(detail);
    next.textContent=index===list.length-1?"Ver resultado →":"Próxima questão →";
    next.classList.remove("hidden");
  }else{
    f.className="feedback hidden";
    next.classList.add("hidden");
  }
}
function answer(k){
  const q=list[index]; if(answers[index]) return;
  answers[index]=k;
  document.querySelectorAll(".option").forEach(b=>b.disabled=true);
  render();
}
$("next").onclick=()=>{if(index<list.length-1){index++;render()}else finish()};
$("prev").onclick=()=>{if(index>0){index--;render()}};
function finish(){
  clearInterval(timerId);
  let hits=0;
  answers.forEach((a,i)=>{if(a===list[i].correct)hits++});
  const elapsed=data.timeLimitSeconds-remaining;
  $("score").textContent=`${hits} / ${list.length}`;
  $("percent").textContent=`${Math.round(hits/list.length*100)}%`;
  $("hits").textContent=hits; $("errors").textContent=list.length-hits;
  const m=String(Math.floor(elapsed/60)).padStart(2,"0"),s=String(elapsed%60).padStart(2,"0");
  $("used").textContent=`${m}:${s}`;
  $("review").innerHTML=list.map((q,i)=>`<div class="reviewRow"><span>Questão ${q.number}</span><b class="${answers[i]===q.correct?"okText":"badText"}">${answers[i]===q.correct?"✓ Acerto":"✕ Erro"}</b></div>`).join("");
  show("result");
}
function restart(){startSet(currentSet.id)}
function goHome(){clearInterval(timerId);show("home")}
init();
