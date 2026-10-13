import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, orderBy, limit, writeBatch, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import fs from 'fs'; import crypto from 'crypto';
const A='artifacts/jimenez-portal-oficial';
const h=e=>crypto.createHash('sha256').update(e).digest('hex');
const env=await initializeTestEnvironment({projectId:'demo-auto',firestore:{rules:fs.readFileSync(process.env.RULES,'utf8'),host:'127.0.0.1',port:8080}});
const ctx=(u)=>env.authenticatedContext(u,{email:u+'@x.cl',email_verified:true}).firestore();
const [ana,ben,cam,dan,eve]=['ana','ben','cam','dan','eve'].map(ctx);
const admin=env.authenticatedContext('seb',{email:'sebjmz@gmail.com'}).firestore();
let ok=0,bad=0;const t=async(n,p)=>{try{await p;console.log('PASS',n);ok++}catch(e){console.log('FAIL',n,e.message);bad++}};
const zero=(sp)=>({pid:'JA-X',sponsorUid:sp,leads:0,firmas:0,activos:0,l1:0,l2:0,l3:0,lastRef:'',createdAt:serverTimestamp()});
// Reproduce ensureScore() de intranet.html
async function alta(db,uid,sp){ await setDoc(doc(db,`${A}/invites/${h(uid+'@x.cl')}`),{uid});
  const b=writeBatch(db); b.set(doc(db,`${A}/scores/${uid}`),zero(sp)); let up=sp;
  for(const n of ['l1','l2','l3']){ if(!up)break; b.update(doc(db,`${A}/scores/${up}`),{[n]:increment(1)}); const s=await getDoc(doc(db,`${A}/scores/${up}`)); up=s.data().sponsorUid; }
  await b.commit(); }
// Reproduce el envío de referido de intranet.html
async function referir(db,uid,id,tipo='Casa'){ const b=writeBatch(db);
  b.set(doc(db,`${A}/users/${uid}/referidos/${id}`),{name:'Cliente Privado',phone:'+56911',tipo,partnerEmail:uid+'@x.cl',contactado:false,contrato:false,visitas:false,statusFinal:'Validando',createdAt:serverTimestamp()});
  b.set(doc(db,`${A}/red/${uid}/items/${id}`),{pid:'JA-X',tipo,service:'Venta',contactado:false,contrato:false,visitas:false,statusFinal:'Validando',createdAt:serverTimestamp()});
  b.set(doc(db,`${A}/feed/${id}`),{tipo,createdAt:serverTimestamp()});
  b.update(doc(db,`${A}/scores/${uid}`),{leads:increment(1),lastRef:id}); await b.commit(); }
const sc=async u=>(await getDoc(doc(admin,`${A}/scores/${u}`))).data();

await t('alta ana (sin sponsor)', assertSucceeds(alta(ana,'ana','')));
await t('alta ben (sponsor ana)', assertSucceeds(alta(ben,'ben','ana')));
await t('alta cam (sponsor ben)', assertSucceeds(alta(cam,'cam','ben')));
await t('alta dan (sponsor cam)', assertSucceeds(alta(dan,'dan','cam')));
await t('contadores L1/L2/L3 automáticos', (async()=>{const a=await sc('ana'),b=await sc('ben'),c=await sc('cam');
  if(!(a.l1===1&&a.l2===1&&a.l3===1&&b.l1===1&&b.l2===1&&b.l3===0&&c.l1===1&&c.l2===0))throw new Error(JSON.stringify({a,b,c}));})());
