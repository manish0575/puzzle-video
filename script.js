/* =========================================================
   FINAL script.js
   Fixed assets:
     assets/wrong.png
     assets/right.png
     assets/wrong.mp3
     assets/right.mp3

   Upload controls remain only for:
     Background + A/B/C/D
========================================================= */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = 1080, H = 1920;

const letters = {
  A: { image: null, fixed: false },
  B: { image: null, fixed: false },
  C: { image: null, fixed: false },
  D: { image: null, fixed: false }
};

let background = null;
let wrongIcon = null, rightIcon = null;
let wrongAudio = null, rightAudio = null;
let currentAnimation = null;
let animationRunning = false;
let paused = false;

/* ---------- FIXED ASSETS ---------- */
const FIXED_WRONG_ICON = "assets/wrong.png";
const FIXED_RIGHT_ICON = "assets/right.png";
const FIXED_WRONG_SOUND = "assets/wrong.mp3";
const FIXED_RIGHT_SOUND = "assets/right.mp3";

function loadFixedAssets() {
  wrongIcon = new Image();
  wrongIcon.src = FIXED_WRONG_ICON;

  rightIcon = new Image();
  rightIcon.src = FIXED_RIGHT_ICON;

  wrongAudio = new Audio(FIXED_WRONG_SOUND);
  rightAudio = new Audio(FIXED_RIGHT_SOUND);

  wrongAudio.preload = "auto";
  rightAudio.preload = "auto";
}
loadFixedAssets();

