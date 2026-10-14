import puppeteer from 'puppeteer-core';
const B='http://127.0.0.1:8765/';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--headless=new']});
let bad=0;
const pages=['index.html','arriendos.html','tasacion.html','privacidad.html','propiedades.html','autos-oportunidad.html','registrate.html','ingresopartner.html','orden-venta.html','orden-visita.html','reserva-arriendo.html','contrato-arriendo-aval.html','tasacion-privada.html','tasacion-privada2.html'];
for(const pg of pages){
  const p=await b.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  p.on('requestfailed',r=>{ if(r.url().startsWith(B)&&!r.url().endsWith('favicon.ico')) errs.push('404/fail '+r.url()); });
  p.on('response',r=>{ if(r.url().startsWith(B)&&r.status()>=400&&!r.url().endsWith('favicon.ico')) errs.push(r.status()+' '+r.url()); });
  await p.setViewport({width:1366,height:900});
  await p.goto(B+pg,{waitUntil:'networkidle2',timeout:30000}).catch(e=>errs.push('goto '+e.message));
  const info=await p.evaluate(()=>({url:location.pathname,tw:[...document.styleSheets].some(s=>(s.href||'').includes('tw.css')),
     title:document.title, desc:document.querySelector('meta[name=description]')?.content||'', canon:document.querySelector('link[rel=canonical]')?.href||'',
     consent:document.querySelectorAll('input[name=consentimiento],#consent-lead,#lead-consentimiento').length}));
  const okp=errs.length===0; if(!okp)bad++;
  console.log(okp?'OK  ':'FAIL',pg,'->',info.url,'| tw',info.tw,'| consent',info.consent,'| canon',info.canon?'sí':'no', errs.join(' ; '));
  await p.close();
}
// Screenshots
for(const [pg,name] of [['index.html','home'],['arriendos.html','arriendos'],['tasacion.html','tasacion']]){
  for(const [vw,vh,tag,mob] of [[1440,900,'desktop',false],[390,844,'mobile',true]]){
    const p=await b.newPage(); await p.setViewport({width:vw,height:vh,isMobile:mob,deviceScaleFactor:mob?2:1});
    await p.goto(B+pg,{waitUntil:'networkidle2'}); await new Promise(r=>setTimeout(r,1500));
    await p.evaluate(()=>{document.querySelectorAll('.reveal').forEach(e=>{e.style.opacity=1;e.style.transform='none'})});
    await p.screenshot({path:`/workspace/shots/${name}-${tag}.png`,fullPage:true}); await p.close();
  }
}
// Flujo tasación: el lead se guarda ANTES de abrir WhatsApp (sin escribir en producción: guardarLead simulado)
{ const p=await b.newPage(); await p.setViewport({width:1366,height:900});
  await p.setRequestInterception(true); p.on('request',r=>{ if(r.url().includes('firestore.googleapis.com')) r.abort(); else r.continue(); });
  await p.goto(B+'tasacion.html',{waitUntil:'networkidle2'});
  const res=await p.evaluate(async()=>{
    const log=[]; const fake={location:{set href(u){log.push('wa:'+u.slice(0,30))}}};
    window.open=()=>{log.push('open');return fake;};
    window.guardarLead=async(d)=>{log.push('save:'+d.origen+':'+d.nombre+':'+(d.datos&&d.datos.tipo));};
    document.getElementById('numUF').innerText='4500';
    window.enviarWhatsApp(); const sinConsent=[...log]; log.length=0;
    document.getElementById('lead-nombre').value='Prueba'; document.getElementById('lead-telefono').value='+56911112222';
    window.enviarWhatsApp(); const sinCheck=[...log]; log.length=0;
    document.getElementById('lead-consentimiento').checked=true;
    window.enviarWhatsApp(); await new Promise(r=>setTimeout(r,300));
    return {sinConsent,sinCheck,conConsent:[...log],err:document.getElementById('lead-error').textContent};
  });
  const okf=res.sinConsent.length===0&&res.sinCheck.length===0&&res.conConsent[1]?.startsWith('save:tasacion')&&res.conConsent[2]?.startsWith('wa:');
  if(!okf)bad++; console.log(okf?'OK  ':'FAIL','flujo tasación',JSON.stringify(res)); await p.close(); }
await b.close(); console.log('SMOKE:',bad?bad+' FAIL':'OK'); process.exit(bad?1:0);
