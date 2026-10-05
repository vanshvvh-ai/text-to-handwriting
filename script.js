// ══════════════════════════════════════════
//  PAGE STORE
// ══════════════════════════════════════════
let manualPages = [
  { label:'Page 1', text:`#include <iostream>\nusing namespace std;\n\nint main() {\n    // BCA Sem 2 - Assignment 3\n    int n, sum = 0;\n    cout << "Enter a number: ";\n    cin >> n;\n    for(int i = 1; i <= n; i++) {\n        sum += i;\n    }\n    cout << "Sum = " << sum << endl;\n    return 0;\n}` }
];
let currentMP = 0; // current manual page index

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
const S = {
  heading:'', stamp:'',
  font:'Caveat', ink:'#1a2e5a',
  paper:'notebook', margin:'single',
  fontSize:22, lineSpacing:42, letterSpacing:1,
  slant:1, wobble:3, errorRate:8,
  errorStyles:new Set(['scribble','strikethrough']),
  correctionShade:'same', rewriteGap:16,
  effPressure:true, effJitter:true, effGrain:true,
  effBleed:false, effScan:false, effSmudge:false,
  pageSize:'a4', quality:1.5, zoom:0.75,
  renderedPages:[[]], currentRP:0
};

const manualErrors = new Map();
let wordHits = [];
let pendingHit = null;

const DIMS = {a4:{w:794,h:1123},letter:{w:816,h:1056},a5:{w:559,h:794}};
const canvas = document.getElementById('hwc');
const ctx = canvas.getContext('2d');

// ══════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════
let isDark = true;
document.getElementById('themeBtn').onclick = () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark?'dark':'light');
  document.getElementById('themeBtn').textContent = isDark?'🌙 Dark':'☀️ Light';
  render();
};

// ══════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════
function sr(seed){const x=Math.sin(Math.abs(seed+1)*127.1)*43758.5453;return x-Math.floor(x);}

function makeTypo(word,seed){
  if(word.length<3)return word+word[word.length-1];
  const l=word.split(''),type=Math.floor(sr(seed*7+3)*5),i=1+Math.floor(sr(seed*13+7)*(l.length-2));
  if(type===0){const j=Math.min(i+1,l.length-1);[l[i],l[j]]=[l[j],l[i]];}
  else if(type===1){l.splice(i,0,l[Math.max(0,i-1)]);}
  else if(type===2){l.splice(i,0,l[i]);}
  else if(type===3){const kb={'a':'s','s':'a','d':'f','f':'d','g':'f','h':'g','j':'h','k':'j','l':'k','q':'w','w':'q','e':'w','r':'e','t':'r','y':'t','u':'y','i':'u','o':'i','p':'o','z':'x','x':'z','c':'x','v':'c','b':'v','n':'b','m':'n'};l[i]=kb[l[i]]||(l[i]===l[i].toUpperCase()?l[i].toLowerCase():l[i].toUpperCase());}
  else{const j=Math.min(i+2,l.length-1);[l[i],l[j]]=[l[j],l[i]];}
  return l.join('');
}

