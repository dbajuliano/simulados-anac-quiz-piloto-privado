let data, currentSet, list=[], index=0, answers=[], startedAt=0, timerId=null, remaining=1800;

const $=id=>document.getElementById(id);
const show=id=>{["home","sets","quiz","result"].forEach(x=>$(x).classList.toggle("hidden",x!==id));window.scrollTo(0,0)};

async function init(){
  data=await fetch("data/teoria-de-voo.json").then(r=>r.json());
  $("subjects").innerHTML=`<button class="card" onclick="showSets()"><h3>Teoria de Voo</h3><p>${data.questions.length} questões · ${data.sections.length} simulados</p></button>`;
}
function showSets(){
  $("subjectTitle").textContent=data.subject;
  $("setCards").innerHTML=data.sections.map(s=>{
    const n=s.to-s.from+1;
    return `<button class="card" onclick="startSet(${s.id})"><h3>${s.name}</h3><p>${n} questões · 30 minutos</p></button>`;
  }).join("");
  show("sets");
}
function startSet(id){
  currentSet=data.sections.find(s=>s.id===id);
  list=data.questions.slice(currentSet.from-1,currentSet.to);
  index=0; answers=[]; remaining=data.timeLimitSeconds; startedAt=Date.now();
  $("quizName").textContent=`${data.subject} — ${currentSet.name}`;
  clearInterval(timerId); timerId=setInterval(tick,1000); tick();
  show("quiz"); render();
}
function tick(){
  remaining=Math.max(0,remaining-1);
  const m=String(Math.floor(remaining/60)).padStart(2,"0"),s=String(remaining%60).padStart(2,"0");
  $("timer").textContent=`${m}:${s}`;
  if(remaining===0){clearInterval(timerId); finish();}
}
function render(){
  const q=list[index]; $("progress").textContent=`Questão ${index+1} de ${list.length}`;
  $("qnum").textContent=`QUESTÃO ${q.number}`;
  $("question").textContent=q.question;
  $("bar").style.width=`${index/list.length*100}%`;
  $("feedback").className="feedback hidden"; $("next").classList.add("hidden");
  $("options").innerHTML=Object.entries(q.options).map(([k,v])=>`<button class="option" data-k="${k}" onclick="answer('${k}')"><b>${k}</b> — ${v}</button>`).join("");
}
function answer(k){
  const q=list[index]; if(answers[index]) return;
  answers[index]=k;
  document.querySelectorAll(".option").forEach(b=>b.disabled=true);
  const ok=k===q.correct;
  const f=$("feedback"); f.className=`feedback ${ok?"ok":"bad"}`;
  f.textContent=ok?"✓ Acerto":"✕ Erro";
  const detail=document.createElement("div");
  detail.textContent=ok?`A resposta está correta.`:`A resposta correta é ${q.correct}.`;
  f.appendChild(detail);
  $("next").textContent=index===list.length-1?"Ver resultado →":"Próxima questão →";
  $("next").classList.remove("hidden");
}
$("next").onclick=()=>{if(index<list.length-1){index++;render()}else finish()};
function finish(){
  clearInterval(timerId);
  const elapsed=data.timeLimitSeconds-remaining;
  let hits=0;
  answers.forEach((a,i)=>{if(a===list[i].correct)hits++});
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