await t('resolver sponsor por hash del email', (async()=>{const s=await getDoc(doc(eve,`${A}/invites/${h('ben@x.cl')}`)); if(s.data().uid!=='ben')throw new Error('x');})());
await t('NO listar invites (emails)', assertFails(getDocs(collection(eve,`${A}/invites`))));
await t('NO registrar invite con hash ajeno', assertFails(setDoc(doc(eve,`${A}/invites/${h('ben@x.cl')}`),{uid:'eve'})));
await t('NO alta duplicada (dan otra vez)', assertFails(alta(dan,'dan','ana')));
await t('NO alta con contadores inflados', assertFails(setDoc(doc(eve,`${A}/scores/eve`),{...zero(''),firmas:9})));
await t('NO alta con sponsor inexistente', assertFails(setDoc(doc(eve,`${A}/scores/eve`),zero('fantasma'))));
await t('NO +1 a L1 de ana sin alta real', assertFails(updateDoc(doc(eve,`${A}/scores/ana`),{l1:increment(1)})));
await t('NO +5 a L1 en el alta', assertFails((async()=>{const b=writeBatch(eve);b.set(doc(eve,`${A}/scores/eve`),zero('ana'));b.update(doc(eve,`${A}/scores/ana`),{l1:increment(5)});await b.commit();})()));
await t('NO +1 a L2 de quien no es su L2', assertFails((async()=>{const b=writeBatch(eve);b.set(doc(eve,`${A}/scores/eve`),zero('ana'));b.update(doc(eve,`${A}/scores/cam`),{l2:increment(1)});await b.commit();})()));
await t('dan sube referido (batch: privado + red + feed + lead+1)', assertSucceeds(referir(dan,'dan','r1')));
await t('lead +1 automático', (async()=>{if((await sc('dan')).leads!==1)throw new Error('leads');})());
await t('NO lead +1 sin referido nuevo', assertFails(updateDoc(doc(dan,`${A}/scores/dan`),{leads:increment(1),lastRef:'r1'})));
await t('NO autoasignarse firmas', assertFails(updateDoc(doc(dan,`${A}/scores/dan`),{firmas:increment(1)})));
await t('NO feed falso sin referido', assertFails(setDoc(doc(dan,`${A}/feed/zzz`),{tipo:'Hack',createdAt:serverTimestamp()})));
await t('ranking: cualquier partner lee scores', assertSucceeds(getDocs(collection(eve,`${A}/scores`))));
await t('feed: partner lee últimos 5', assertSucceeds(getDocs(query(collection(eve,`${A}/feed`),orderBy('createdAt','desc'),limit(5)))));
await t('red: cam (L1 de dan) lee items de dan', assertSucceeds(getDocs(collection(cam,`${A}/red/dan/items`))));
await t('red: ben (L2 de dan) lee items de dan', assertSucceeds(getDocs(collection(ben,`${A}/red/dan/items`))));
await t('red: ana (L3) NO lee items de dan', assertFails(getDocs(collection(ana,`${A}/red/dan/items`))));
await t('red: eve (externa) NO lee items de dan', assertFails(getDocs(collection(eve,`${A}/red/dan/items`))));
await t('red: dashboard busca L1 por sponsorUid', assertSucceeds(getDocs(query(collection(ben,`${A}/scores`),where('sponsorUid','==','ben')))));
await t('privado: cam NO lee referido de dan (nombre/teléfono)', assertFails(getDoc(doc(cam,`${A}/users/dan/referidos/r1`))));
await t('privado: red item sin nombre/teléfono', (async()=>{const d=(await getDoc(doc(cam,`${A}/red/dan/items/r1`))).data(); if('name' in d||'phone' in d)throw new Error('pii');})());
await t('NO partner edita estado en red', assertFails(updateDoc(doc(dan,`${A}/red/dan/items/r1`),{contrato:true})));
// Flujo admin: marcar contrato → firmas y activos en el momento
await t('admin marca contrato (+ copia red + firmas + activos)', assertSucceeds((async()=>{
  await updateDoc(doc(admin,`${A}/users/dan/referidos/r1`),{contrato:true});
  await setDoc(doc(admin,`${A}/red/dan/items/r1`),{contrato:true},{merge:true});
  const s=await sc('dan'); await updateDoc(doc(admin,`${A}/scores/dan`),{firmas:s.firmas+1});
  const sp=await sc('cam'); await updateDoc(doc(admin,`${A}/scores/cam`),{activos:sp.activos+1});})()));
await t('ranking refleja firma y activo', (async()=>{const d=await sc('dan'),c=await sc('cam'); if(d.firmas!==1||c.activos!==1)throw new Error('rank');})());
await t('ben ve estado actualizado en su red', (async()=>{if(!(await getDoc(doc(ben,`${A}/red/dan/items/r1`))).data().contrato)throw new Error('x');})());
await t('público: socio_ ajeno sigue privado', assertFails(getDoc(doc(eve,`${A}/public/socio_dan`))));
await t('público: anónimo NO lee scores', assertFails(getDocs(collection(env.unauthenticatedContext().firestore(),`${A}/scores`))));
console.log(`\nRESULTADO: ${ok} PASS, ${bad} FAIL`);await env.cleanup();process.exit(bad?1:0);