function shadeInk(hex,mode){
  if(mode==='same')return hex;
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  const f=mode==='darker'?0.6:1.45,c=v=>Math.min(255,Math.max(0,Math.round(v*f)));
  return'#'+[c(r),c(g),c(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

// ══════════════════════════════════════════
//  PAPER
// ══════════════════════════════════════════
function drawPaper(W,H){
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  const p=S.paper;
  if(p==='aged'){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#f6e9b4');g.addColorStop(1,'#e8d680');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.strokeStyle='#c5a85870';ctx.lineWidth=1;for(let y=100;y<H;y+=S.lineSpacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  else if(p==='white'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);}
  else if(p==='grid'){ctx.fillStyle='#fdfeff';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#d5eaf8';ctx.lineWidth=0.7;for(let x=0;x<W;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.strokeStyle='#aacce0';ctx.lineWidth=1;for(let x=0;x<W;x+=140){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=140){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  else if(p==='legal'){ctx.fillStyle='#fefeed';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#d0d08880';ctx.lineWidth=1;for(let y=80;y<H;y+=S.lineSpacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}ctx.strokeStyle='#c05050';ctx.lineWidth=1.2;[82,92].forEach(mx=>{ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx,H);ctx.stroke();});}
  else if(p==='rough'){ctx.fillStyle='#f8f6f0';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#dddac0';ctx.lineWidth=0.6;for(let y=0;y<H;y+=22){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}for(let x=0;x<W;x+=22){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}}
  else{ctx.fillStyle='#fefcf9';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#ccd3e0';ctx.lineWidth=1;for(let y=100;y<H;y+=S.lineSpacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}}
  if(S.margin==='single'&&p!=='legal'&&p!=='grid'){ctx.strokeStyle='#cc5555';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(82,0);ctx.lineTo(82,H);ctx.stroke();}
  else if(S.margin==='double'){ctx.strokeStyle='#cc5555';ctx.lineWidth=1.2;[72,84].forEach(mx=>{ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx,H);ctx.stroke();});}
  if(S.effGrain){for(let i=0;i<3500;i++){ctx.globalAlpha=sr(i*9+3)*0.022;ctx.fillStyle='#000';ctx.fillRect(sr(i*9+1)*W,sr(i*9+2)*H,1,1);}ctx.globalAlpha=1;}
  if(S.effSmudge){for(let i=0;i<4;i++){const sx=sr(i*19+1)*W,sy=sr(i*19+2)*H,rad=5+sr(i*19+3)*12;const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,rad);sg.addColorStop(0,'rgba(0,0,0,0.06)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=0.55;ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,rad,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
}

// ══════════════════════════════════════════
//  CROSSOUT
// ══════════════════════════════════════════
function drawCrossout(x,y,word,style,seed,cInk){
  const w=ctx.measureText(word).width,midY=y-S.fontSize*0.33,topY=y-S.fontSize*0.82,botY=y+S.fontSize*0.08;
  ctx.save();ctx.strokeStyle=cInk;
  if(style==='scribble'){const passes=2+Math.floor(sr(seed+77)*2);for(let pass=0;pass<passes;pass++){ctx.globalAlpha=0.65+sr(seed+pass*33)*0.2;ctx.lineWidth=1.3+sr(seed+pass)*0.8;ctx.beginPath();let cx=x-3;ctx.moveTo(cx,midY+(sr(seed+pass*11)-0.5)*5);while(cx<x+w+3){ctx.lineTo(cx,midY+(sr(cx*0.25+seed+pass*44)-0.5)*(S.fontSize*0.75));cx+=2+sr(cx*0.4+seed+pass*88)*4;}ctx.stroke();}}
  else if(style==='strikethrough'){ctx.globalAlpha=0.82;ctx.lineWidth=1.7+sr(seed)*0.5;ctx.beginPath();ctx.moveTo(x-2,midY+(sr(seed)-0.5)*2);for(let i=1;i<=6;i++)ctx.lineTo(x-2+(w+4)*(i/6),midY+(sr(seed+i*13)-0.5)*2.5);ctx.stroke();}
  else if(style==='overX'){ctx.globalAlpha=0.75;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x-2,topY+(sr(seed)-0.5)*3);ctx.lineTo(x+w+2,botY+(sr(seed+1)-0.5)*3);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w+2,topY+(sr(seed+2)-0.5)*3);ctx.lineTo(x-2,botY+(sr(seed+3)-0.5)*3);ctx.stroke();}
  else if(style==='waveline'){ctx.globalAlpha=0.75;ctx.lineWidth=1.4;ctx.beginPath();let wvx=x-2;ctx.moveTo(wvx,midY);while(wvx<x+w+2){const nx=Math.min(wvx+7,x+w+2);ctx.quadraticCurveTo(wvx+3.5,midY+(sr(wvx*0.5+seed)-0.5)*9,nx,midY+(sr(wvx*0.5+seed+50)-0.5)*4);wvx=nx;}ctx.stroke();}
  else if(style==='bracket'){ctx.globalAlpha=0.72;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+3,topY);ctx.lineTo(x-4,topY);ctx.lineTo(x-4,botY);ctx.lineTo(x+3,botY);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w-3,topY);ctx.lineTo(x+w+4,topY);ctx.lineTo(x+w+4,botY);ctx.lineTo(x+w-3,botY);ctx.stroke();}
  ctx.restore();
}

// ══════════════════════════════════════════
//  RENDER WORD
// ══════════════════════════════════════════
function renderWord(startX,baseY,word,ink,seed,aScale){
  ctx.fillStyle=ink;ctx.font=`${S.fontSize}px '${S.font}', cursive`;
  let cx=startX;
  for(let ci=0;ci<word.length;ci++){
    const ch=word[ci],cseed=seed*500+ci+1,chW=ctx.measureText(ch).width+S.letterSpacing*0.3;
    const alpha=(S.effPressure?0.76+sr(cseed)*0.24:0.92)*aScale;
    const rot=(S.slant/180)*Math.PI+(S.effJitter?(sr(cseed+5)-0.5)*0.03:0);
    const jit=S.effJitter?(sr(cseed+10)-0.5)*1.3:0;
    if(S.effBleed){ctx.shadowBlur=1.4;ctx.shadowColor=ink+'55';}
    ctx.globalAlpha=Math.min(1,alpha);
    ctx.save();ctx.translate(cx,baseY+jit);ctx.rotate(rot);ctx.fillText(ch,0,0);ctx.restore();
    cx+=chW;
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;return cx;
}

// ══════════════════════════════════════════
//  WRAP LINE
// ══════════════════════════════════════════
function wrapLine(line,startX,maxX,lIdx){
  ctx.font=`${S.fontSize}px '${S.font}', cursive`;
  const spW=ctx.measureText(' ').width;
  const indM=line.match(/^(\s+)/);let indent=0;
  if(indM){const tabs=(indM[0].match(/\t/g)||[]).length,spaces=indM[0].replace(/\t/g,'').length;indent=tabs*26+spaces*7;}
  const words=line.trimStart().split(' '),vLines=[],curr={words:[],indent};let curX=startX+indent;
  words.forEach((word,wIdx)=>{
    if(!word){curr.words.push({word:'',wIdx});curX+=spW;return;}
    const wW=ctx.measureText(word).width;
    if(curX+wW>maxX&&curr.words.length>0){vLines.push({words:[...curr.words],indent:curr.indent,lIdx});curr.words=[{word,wIdx}];curr.indent=0;curX=startX+wW+spW;}
    else{curr.words.push({word,wIdx});curX+=wW+spW;}
  });
  vLines.push({words:[...curr.words],indent:curr.indent,lIdx});
  return vLines;
}

// ══════════════════════════════════════════
//  PAGINATE
// ══════════════════════════════════════════
function paginate(){
  const {w:W,h:H}=DIMS[S.pageSize];
  const startX=S.margin!=='none'?100:42,maxX=W-35;
  const startY=S.heading?132:100,maxY=H-50;
  const maxLinesPerPage=Math.floor((maxY-startY)/S.lineSpacing);

  const text=manualPages[currentMP]?.text||'';
  const rawLines=text.split('\n');

  // Build all visual lines with wrap
  const allVL=[];
  rawLines.forEach((line,lIdx)=>wrapLine(line,startX,maxX,lIdx).forEach(vl=>allVL.push(vl)));

  // If all visual lines fit on one rendered page — simple case, no overflow
  if(allVL.length<=maxLinesPerPage){
    S.renderedPages=[allVL];
    S.currentRP=0;
  } else {
    // Only take first page worth of lines for this manual page
    // Overflow lines get converted back to text and pushed to next manual page
    const thisPageLines=allVL.slice(0,maxLinesPerPage);
    S.renderedPages=[thisPageLines];
    S.currentRP=0;

    // Figure out which raw line index the overflow starts at
    const lastVL=thisPageLines[thisPageLines.length-1];
    const overflowLIdx=lastVL?lastVL.lIdx+1:0;
    const overflowText=rawLines.slice(overflowLIdx).join('\n');

    if(overflowText.trim()){
      // Check if a next manual page exists
      if(currentMP+1>=manualPages.length){
        // Auto-create next page for overflow
        manualPages.push({
          label:`Page ${manualPages.length+1}`,
          text: overflowText
        });
        renderPageUI();
      } else {
        // Prepend overflow to existing next page
        // Only if next page doesn't already start with this overflow (avoid duplication)
        const nextText=manualPages[currentMP+1].text||'';
        if(!nextText.startsWith(overflowText.slice(0,30))){
          manualPages[currentMP+1].text=overflowText+
            (nextText?'\n'+nextText:'');
          // Update textarea if next page is currently active
          if(currentMP+1===currentMP){
            document.getElementById('userText').value=manualPages[currentMP+1].text;
          }
        }
      }
    }
  }

  const wc=text.split(/\s+/).filter(Boolean).length;
  document.getElementById('pageInfo').innerHTML=
    `Manual pages: ${manualPages.length}<br>Rendered: ${S.renderedPages.length}<br>Words: ${wc}<br>Lines: ${rawLines.length}`;
  updateCounters();render();
}

// ══════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════
function render(){
  const {w:W,h:H}=DIMS[S.pageSize];
  canvas.width=W;canvas.height=H;wordHits=[];
  drawPaper(W,H);ctx.globalAlpha=1;
  const startX=S.margin!=='none'?100:42;let y=S.heading?132:100;
  if(S.heading||S.stamp){
    ctx.save();ctx.font=`italic ${S.fontSize+3}px '${S.font}', cursive`;ctx.fillStyle=S.ink;ctx.globalAlpha=0.87;
    if(S.heading)ctx.fillText(S.heading,startX,66);
    if(S.stamp){ctx.font=`${S.fontSize-3}px '${S.font}', cursive`;const sw=ctx.measureText(S.stamp).width;ctx.fillText(S.stamp,W-sw-28,66);}
    ctx.strokeStyle=S.ink;ctx.lineWidth=0.8;ctx.globalAlpha=0.3;ctx.beginPath();ctx.moveTo(startX,76);ctx.lineTo(W-28,76);ctx.stroke();ctx.restore();
  }
  const pageData=S.renderedPages[S.currentRP]||[];
  const errStyles=[...S.errorStyles],corrInk=shadeInk(S.ink,S.correctionShade);
  const COMMON=new Set(['the','and','or','in','to','of','a','is','for','on','with','at','by','this','it','be','are','was','has','have','an','as','from','not','that']);
  pageData.forEach((vl,vlIdx)=>{
    ctx.font=`${S.fontSize}px '${S.font}', cursive`;
    const spW=ctx.measureText(' ').width,drift=S.wobble>0?(sr(vlIdx*71+S.currentRP*317)-0.5)*S.wobble:0;
    let x=startX+vl.indent;
    vl.words.forEach(({word,wIdx})=>{
      if(!word){x+=spW;return;}
      ctx.font=`${S.fontSize}px '${S.font}', cursive`;
      const seed=(currentMP+1)*1001+(S.currentRP+1)*91+(vl.lIdx+1)*37+(wIdx+1)*17;
      const wKey=`${currentMP}:${S.currentRP}:${vl.lIdx}:${wIdx}`;
      const me=manualErrors.get(wKey);
      const autoErr=!me&&errStyles.length>0&&sr(seed)<(S.errorRate/100)&&word.length>3&&!COMMON.has(word.toLowerCase());
      const isErr=!!me||autoErr,wordW=ctx.measureText(word).width;
      wordHits.push({x,y:y+drift-S.fontSize*0.88,w:wordW,h:S.fontSize*1.15,pid:currentMP,rpid:S.currentRP,lid:vl.lIdx,wid:wIdx,word});
      if(isErr){
        const typo=makeTypo(word,seed),typoW=ctx.measureText(typo).width;
        const style=me?me.style:errStyles[Math.floor(sr(seed+99)*errStyles.length)];
        renderWord(x,y+drift,typo,S.ink,seed+1000,0.48);
        drawCrossout(x,y+drift,typo,style,seed,corrInk);
        const endX=renderWord(x+typoW+S.rewriteGap,y+drift,word,corrInk,seed+2000,1.0);
        x=endX+spW;
      }else{
        const endX=renderWord(x,y+drift,word,S.ink,seed,1.0);
        x=endX+spW+S.letterSpacing*0.3;
      }
    });
    y+=S.lineSpacing;
  });
  if(S.effScan){const sg=ctx.createLinearGradient(0,0,0,H);for(let i=0;i<60;i++)sg.addColorStop(i/60,`rgba(0,0,0,${i%2===0?0.015:0})`);ctx.globalAlpha=1;ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);}
  document.getElementById('cshad').style.transform=`scale(${S.zoom})`;
  document.getElementById('cshad').style.transformOrigin='top center';
}

// ══════════════════════════════════════════
//  PAGE MANAGER — both strip + list
// ══════════════════════════════════════════
function renderPageUI(){
  // Strip (top of sidebar — always visible)
  const strip=document.getElementById('pageStrip');
  strip.innerHTML='';
  manualPages.forEach((pg,idx)=>{
    const btn=document.createElement('button');
    btn.className='ps-tab'+(idx===currentMP?' active':'');
    btn.textContent=pg.label||`Page ${idx+1}`;
    btn.onclick=()=>switchToPage(idx);
    strip.appendChild(btn);
  });
  const addBtn=document.createElement('button');
  addBtn.className='ps-add';addBtn.textContent='+ Add';
  addBtn.onclick=addPage;strip.appendChild(addBtn);

  // Full list in PAGES tab
  const list=document.getElementById('pmList');
  list.innerHTML='';
  manualPages.forEach((pg,idx)=>{
    const row=document.createElement('div');
    row.className='pm-row'+(idx===currentMP?' active-page':'');

    const num=document.createElement('div');num.className='pm-num';num.textContent=idx+1;

    const inp=document.createElement('input');
    inp.className='pm-label-input';inp.value=pg.label||`Page ${idx+1}`;
    inp.placeholder=`Page ${idx+1}`;
    inp.onclick=e=>e.stopPropagation();
    inp.oninput=function(){
      manualPages[idx].label=this.value||`Page ${idx+1}`;
      // Update strip button text live
      const stripBtns=document.querySelectorAll('.ps-tab');
      if(stripBtns[idx])stripBtns[idx].textContent=manualPages[idx].label;
      updateCounters();
    };

    const wc=(pg.text||'').split(/\s+/).filter(Boolean).length;
    const sub=document.createElement('div');sub.className='pm-sub';sub.textContent=`${wc}w`;

    const del=document.createElement('button');
    del.className='pm-del';del.textContent='✕';del.title='Delete';
    del.onclick=e=>{
      e.stopPropagation();
      if(manualPages.length===1){return;}
      manualPages.splice(idx,1);
      if(currentMP>=manualPages.length)currentMP=manualPages.length-1;
      syncTA();renderPageUI();paginate();
    };

    row.appendChild(num);row.appendChild(inp);row.appendChild(sub);row.appendChild(del);
    row.onclick=()=>switchToPage(idx);
    list.appendChild(row);
  });

  document.getElementById('pmCount').textContent=`${manualPages.length} page${manualPages.length>1?'s':''}`;
}

function switchToPage(idx){
  manualPages[currentMP].text=document.getElementById('userText').value;
  currentMP=idx;S.currentRP=0;
  syncTA();renderPageUI();paginate();
}

function addPage(){
  manualPages[currentMP].text=document.getElementById('userText').value;
  manualPages.push({label:`Page ${manualPages.length+1}`,text:''});
  currentMP=manualPages.length-1;S.currentRP=0;
  syncTA();renderPageUI();paginate();
  // Switch to text tab
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tp').forEach(x=>x.classList.remove('active'));
  document.querySelector('[data-tab="text"]').classList.add('active');
  document.getElementById('tab-text').classList.add('active');
}

document.getElementById('pmAdd').onclick=addPage;

function syncTA(){document.getElementById('userText').value=manualPages[currentMP]?.text||'';}

function updateCounters(){
  const lbl=manualPages[currentMP]?.label||`Page ${currentMP+1}`;
  // Global position = sum of all rendered pages before current manual page + current rendered page
  // For display we show: manual page position / total manual pages
  // and sub-page info separately in the label badge
  const totalManual=manualPages.length;
  const subTotal=S.renderedPages.length;
  const subCurrent=S.currentRP+1;
  // Counter shows: manual page X of Y  (sub-page if more than 1 rendered page)
  const subInfo=subTotal>1?` (${subCurrent}/${subTotal})`:'';
  document.getElementById('pageCounter').textContent=`PAGE ${currentMP+1} / ${totalManual}${subInfo}`;
  document.getElementById('pageLabel').textContent=lbl;
  document.getElementById('footInfo').textContent=`${lbl}${subTotal>1?` • sub ${subCurrent}/${subTotal}`:''}`;
}

// ══════════════════════════════════════════
//  CANVAS CLICK → style picker
// ══════════════════════════════════════════
canvas.addEventListener('click',e=>{
  e.stopPropagation();
  const rect=canvas.getBoundingClientRect();
  const cx=(e.clientX-rect.left)*(canvas.width/rect.width);
  const cy=(e.clientY-rect.top)*(canvas.height/rect.height);
  const pad=8;let hit=null;
  for(const wh of wordHits){if(cx>=wh.x-pad&&cx<=wh.x+wh.w+pad&&cy>=wh.y-pad&&cy<=wh.y+wh.h+pad){hit=wh;break;}}
  if(hit)showPicker(hit,e.clientX,e.clientY);
});

const picker=document.getElementById('stylePicker');
function showPicker(hit,sx,sy){
  pendingHit=hit;
  document.getElementById('spWord').textContent=`"${hit.word}"`;
  const ex=manualErrors.get(`${hit.pid}:${hit.rpid}:${hit.lid}:${hit.wid}`);
  document.querySelectorAll('.sp-opt').forEach(b=>b.classList.toggle('selected',ex&&ex.style===b.dataset.style));
  picker.style.display='flex';
  let px=sx+12,py=sy-20;
  if(px+200>window.innerWidth)px=sx-212;
  if(py+260>window.innerHeight)py=window.innerHeight-270;
  picker.style.left=px+'px';picker.style.top=py+'px';
}
function hidePicker(){picker.style.display='none';pendingHit=null;}
document.querySelectorAll('.sp-opt').forEach(btn=>btn.onclick=()=>{
  if(!pendingHit)return;
  const key=`${pendingHit.pid}:${pendingHit.rpid}:${pendingHit.lid}:${pendingHit.wid}`;
  const ex=manualErrors.get(key);
  if(ex&&ex.style===btn.dataset.style)manualErrors.delete(key);
  else manualErrors.set(key,{word:pendingHit.word,style:btn.dataset.style});
  hidePicker();updateTagUI();render();
});
document.getElementById('spCancel').onclick=hidePicker;
document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePicker();});
document.addEventListener('click',e=>{if(!picker.contains(e.target)&&e.target!==canvas)hidePicker();});

function updateTagUI(){
  const tw=document.getElementById('taggedWords'),tc=document.getElementById('tagCount');
  if(manualErrors.size===0){tw.innerHTML='<span style="font-size:.66rem;color:var(--text3);">None yet — click any word on canvas</span>';}
  else{tw.innerHTML='';manualErrors.forEach(({word,style},key)=>{const el=document.createElement('div');el.className='tw';el.textContent=`${word} (${style.replace('strikethrough','strike').replace('scribble','scrib').replace('waveline','wave').replace('bracket','brckt')})`;el.onclick=()=>{manualErrors.delete(key);updateTagUI();render();};tw.appendChild(el);});}
  tc.textContent=`${manualErrors.size} tagged`;
}
document.getElementById('clearTags').onclick=()=>{manualErrors.clear();updateTagUI();render();};

// ══════════════════════════════════════════
//  UI BINDINGS
// ══════════════════════════════════════════
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tp').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');document.getElementById('tab-'+t.dataset.tab).classList.add('active');
});
document.getElementById('userText').oninput=function(){manualPages[currentMP].text=this.value;paginate();};
document.getElementById('headingText').oninput=function(){S.heading=this.value;render();};
document.getElementById('stampText').oninput=function(){S.stamp=this.value;render();};
document.getElementById('fontSelect').onchange=function(){
  S.font=this.value;document.getElementById('statusTxt').textContent='Loading font…';
  document.fonts.load(`${S.fontSize}px '${S.font}'`).then(()=>{paginate();document.getElementById('statusTxt').textContent='Ready';})
  .catch(()=>setTimeout(()=>{paginate();document.getElementById('statusTxt').textContent='Ready';},900));
};
document.getElementById('inkColor').oninput=function(){S.ink=this.value;render();};
document.querySelectorAll('[data-ink]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-ink]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.ink=el.dataset.ink;document.getElementById('inkColor').value=S.ink;render();});
document.querySelectorAll('[data-paper]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-paper]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.paper=el.dataset.paper;render();});
document.querySelectorAll('[data-margin]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-margin]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.margin=el.dataset.margin;render();});
document.querySelectorAll('[data-size]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-size]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.pageSize=el.dataset.size;paginate();});
document.querySelectorAll('[data-quality]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-quality]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.quality=parseFloat(el.dataset.quality);});
document.querySelectorAll('[data-cshade]').forEach(el=>el.onclick=()=>{document.querySelectorAll('[data-cshade]').forEach(e=>e.classList.remove('active'));el.classList.add('active');S.correctionShade=el.dataset.cshade;render();});
[['rFontSize','vFontSize',v=>{S.fontSize=+v;return v;},paginate],['rLineSpacing','vLineSpacing',v=>{S.lineSpacing=+v;return v;},paginate],['rLetterSpacing','vLetterSpacing',v=>{S.letterSpacing=+v;return v;},render],['rSlant','vSlant',v=>{S.slant=+v;return v+'°';},render],['rWobble','vWobble',v=>{S.wobble=+v;return v;},render],['rErrorRate','vErrorRate',v=>{S.errorRate=+v;return v+'%';},render],['rRewriteGap','vRewriteGap',v=>{S.rewriteGap=+v;return v+'px';},render]].forEach(([id,vid,setter,action])=>{const el=document.getElementById(id),vel=document.getElementById(vid);el.oninput=function(){vel.textContent=setter(this.value);action();};});
document.querySelectorAll('[data-err]').forEach(el=>el.onclick=()=>{const k=el.dataset.err;if(S.errorStyles.has(k)){if(S.errorStyles.size>1){S.errorStyles.delete(k);el.classList.remove('active');}}else{S.errorStyles.add(k);el.classList.add('active');}render();});
['effPressure','effJitter','effGrain','effBleed','effScan','effSmudge'].forEach(id=>{document.getElementById(id).onchange=function(){S[id]=this.checked;render();};});

document.getElementById('prevBtn').onclick=()=>{
  if(S.currentRP>0){S.currentRP--;updateCounters();render();}
  else if(currentMP>0){manualPages[currentMP].text=document.getElementById('userText').value;currentMP--;syncTA();renderPageUI();S.currentRP=0;paginate();S.currentRP=S.renderedPages.length-1;updateCounters();render();}
};
document.getElementById('nextBtn').onclick=()=>{
  if(S.currentRP<S.renderedPages.length-1){S.currentRP++;updateCounters();render();}
  else if(currentMP<manualPages.length-1){manualPages[currentMP].text=document.getElementById('userText').value;currentMP++;syncTA();renderPageUI();S.currentRP=0;paginate();}
};

let zoom=0.75;
const setZoom=z=>{zoom=Math.min(2,Math.max(0.3,z));S.zoom=zoom;document.getElementById('zoomLbl').textContent=Math.round(zoom*100)+'%';document.getElementById('cshad').style.transform=`scale(${zoom})`;};
document.getElementById('zoomIn').onclick=()=>setZoom(zoom+0.1);
document.getElementById('zoomOut').onclick=()=>setZoom(zoom-0.1);

// ══════════════════════════════════════════
//  EXPORT
//  ZIP fix: build images first, then zip — avoids
//  antivirus false-positives from streaming blobs
// ══════════════════════════════════════════
function renderPageToDataURL(mpIdx, rpIdx) {
  const origMP = currentMP, origRP = S.currentRP;
  const origText = manualPages[currentMP].text;
  if(mpIdx !== currentMP){
    currentMP = mpIdx;
    document.getElementById('userText').value = manualPages[currentMP].text;
    paginate();
  }
  S.currentRP = rpIdx;
  render();

  // Fix: explicitly use full page dimensions, not canvas.width/height
  const q = Math.max(S.quality, 1.5);
  const { w:W, h:H } = DIMS[S.pageSize];
  const ec = document.createElement('canvas');
  ec.width  = W * q;
  ec.height = H * q;
  const ec2 = ec.getContext('2d');
  ec2.imageSmoothingEnabled = true;
  ec2.imageSmoothingQuality = 'high';
  // Draw full canvas dimensions explicitly
  ec2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, W*q, H*q);
  const dataURL = ec.toDataURL('image/png');

  currentMP = origMP;
  document.getElementById('userText').value = origText;
  S.currentRP = origRP;
  paginate();
  return dataURL;
}

// dataURL → Uint8Array (strips "data:image/png;base64," prefix)
function dataURLtoBytes(dataURL){
  const base64=dataURL.split(',')[1];
  const bin=atob(base64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return bytes;
}

document.getElementById('dlPNG').onclick=()=>{
  document.getElementById('statusTxt').textContent='Exporting…';
  setTimeout(()=>{
    const dataURL=renderPageToDataURL(currentMP,S.currentRP);
    const a=document.createElement('a');
    const lbl=(manualPages[currentMP]?.label||'page').replace(/\s+/g,'_');
    a.download=`${lbl}_p${S.currentRP+1}.png`;
    a.href=dataURL;a.click();
    document.getElementById('statusTxt').textContent='Done!';
    setTimeout(()=>document.getElementById('statusTxt').textContent='Ready',2000);
  },50);
};

document.getElementById('dlAllPNG').onclick=()=>{
  document.getElementById('statusTxt').textContent='Loading JSZip…';
  // Load JSZip from CDN
  if(window.JSZip){doZip();}
  else{
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload=doZip;
    document.head.appendChild(s);
  }
};

async function doZip(){
  // Save current page text
  manualPages[currentMP].text=document.getElementById('userText').value;

  document.getElementById('statusTxt').textContent='Rendering pages…';

  // Step 1: collect ALL page data URLs first (no JSZip yet)
  const files=[];
  for(let mi=0;mi<manualPages.length;mi++){
    // switch to this manual page to find out how many rendered pages it has
    const origMP=currentMP;currentMP=mi;
    document.getElementById('userText').value=manualPages[mi].text;
    paginate();
    const rCount=S.renderedPages.length;
    for(let ri=0;ri<rCount;ri++){
      S.currentRP=ri;render();
      const q=S.quality,{w:W,h:H}=DIMS[S.pageSize];
      const ec=document.createElement('canvas');ec.width=W*q;ec.height=H*q;
      const ec2=ec.getContext('2d');
      ec2.imageSmoothingEnabled=true;ec2.imageSmoothingQuality='high';
      ec2.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,W*q,H*q);
    //   const ec=document.createElement('canvas');ec.width=W*q;ec.height=H*q;
    //   const ec2=ec.getContext('2d');ec2.drawImage(canvas,0,0,W*q,H*q);
      const dataURL=ec.toDataURL('image/png');
      const lbl=(manualPages[mi].label||`Page${mi+1}`).replace(/\s+/g,'_');
      const num=String(files.length+1).padStart(2,'0');
      files.push({name:`${num}_${lbl}_p${ri+1}.png`,dataURL});
      document.getElementById('statusTxt').textContent=`Rendered ${files.length}…`;
    }
    currentMP=origMP;
  }

  // Restore to original page
  currentMP=0;
  document.getElementById('userText').value=manualPages[0].text;
  S.currentRP=0;paginate();

  // Step 2: build ZIP from collected data
  document.getElementById('statusTxt').textContent='Building ZIP…';
  const zip=new JSZip();
  files.forEach(f=>{
    // Convert dataURL to bytes without blob — avoids antivirus triggers
    zip.file(f.name, dataURLtoBytes(f.dataURL));
  });

  // Step 3: generate and download
  const content=await zip.generateAsync({
    type:'uint8array',
    compression:'DEFLATE',
    compressionOptions:{level:6}
  });

  // Create a clean object URL from the uint8array
  const blob=new Blob([content],{type:'application/zip'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='assignment_pages.zip';
  document.body.appendChild(a);
  a.click();
  // Revoke after short delay
  setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},3000);

  document.getElementById('statusTxt').textContent=`${files.length} pages exported!`;
  setTimeout(()=>document.getElementById('statusTxt').textContent='Ready',3000);
}

document.getElementById('copyB64').onclick=()=>{
  navigator.clipboard.writeText(canvas.toDataURL()).then(()=>{
    document.getElementById('statusTxt').textContent='Copied!';
    setTimeout(()=>document.getElementById('statusTxt').textContent='Ready',2000);
  });
};

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.onload=()=>{
  syncTA();renderPageUI();
  const fonts=['Caveat','Kalam','Patrick Hand','Indie Flower','Handlee','Covered By Your Grace','Just Another Hand','Reenie Beanie','Coming Soon','Architects Daughter','Shadows Into Light Two'];
  document.fonts.ready.then(()=>{
    Promise.all(fonts.map(f=>document.fonts.load(`22px '${f}'`))).then(()=>{
      document.getElementById('statusTxt').textContent='Ready';paginate();
    });
  });
  setTimeout(()=>{if(document.getElementById('statusTxt').textContent!=='Ready'){document.getElementById('statusTxt').textContent='Ready';paginate();}},2800);
};

// ══════════════════════════════════════════
//  OFFSCREEN DRAW HELPERS FOR PDF EXPORT
//  Draw to any ctx — completely independent
//  of the main canvas and its zoom state
// ══════════════════════════════════════════
function drawPaperToCtx(c, W, H) {
  c.globalAlpha = 1; c.shadowBlur = 0;
  const p = S.paper;
  if (p === 'aged') {
    const g = c.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#f6e9b4'); g.addColorStop(1,'#e8d680');
    c.fillStyle = g; c.fillRect(0,0,W,H);
    c.strokeStyle = '#c5a85870'; c.lineWidth = 1;
    for (let y=100; y<H; y+=S.lineSpacing) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
  } else if (p === 'white') {
    c.fillStyle = '#ffffff'; c.fillRect(0,0,W,H);
  } else if (p === 'grid') {
    c.fillStyle = '#fdfeff'; c.fillRect(0,0,W,H);
    c.strokeStyle = '#d5eaf8'; c.lineWidth = 0.7;
    for (let x=0; x<W; x+=28) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
    for (let y=0; y<H; y+=28) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    c.strokeStyle = '#aacce0'; c.lineWidth = 1;
    for (let x=0; x<W; x+=140) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
    for (let y=0; y<H; y+=140) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
  } else if (p === 'legal') {
    c.fillStyle = '#fefeed'; c.fillRect(0,0,W,H);
    c.strokeStyle = '#d0d08880'; c.lineWidth = 1;
    for (let y=80; y<H; y+=S.lineSpacing) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    c.strokeStyle = '#c05050'; c.lineWidth = 1.2;
    [82,92].forEach(mx => { c.beginPath(); c.moveTo(mx,0); c.lineTo(mx,H); c.stroke(); });
  } else if (p === 'rough') {
    c.fillStyle = '#f8f6f0'; c.fillRect(0,0,W,H);
    c.strokeStyle = '#dddac0'; c.lineWidth = 0.6;
    for (let y=0; y<H; y+=22) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    for (let x=0; x<W; x+=22) { c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
  } else {
    c.fillStyle = '#fefcf9'; c.fillRect(0,0,W,H);
    c.strokeStyle = '#ccd3e0'; c.lineWidth = 1;
    for (let y=100; y<H; y+=S.lineSpacing) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
  }
  if (S.margin === 'single' && p !== 'legal' && p !== 'grid') {
    c.strokeStyle = '#cc5555'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(82,0); c.lineTo(82,H); c.stroke();
  } else if (S.margin === 'double') {
    c.strokeStyle = '#cc5555'; c.lineWidth = 1.2;
    [72,84].forEach(mx => { c.beginPath(); c.moveTo(mx,0); c.lineTo(mx,H); c.stroke(); });
  }
  if (S.effGrain) {
    for (let i=0; i<3500; i++) {
      c.globalAlpha = sr(i*9+3)*0.022;
      c.fillStyle = '#000';
      c.fillRect(sr(i*9+1)*W, sr(i*9+2)*H, 1, 1);
    }
    c.globalAlpha = 1;
  }
}

function drawPageTextToCtx(c, W, H, pageData, mpIdx, rpIdx) {
  c.globalAlpha = 1;
  const startX = S.margin !== 'none' ? 100 : 42;
  let y = S.heading ? 132 : 100;

  // Heading + stamp
  if (S.heading || S.stamp) {
    c.save();
    c.font = `italic ${S.fontSize+3}px '${S.font}', cursive`;
    c.fillStyle = S.ink; c.globalAlpha = 0.87;
    if (S.heading) c.fillText(S.heading, startX, 66);
    if (S.stamp) {
      c.font = `${S.fontSize-3}px '${S.font}', cursive`;
      const sw = c.measureText(S.stamp).width;
      c.fillText(S.stamp, W-sw-28, 66);
    }
    c.strokeStyle = S.ink; c.lineWidth = 0.8; c.globalAlpha = 0.3;
    c.beginPath(); c.moveTo(startX,76); c.lineTo(W-28,76); c.stroke();
    c.restore();
  }

  const errStyles = [...S.errorStyles];
  const corrInk = shadeInk(S.ink, S.correctionShade);
  const COMMON = new Set(['the','and','or','in','to','of','a','is','for','on',
    'with','at','by','this','it','be','are','was','has','have','an','as','from','not','that']);

  pageData.forEach((vl, vlIdx) => {
    c.font = `${S.fontSize}px '${S.font}', cursive`;
    const spW = c.measureText(' ').width;
    const drift = S.wobble > 0 ? (sr(vlIdx*71 + rpIdx*317) - 0.5) * S.wobble : 0;
    let x = startX + vl.indent;

    vl.words.forEach(({word, wIdx}) => {
      if (!word) { x += spW; return; }
      c.font = `${S.fontSize}px '${S.font}', cursive`;
      const seed = (mpIdx+1)*1001 + (rpIdx+1)*91 + (vl.lIdx+1)*37 + (wIdx+1)*17;
      const wKey = `${mpIdx}:${rpIdx}:${vl.lIdx}:${wIdx}`;
      const me = manualErrors.get(wKey);
      const autoErr = !me && errStyles.length > 0 && sr(seed) < (S.errorRate/100)
        && word.length > 3 && !COMMON.has(word.toLowerCase());
      const isErr = !!me || autoErr;
      const wordW = c.measureText(word).width;

      if (isErr) {
        const typo = makeTypo(word, seed);
        const typoW = c.measureText(typo).width;
        const style = me ? me.style : errStyles[Math.floor(sr(seed+99)*errStyles.length)];

        // Draw typo dim
        c.fillStyle = S.ink; c.globalAlpha = 0.48;
        let cx2 = x;
        for (const ch of typo) {
          const chW = c.measureText(ch).width + S.letterSpacing*0.3;
          const rot = (S.slant/180)*Math.PI + (S.effJitter?(sr(cx2*0.1+seed)-0.5)*0.03:0);
          c.save(); c.translate(cx2, y+drift); c.rotate(rot); c.fillText(ch,0,0); c.restore();
          cx2 += chW;
        }

        // Crossout on typo
        c.save(); c.strokeStyle = corrInk;
        const midY = y+drift - S.fontSize*0.33;
        if (style === 'scribble') {
          const passes = 2+Math.floor(sr(seed+77)*2);
          for (let pass=0; pass<passes; pass++) {
            c.globalAlpha = 0.65+sr(seed+pass*33)*0.2;
            c.lineWidth = 1.3+sr(seed+pass)*0.8;
            c.beginPath(); let ccx=x-3; c.moveTo(ccx, midY+(sr(seed+pass*11)-0.5)*5);
            while(ccx<x+typoW+3){c.lineTo(ccx,midY+(sr(ccx*0.25+seed+pass*44)-0.5)*(S.fontSize*0.75));ccx+=2+sr(ccx*0.4+seed+pass*88)*4;}
            c.stroke();
          }
        } else if (style === 'strikethrough') {
          c.globalAlpha=0.82; c.lineWidth=1.7+sr(seed)*0.5;
          c.beginPath(); c.moveTo(x-2,midY);
          for(let i=1;i<=6;i++) c.lineTo(x-2+(typoW+4)*(i/6),midY+(sr(seed+i*13)-0.5)*2.5);
          c.stroke();
        } else if (style === 'overX') {
          c.globalAlpha=0.75; c.lineWidth=1.6;
          const tY=y+drift-S.fontSize*0.82, bY=y+drift+S.fontSize*0.08;
          c.beginPath();c.moveTo(x-2,tY);c.lineTo(x+typoW+2,bY);c.stroke();
          c.beginPath();c.moveTo(x+typoW+2,tY);c.lineTo(x-2,bY);c.stroke();
        } else if (style === 'waveline') {
          c.globalAlpha=0.75; c.lineWidth=1.4;
          c.beginPath(); let wvx=x-2; c.moveTo(wvx,midY);
          while(wvx<x+typoW+2){const nx=Math.min(wvx+7,x+typoW+2);c.quadraticCurveTo(wvx+3.5,midY+(sr(wvx*0.5+seed)-0.5)*9,nx,midY+(sr(wvx*0.5+seed+50)-0.5)*4);wvx=nx;}
          c.stroke();
        } else if (style === 'bracket') {
          c.globalAlpha=0.72; c.lineWidth=1.5;
          const tY=y+drift-S.fontSize*0.82,bY=y+drift+S.fontSize*0.08;
          c.beginPath();c.moveTo(x+3,tY);c.lineTo(x-4,tY);c.lineTo(x-4,bY);c.lineTo(x+3,bY);c.stroke();
          c.beginPath();c.moveTo(x+typoW-3,tY);c.lineTo(x+typoW+4,tY);c.lineTo(x+typoW+4,bY);c.lineTo(x+typoW-3,bY);c.stroke();
        }
        c.restore();

        // Correct word after gap
        c.fillStyle = corrInk; c.globalAlpha = 1;
        let rwx = x + typoW + S.rewriteGap;
        for (const ch of word) {
          const chW = c.measureText(ch).width + S.letterSpacing*0.3;
          const rot = (S.slant/180)*Math.PI + (S.effJitter?(sr(seed+ch.charCodeAt(0))-0.5)*0.03:0);
          const jit = S.effJitter ? (sr(seed+ch.charCodeAt(0)+10)-0.5)*1.3 : 0;
          c.save(); c.translate(rwx, y+drift+jit); c.rotate(rot); c.fillText(ch,0,0); c.restore();
          rwx += chW;
        }
        x = rwx + spW;

      } else {
        // Normal word render
        c.fillStyle = S.ink;
        let cx = x;
        for (let ci=0; ci<word.length; ci++) {
          const ch = word[ci];
          const cseed = seed*500+ci+1;
          const chW = c.measureText(ch).width + S.letterSpacing*0.3;
          const alpha = S.effPressure ? 0.76+sr(cseed)*0.24 : 0.92;
          const rot = (S.slant/180)*Math.PI + (S.effJitter?(sr(cseed+5)-0.5)*0.03:0);
          const jit = S.effJitter ? (sr(cseed+10)-0.5)*1.3 : 0;
          c.globalAlpha = Math.min(1, alpha);
          c.save(); c.translate(cx, y+drift+jit); c.rotate(rot); c.fillText(ch,0,0); c.restore();
          cx += chW;
        }
        c.globalAlpha = 1; c.shadowBlur = 0;
        x += wordW + spW + S.letterSpacing*0.3;
      }
    });
    y += S.lineSpacing;
  });
}

// ══════════════════════════════════════════
//  PDF EXPORT
//  Renders every manual page + their sub-pages
//  into a single multi-page PDF using jsPDF
// ══════════════════════════════════════════
// document.getElementById('dlPDF').onclick = () => {
//   document.getElementById('statusTxt').textContent = 'Building PDF…';

//   // Small timeout so status text updates before heavy work starts
//   setTimeout(async () => {
//     try {
//       // jsPDF attaches to window as window.jspdf.jsPDF
//       const { jsPDF } = window.jspdf;

//       // Match PDF page size to user's chosen page size
//       const sizeMap = { a4:'a4', letter:'letter', a5:'a5' };
//       const orientation = 'portrait';
//       const unit = 'px';
//       const chosenSize = sizeMap[S.pageSize] || 'a4';

//       const { w: W, h: H } = DIMS[S.pageSize];

//       // Create PDF — first page added automatically
//       const pdf = new jsPDF({ orientation, unit, format: chosenSize });

//       // Save current state so we can restore after
//       const origMP = currentMP;
//       const origRP = S.currentRP;
//       manualPages[currentMP].text = document.getElementById('userText').value;

//       let totalPages = 0;
//       let firstPage = true;

//       for (let mi = 0; mi < manualPages.length; mi++) {
//         // Switch to this manual page
//         currentMP = mi;
//         document.getElementById('userText').value = manualPages[mi].text;
//         paginate(); // rebuilds S.renderedPages for this manual page

//         const rCount = S.renderedPages.length;

//         for (let ri = 0; ri < rCount; ri++) {
//           S.currentRP = ri;
//           render(); // draws to main canvas

//           // Draw canvas to an offscreen canvas at 1.5x quality
//           const q = Math.max(S.quality, 1.5);
//           const ec = document.createElement('canvas');
//           ec.width = W * q;
//           ec.height = H * q;
//           const ec2 = ec.getContext('2d');
//           ec2.imageSmoothingEnabled = true;
//           ec2.imageSmoothingQuality = 'high';
//           ec2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, W*q, H*q);

//           const imgData = ec.toDataURL('image/jpeg', 0.92);
//           // JPEG used instead of PNG — smaller file, faster PDF, no quality loss visible

//           if (firstPage) {
//             // jsPDF creates first page automatically — just add image to it
//             pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
//             firstPage = false;
//           } else {
//             pdf.addPage(chosenSize, orientation);
//             pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
//           }

//           totalPages++;
//           document.getElementById('statusTxt').textContent =
//             `Adding page ${totalPages}…`;
//         }
//       }

//       // Restore original state
//       currentMP = origMP;
//       document.getElementById('userText').value = manualPages[origMP].text;
//       S.currentRP = origRP;
//       paginate();

//       // Save the PDF
//       const filename = (manualPages[0]?.label || 'assignment')
//         .replace(/\s+/g, '_')
//         .toLowerCase();
//       pdf.save(`${filename}.pdf`);

//       document.getElementById('statusTxt').textContent =
//         `PDF exported — ${totalPages} pages!`;
//       setTimeout(
//         () => (document.getElementById('statusTxt').textContent = 'Ready'),
//         3000
//       );

//     } catch (err) {
//       console.error('PDF export error:', err);
//       document.getElementById('statusTxt').textContent = 'PDF failed — check console';
//       setTimeout(
//         () => (document.getElementById('statusTxt').textContent = 'Ready'),
//         3000
//       );
//     }
//   }, 80);
// };

document.getElementById('dlPDF').onclick = () => {
  document.getElementById('statusTxt').textContent = 'Building PDF…';

  setTimeout(async () => {
    try {
      const { jsPDF } = window.jspdf;
      const sizeMap = { a4:'a4', letter:'letter', a5:'a5' };
      const { w:W, h:H } = DIMS[S.pageSize];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [W, H]
      });

      // Save state
      const origMP = currentMP;
      const origRP = S.currentRP;
      manualPages[currentMP].text = document.getElementById('userText').value;

      let totalPages = 0;
      let firstPage = true;

      for (let mi = 0; mi < manualPages.length; mi++) {
        currentMP = mi;
        document.getElementById('userText').value = manualPages[mi].text;

        // Rebuild rendered pages for this manual page
        // without calling full paginate() which triggers render() on main canvas
        const startX = S.margin !== 'none' ? 100 : 42;
        const maxX = W - 35;
        const startY = S.heading ? 132 : 100;
        const maxY = H - 50;
        const rawLines = (manualPages[mi].text || '').split('\n');
        const allVL = [];
        rawLines.forEach((line, lIdx) =>
          wrapLine(line, startX, maxX, lIdx).forEach(vl => allVL.push(vl))
        );
        const pages = [[]]; let pi = 0, usedY = startY;
        allVL.forEach(vl => {
          if (usedY + S.lineSpacing > maxY) { pages.push([]); pi++; usedY = startY; }
          pages[pi].push(vl); usedY += S.lineSpacing;
        });

        for (let ri = 0; ri < pages.length; ri++) {
          // Create a fresh offscreen canvas — completely separate from main canvas
          const offCanvas = document.createElement('canvas');
          offCanvas.width  = W;
          offCanvas.height = H;
          const offCtx = offCanvas.getContext('2d');

          // Draw paper onto offscreen canvas
          drawPaperToCtx(offCtx, W, H);

          // Draw text onto offscreen canvas
          drawPageTextToCtx(offCtx, W, H, pages[ri], mi, ri);

          const imgData = offCanvas.toDataURL('image/jpeg', 0.93);

          if (firstPage) {
            pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
            firstPage = false;
          } else {
            pdf.addPage([W, H], 'portrait');
            pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
          }

          totalPages++;
          document.getElementById('statusTxt').textContent = `Page ${totalPages}…`;
        }
      }

      // Restore
      currentMP = origMP;
      document.getElementById('userText').value = manualPages[origMP].text;
      S.currentRP = origRP;
      paginate();

      const filename = (manualPages[0]?.label || 'assignment')
        .replace(/\s+/g, '_').toLowerCase();
      pdf.save(`${filename}.pdf`);

      document.getElementById('statusTxt').textContent = `PDF done — ${totalPages} pages!`;
      setTimeout(() => document.getElementById('statusTxt').textContent = 'Ready', 3000);

    } catch(err) {
      console.error('PDF error:', err);
      document.getElementById('statusTxt').textContent = 'PDF failed — check console';
      setTimeout(() => document.getElementById('statusTxt').textContent = 'Ready', 3000);
    }
  }, 80);
};