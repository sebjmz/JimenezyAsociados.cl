// Reproduce el envío de "Nueva referencia" de intranet.html en casos sin perfil / sin puntaje.
import { initializeTestEnvironment, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, writeBatch, collection, increment, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
const A='artifacts/jimenez-portal-oficial';
const env=await initializeTestEnvironment({projectId:'demo-ref',firestore:{rules:fs.readFileSync(process.env.RULES,'utf8'),host:'127.0.0.1',port:8080}});
const ADMIN='sebjmz@gmail.com';
let ok=0,bad=0;const t=async(n,p)=>{try{await p;console.log('PASS',n);ok++}catch(e){console.log('FAIL',n,e.message);bad++}};
async function referir(db,uid,email){
  const isAdmin=email===ADMIN;
  const scoreSnap=isAdmin?null:await getDoc(doc(db,`${A}/scores/${uid}`)).catch(()=>null);
  const refRef=doc(collection(db,`${A}/users/${uid}/referidos`));
  const b=writeBatch(db);
  b.set(refRef,{name:'N',phone:'+569',service:'Venta',tipo:'Casa',partnerEmail:email,contactado:false,contrato:false,visitas:false,statusFinal:'Validando',createdAt:serverTimestamp()});
  b.set(doc(db,`${A}/red/${uid}/items/${refRef.id}`),{pid:'JA-X',tipo:'Casa',service:'Venta',contactado:false,contrato:false,visitas:false,statusFinal:'Validando',createdAt:serverTimestamp()});
  b.set(doc(db,`${A}/feed/${refRef.id}`),{tipo:'Casa',service:'Venta',createdAt:serverTimestamp()});
  if(scoreSnap&&scoreSnap.exists()) b.update(doc(db,`${A}/scores/${uid}`),{leads:increment(1),lastRef:refRef.id});
  await b.commit();
  const profRef=doc(db,`${A}/users/${uid}/profile/data`);
  const ps=await getDoc(profRef);
  if(ps.exists()) await updateDoc(profRef,{lastActivityAt:serverTimestamp()});
  else await setDoc(profRef,{email,name:'x',lastActivityAt:serverTimestamp(),createdAt:serverTimestamp()});
  return refRef.id;
}
const admin=env.authenticatedContext('rCT9x5Lmb5eFV5Wt8WpJzpsngoA2',{email:ADMIN,email_verified:true}).firestore();
const sinScore=env.authenticatedContext('p1',{email:'p1@x.cl',email_verified:true}).firestore();
const sinNada=env.authenticatedContext('p2',{email:'p2@x.cl',email_verified:true}).firestore();
const conTodo=env.authenticatedContext('p3',{email:'p3@x.cl',email_verified:true}).firestore();
await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await setDoc(doc(d,`${A}/users/p1/profile/data`),{email:'p1@x.cl'});
  await setDoc(doc(d,`${A}/users/p3/profile/data`),{email:'p3@x.cl'});
  await setDoc(doc(d,`${A}/scores/p3`),{pid:'JA-P3',sponsorUid:'',leads:0,firmas:0,activos:0,l1:0,l2:0,l3:0,lastRef:''});
  // upline con sponsor borrado (score de "fantasma" no existe)
  await setDoc(doc(d,`${A}/scores/p4`),{pid:'JA-P4',sponsorUid:'fantasma',leads:0,firmas:0,activos:0,l1:0,l2:0,l3:0,lastRef:''});
});
await t('admin sin perfil registra referencia', assertSucceeds(referir(admin,'rCT9x5Lmb5eFV5Wt8WpJzpsngoA2',ADMIN)));
await t('partner sin puntaje (no migrado) registra referencia', assertSucceeds(referir(sinScore,'p1','p1@x.cl')));
await t('partner sin perfil ni puntaje registra referencia', assertSucceeds(referir(sinNada,'p2','p2@x.cl')));
await t('partner normal: referencia + lead +1', assertSucceeds((async()=>{await referir(conTodo,'p3','p3@x.cl'); const s=(await getDoc(doc(conTodo,`${A}/scores/p3`))).data(); if(s.leads!==1) throw new Error('leads '+s.leads);})()));
await t('alta con upline L2 inexistente no falla (solo suma L1)', assertSucceeds((async()=>{
  const db=env.authenticatedContext('p5',{email:'p5@x.cl'}).firestore();
  const b=writeBatch(db); b.set(doc(db,`${A}/scores/p5`),{pid:'JA-P5',sponsorUid:'p4',leads:0,firmas:0,activos:0,l1:0,l2:0,l3:0,lastRef:'',createdAt:serverTimestamp()});
  let up='p4'; for(const n of ['l1','l2','l3']){ if(!up)break; const s=await getDoc(doc(db,`${A}/scores/${up}`)); if(!s.exists())break; b.update(doc(db,`${A}/scores/${up}`),{[n]:increment(1)}); up=s.data().sponsorUid||''; }
  await b.commit(); const s=(await getDoc(doc(db,`${A}/scores/p4`))).data(); if(s.l1!==1)throw new Error('l1');})()));
console.log(`\nRESULTADO: ${ok} PASS, ${bad} FAIL`);await env.cleanup();process.exit(bad?1:0);
