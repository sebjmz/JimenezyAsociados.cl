// Prueba local de la marquesina (no toca Firestore): usa el CSS y pintar() reales de intranet.html.
import fs from 'fs'; import puppeteer from 'puppeteer-core';
const h=fs.readFileSync(process.argv[2],'utf8');
const c0=h.indexOf('        .ticker-wrap {'), k=h.indexOf('        @keyframes ticker-animation {');
const kEnd=h.indexOf('        }', h.indexOf('100%', k))+9;
const css=h.slice(c0,kEnd);
const helpers=h.slice(h.indexOf('    const tiempoRelativo'),h.indexOf('    async function initLiveFeed'));
const pS=h.indexOf('        const pintar = () => {', h.indexOf('async function initLiveFeed')); const body=h.slice(pS,h.indexOf('        onSnapshot(q, (snapshot) => {', pS));
const html=`<html><head><style>.hidden{display:none}${css}</style></head><body style="margin:0">
<div id="live-feed-container" class="hidden"><div style="display:flex"><span style="width:200px;flex-shrink:0">ACT</span>
<div class="ticker-wrap min-w-0 flex-1" style="min-width:0;flex:1"><div id="live-ticker" class="ticker-move"></div></div></div></div>
<script>${helpers}window.run=(n)=>{let ultimos=Array.from({length:n},(_,i)=>({tipo:'T'+i,service:'Venta',createdAt:null}));${body}pintar();};</script></body></html>`;
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--headless=new']});
const p=await b.newPage(); let bad=0;
for(const [vw,n] of [[1200,1],[1200,3],[1200,5],[380,1],[1920,5]]){
  await p.setViewport({width:vw,height:200}); await p.setContent(html); await p.evaluate(n=>run(n),n);
  for(const ms of [0,800,2500]){ await new Promise(r=>setTimeout(r,ms));
    const r=await p.evaluate(()=>{const w=document.querySelector('.ticker-wrap').getBoundingClientRect();const t=document.getElementById('live-ticker');const tr=t.getBoundingClientRect();
      return {wl:w.left,wr:w.right,tl:tr.left,tr:tr.right,halves:[...t.children].map(c=>c.getBoundingClientRect().width)};});
    const cubre=r.tl<=r.wl+0.5 && r.tr>=r.wr-0.5; const iguales=r.halves.length===2&&Math.abs(r.halves[0]-r.halves[1])<0.5&&r.halves[0]>=r.wr-r.wl;
    console.log(cubre&&iguales?'PASS':'FAIL',`vw=${vw} n=${n} t+${ms}ms sinHueco=${cubre} mitades=${r.halves.map(Math.round)}`); if(!(cubre&&iguales))bad++; }
}
await b.close(); console.log(`RESULTADO: ${bad?bad+' FAIL':'OK'}`); process.exit(bad?1:0);