/* ---------- RULES ---------- */
const rules = {
  A: { A:true,  B:false, C:false, D:false },
  B: { A:false, B:true,  C:false, D:false },
  C: { A:false, B:false, C:true,  D:false },
  D: { A:false, B:false, C:false, D:true }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- UPLOADS ---------- */
document.getElementById("backgroundInput").addEventListener("change", async e => {
  background = await loadImage(e.target.files[0]);
  draw();
});

for (const key of ["A","B","C","D"]) {
  document.getElementById("input"+key).addEventListener("change", async e => {
    if (!e.target.files[0]) return;
    letters[key].image = await loadImage(e.target.files[0]);
    letters[key].fixed = false;
    updateAnimationOrder();
    createRulesUI();
    createFlow();
    draw();
  });
}

/* ---------- ORDER ---------- */
function getOrder(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  return el.value.split(",").map(x => x.trim().toUpperCase())
    .filter(x => ["A","B","C","D"].includes(x));
}

function updateAnimationOrder() {
  const el = document.getElementById("animationOrder");
  const uploaded = ["A","B","C","D"].filter(k => letters[k].image);
  const current = getOrder("animationOrder");
  const preferred = ["C","B","A","D"];
  const result = [];

  [...current, ...preferred].forEach(k => {
    if (uploaded.includes(k) && !result.includes(k)) result.push(k);
  });
  el.value = result.join(",");
}

function getCompleteAnimationOrder() {
  const uploaded = ["A","B","C","D"].filter(k => letters[k].image);
  const result = [];
  [...getOrder("animationOrder"), ..."CBAD"].forEach(k => {
    if (uploaded.includes(k) && !result.includes(k)) result.push(k);
  });
  return result;
}

/* ---------- SIZE / POSITION ---------- */
document.getElementById("splitRange").addEventListener("input", e => {
  document.getElementById("splitValue").textContent = e.target.value;
  draw();
});
document.getElementById("sizeRange").addEventListener("input", e => {
  document.getElementById("sizeValue").textContent = e.target.value;
  draw();
});

function getImageDrawSize(img) {
  const h = Number(document.getElementById("sizeRange").value);
  const scale = h / img.height;
  return { width: img.width * scale, height: h };
}

function getSlotPosition(key) {
  const available = ["A","B","C","D"].filter(k => letters[k].image);
  const index = available.indexOf(key);
  if (index < 0) return {x:70,y:250};

  const top = 330, bottom = 1450;
  const center = available.length === 1
    ? (top + bottom) / 2
    : top + index * ((bottom-top)/(available.length-1));

  const size = getImageDrawSize(letters[key].image);
  return { x:70, y:center-size.height/2 };
}

/* ---------- DRAW ---------- */
function drawBackground(target=ctx) {
  target.clearRect(0,0,W,H);
  if (!background) {
    target.fillStyle="#101010";
    target.fillRect(0,0,W,H);
    return;
  }
  const scale=Math.max(W/background.width,H/background.height);
  const dw=background.width*scale, dh=background.height*scale;
  target.drawImage(background,(W-dw)/2,(H-dh)/2,dw,dh);
}

function drawStationaryHalf(key,target=ctx) {
  const img=letters[key].image;
  if (!img) return;
  const size=getImageDrawSize(img), pos=getSlotPosition(key);
  const split=Number(document.getElementById("splitRange").value)/100;
  target.drawImage(img,0,0,img.width*split,img.height,
    pos.x,pos.y,size.width*split,size.height);
}

function drawCompletePiece(key,target=ctx) {
  const img=letters[key].image;
  if (!img) return;
  const size=getImageDrawSize(img), pos=getSlotPosition(key);
  target.drawImage(img,pos.x,pos.y,size.width,size.height);
}

function drawMovingHalf(key,x,y,target=ctx) {
  const img=letters[key].image;
  if (!img) return;
  const size=getImageDrawSize(img);
  const split=Number(document.getElementById("splitRange").value)/100;
  target.drawImage(img,img.width*split,0,img.width*(1-split),img.height,
    x,y,size.width*(1-split),size.height);
}

function drawLetters(target=ctx) {
  for (const key of ["A","B","C","D"]) {
    if (!letters[key].image) continue;
    letters[key].fixed
      ? drawCompletePiece(key,target)
      : drawStationaryHalf(key,target);
  }
}

function drawResultIcon(icon,correct,x,y,target=ctx) {
  const size=210;
  if (icon && icon.complete && icon.naturalWidth) {
    target.drawImage(icon,x-size/2,y-size/2,size,size);
  } else {
    target.save();
    target.font=`bold ${size}px Arial`;
    target.textAlign="center";
    target.textBaseline="middle";
    target.fillStyle=correct?"#10d96a":"#ff3030";
    target.fillText(correct?"✓":"✕",x,y);
    target.restore();
  }
}

function draw() {
  drawBackground();
  drawLetters();

  if (currentAnimation) {
    drawMovingHalf(currentAnimation.source,currentAnimation.x,currentAnimation.y);

    if (currentAnimation.result) {
      drawResultIcon(
        currentAnimation.result==="right"?rightIcon:wrongIcon,
        currentAnimation.result==="right",
        currentAnimation.iconX,
        currentAnimation.iconY
      );
    }
  }
}

/* ---------- ANIMATION ---------- */
function getStartPosition(key) {
  const size=getImageDrawSize(letters[key].image);
  const split=Number(document.getElementById("splitRange").value)/100;
  const movingWidth=size.width*(1-split);
  const direction=document.getElementById("direction").value;

  if (direction==="top-right") return {x:W-movingWidth-70,y:100};
  if (direction==="top") return {x:W/2-movingWidth/2,y:70};
  if (direction==="right") return {x:W-movingWidth-50,y:850};
  return {x:30,y:850};
}

function getTargetPosition(target) {
  const img=letters[target].image;
  const size=getImageDrawSize(img);
  const pos=getSlotPosition(target);
  const split=Number(document.getElementById("splitRange").value)/100;
  return {x:pos.x+size.width*split,y:pos.y};
}

function easeInOut(t) {
  return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
}

function animateMove(source,target) {
  return new Promise(resolve => {
    const start=getStartPosition(source), end=getTargetPosition(target);
    const duration=Number(document.getElementById("duration").value);
    const startTime=performance.now();

    function frame(now) {
      if (paused) return requestAnimationFrame(frame);
      const raw=Math.min(1,(now-startTime)/duration);
      const t=easeInOut(raw);

      currentAnimation={
        source,target,
        x:start.x+(end.x-start.x)*t,
        y:start.y+(end.y-start.y)*t,
        result:null,iconX:0,iconY:0
      };
      draw();
      raw<1 ? requestAnimationFrame(frame) : resolve();
    }
    requestAnimationFrame(frame);
  });
}

async function returnToStart(source,target) {
  const start=getStartPosition(source), end=getTargetPosition(target);
  const duration=Number(document.getElementById("duration").value);
  const startTime=performance.now();

  return new Promise(resolve => {
    function frame(now) {
      const raw=Math.min(1,(now-startTime)/duration);
      const t=easeInOut(raw);
      currentAnimation.x=end.x+(start.x-end.x)*t;
      currentAnimation.y=end.y+(start.y-end.y)*t;
      currentAnimation.result=null;
      draw();
      raw<1 ? requestAnimationFrame(frame) : resolve();
    }
    requestAnimationFrame(frame);
  });
}

function playSound(audio) {
  if (!audio) return;
  try {
    audio.currentTime=0;
    audio.play();
  } catch(e) { console.log("Audio:",e); }
}

async function showResult(source,target,correct) {
  const targetImg=letters[target].image;
  const size=getImageDrawSize(targetImg);
  const pos=getSlotPosition(target);

  currentAnimation.result=correct?"right":"wrong";
  currentAnimation.iconX=pos.x+size.width+130;
  currentAnimation.iconY=pos.y+size.height/2;

  playSound(correct?rightAudio:wrongAudio);
  draw();

  await sleep(Number(document.getElementById("pauseDuration").value));
  currentAnimation.result=null;
  draw();
}

function isCorrect(source,target) {
  return !!(rules[source] && rules[source][target]);
}

async function runPiece(source) {
  if (letters[source].fixed) return;

  for (const target of getOrder("targetOrder")) {
    if (letters[target].fixed) continue;

    updateStatus(`${source} → ${target}`,"Moving...");
    await animateMove(source,target);

    const correct=isCorrect(source,target);

    await showResult(source,target,correct);

    if (correct) {
      letters[source].fixed=true;
      createFlow();
      return;
    }

    await returnToStart(source,target);
  }
}

async function runPuzzle() {
  if (animationRunning) return;
  if (!background) return alert("Please upload a background.");

  const available=["A","B","C","D"].filter(k=>letters[k].image);
  if (!available.length) return alert("Please upload at least one PNG.");

  animationRunning=true;
  paused=false;

  for (const k of Object.keys(letters)) letters[k].fixed=false;
  currentAnimation=null;
  draw();

  for (const source of getCompleteAnimationOrder()) {
    if (letters[source].image && !letters[source].fixed) await runPiece(source);
  }

  const complete=available.every(k=>letters[k].fixed);
  updateStatus(
    complete?"PUZZLE COMPLETE!":"PUZZLE ENDED",
    complete?"All uploaded pieces are fixed.":"Some pieces are still unmatched."
  );

  currentAnimation=null;
  draw();
  animationRunning=false;
}

/* ---------- UI ---------- */
function updateStatus(title,message) {
  document.getElementById("statusTitle").textContent=title;
  document.getElementById("statusMessage").textContent=message;
}

function createRulesUI() {
  const container=document.getElementById("rulesContainer");
  const available=["A","B","C","D"].filter(k=>letters[k].image);

  if (!available.length) {
    container.innerHTML="<small>Upload PNGs first.</small>";
    return;
  }

  let html="<table class='rule-table'><tr><th>Source</th>";
  for (const t of available) html+=`<th>${t}</th>`;
  html+="</tr>";

  for (const s of available) {
    html+=`<tr><th>${s}</th>`;
    for (const t of available) {
      const value=rules[s][t];
      html+=`<td><button class="rule-btn ${value?"right":"wrong"}"
        data-source="${s}" data-target="${t}">
        ${value?"✓ RIGHT":"✕ WRONG"}</button></td>`;
    }
    html+="</tr>";
  }
  html+="</table>";
  container.innerHTML=html;

  container.querySelectorAll(".rule-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      rules[btn.dataset.source][btn.dataset.target]=
        !rules[btn.dataset.source][btn.dataset.target];
      createRulesUI();
      createFlow();
    });
  });
}

function createFlow() {
  const container=document.getElementById("flowContainer");
  const order=getCompleteAnimationOrder();

  if (!order.length) {
    container.innerHTML="<small>Upload PNGs first.</small>";
    return;
  }

  container.innerHTML=order.map(s=>`
    <div class="flow-item"><b>${s}</b> → ${getOrder("targetOrder").join(" → ")}</div>
  `).join("");
}

document.getElementById("previewBtn").addEventListener("click",runPuzzle);

document.getElementById("pauseBtn").addEventListener("click",()=>{
  paused=!paused;
  document.getElementById("pauseBtn").textContent=paused?"▶ Resume":"⏸ Pause";
});

document.getElementById("restartBtn").addEventListener("click",()=>{
  animationRunning=false;
  paused=false;
  currentAnimation=null;
  for (const k of Object.keys(letters)) letters[k].fixed=false;
  draw();
  createFlow();
  updateStatus("Ready","Animation restarted.");
});

/* ---------- EXPORT WITH FIXED ICONS + SOUNDS ---------- */
async function exportVideo() {
  if (animationRunning) return alert("Wait until animation finishes.");
  if (!background) return alert("Upload background first.");

  const available=["A","B","C","D"].filter(k=>letters[k].image);
  if (!available.length) return alert("Upload PNG images first.");

  const status=document.getElementById("exportStatus");
  const progress=document.getElementById("progressBar");
  status.textContent="Rendering video...";
  progress.style.width="0%";

  const exportCanvas=document.createElement("canvas");
  exportCanvas.width=W; exportCanvas.height=H;
  const ec=exportCanvas.getContext("2d");

  const stream=exportCanvas.captureStream(30);

  /* Audio is routed into the MediaRecorder stream. */
  const AC=window.AudioContext||window.webkitAudioContext;
  const audioContext=new AC();
  const destination=audioContext.createMediaStreamDestination();

  try {
    const ws=audioContext.createMediaElementSource(wrongAudio);
    ws.connect(destination);
    ws.connect(audioContext.destination);
  } catch(e) { console.log(e); }

  try {
    const rs=audioContext.createMediaElementSource(rightAudio);
    rs.connect(destination);
    rs.connect(audioContext.destination);
  } catch(e) { console.log(e); }

  destination.stream.getAudioTracks().forEach(t=>stream.addTrack(t));

  let mime="video/webm;codecs=vp9,opus";
  if (!MediaRecorder.isTypeSupported(mime)) mime="video/webm;codecs=vp8,opus";
  if (!MediaRecorder.isTypeSupported(mime)) mime="video/webm";

  const recorder=new MediaRecorder(stream,{
    mimeType:mime,
    videoBitsPerSecond:8000000,
    audioBitsPerSecond:128000
  });

  const chunks=[];
  recorder.ondataavailable=e=>{ if(e.data?.size) chunks.push(e.data); };
  const stopped=new Promise(resolve=>recorder.onstop=resolve);
  recorder.start(100);

  for (const k of Object.keys(letters)) letters[k].fixed=false;
  currentAnimation=null;

  function exportFrame() {
    drawBackground(ec);
    drawLetters(ec);

    if (currentAnimation) {
      drawMovingHalf(currentAnimation.source,currentAnimation.x,currentAnimation.y,ec);
      if (currentAnimation.result) {
        drawResultIcon(
          currentAnimation.result==="right"?rightIcon:wrongIcon,
          currentAnimation.result==="right",
          currentAnimation.iconX,
          currentAnimation.iconY,
          ec
        );
      }
    }
  }

  const FPS=30;
  const moveDuration=Number(document.getElementById("duration").value)||1500;
  const holdDuration=Number(document.getElementById("pauseDuration").value)||1000;

  async function move(source,target,reverse=false) {
    const a=reverse?getTargetPosition(target):getStartPosition(source);
    const b=reverse?getStartPosition(source):getTargetPosition(target);
    const frames=Math.max(1,Math.round(moveDuration/1000*FPS));

    for(let i=0;i<=frames;i++){
      const t=easeInOut(i/frames);
      currentAnimation={
        source,target,
        x:a.x+(b.x-a.x)*t,
        y:a.y+(b.y-a.y)*t,
        result:null,iconX:0,iconY:0
      };
      exportFrame();
      await sleep(1000/FPS);
    }
  }

  async function result(source,target,correct) {
    const img=letters[target].image;
    const size=getImageDrawSize(img);
    const pos=getSlotPosition(target);

    currentAnimation.result=correct?"right":"wrong";
    currentAnimation.iconX=pos.x+size.width+130;
    currentAnimation.iconY=pos.y+size.height/2;

    const audio=correct?rightAudio:wrongAudio;

    try {
      await audioContext.resume();
      audio.currentTime=0;
      await audio.play();
    } catch(e) { console.log("Export sound:",e); }

    const frames=Math.max(1,Math.round(holdDuration/1000*FPS));
    for(let i=0;i<frames;i++){
      exportFrame();
      await sleep(1000/FPS);
    }

    currentAnimation.result=null;
    exportFrame();
  }

  const order=getCompleteAnimationOrder();
  let done=0;
  const total=Math.max(1,order.length*3);

  for(const source of order){
    if(!letters[source].image || letters[source].fixed) continue;

    for(const target of getOrder("targetOrder")){
      if(letters[target].fixed) continue;

      await move(source,target,false);
      const correct=isCorrect(source,target);
      await result(source,target,correct);

      if(correct){
        letters[source].fixed=true;
        currentAnimation=null;
        exportFrame();
        break;
      }

      await move(source,target,true);
      done++;
      progress.style.width=Math.min(100,done/total*100)+"%";
    }
  }

  currentAnimation=null;
  exportFrame();
  await sleep(1000);

  recorder.stop();
  await stopped;

  try { await audioContext.close(); } catch(e){}

  const blob=new Blob(chunks,{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="puzzle-video.webm";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),2000);

  progress.style.width="100%";
  status.textContent="Video exported successfully.";
}

document.getElementById("exportBtn").addEventListener("click",exportVideo);

createRulesUI();
createFlow();
draw();
