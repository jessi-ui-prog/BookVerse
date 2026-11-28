/* BookVerse Etapa 6: detalles, reseñas, valoraciones, preferencias y archivos locales. */
(function(){'use strict';
const USER=typeof getCurrentUser==='function'?getCurrentUser():null;
if(!USER)return;
const admin=document.body.dataset.panel==='admin';
const BOOKS='bookverse_libros';
const uid=String(USER.id||USER.correo||'usuario');
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k));return x==null?d:x;}catch{return d;}};
const save=(k,v)=>{localStorage.setItem(k,JSON.stringify(v));if(k.startsWith('bookverse_lectura_'))window.dispatchEvent(new Event('bookverse:biblioteca-local-cambio'));};
// Catálogo unificado: los libros de Firebase tienen prioridad si coinciden en ID.
const books=()=>{
  const local=load(BOOKS,[]);
  const remotos=Array.isArray(window.bookverseLibrosFirebase)?window.bookverseLibrosFirebase:[];
  const porId=new Map();
  (Array.isArray(local)?local:[]).forEach(b=>porId.set(String(b.id),b));
  remotos.forEach(b=>porId.set(String(b.id),b));
  return Array.from(porId.values());
};
const revKey='bookverse_resenas_v6';
const prefsKey='bookverse_preferencias_'+uid;
const statusKey='bookverse_lectura_'+uid;
let active=null, objectURL=null, rendition=null, epubBook=null, readerRun=0, readerAbort=null, readerCleanup=null;
const dlg=document.createElement('dialog');dlg.className='bv6-dialog';dlg.id='bv6Dialog';dlg.innerHTML=`<div class="bv6-top"><h2 id="bv6Title">Libro</h2><button type="button" class="btn ghost small" id="bv6Close">Cerrar ×</button></div><div id="bv6Info"></div><div id="bv6Controls"></div><div id="bv6Reviews"></div><div id="bv6Reader" hidden><div class="bv6-reader-bar"><button type="button" class="btn ghost small" id="bv6Prev">← Anterior</button><button type="button" class="btn ghost small" id="bv6Next">Siguiente →</button><button type="button" class="btn ghost small" id="bv6Hide">Cerrar lector</button></div><div id="bv6Frame"></div></div>`;
document.body.appendChild(dlg);
const byId=id=>books().find(b=>String(b.id)===String(id));
const reviews=()=>load(revKey,[]);
const myReview=id=>reviews().find(r=>r.bookId===id&&r.userId===uid);
const status=id=>load(statusKey,[]).find(r=>String(r.id)===String(id))?.estado||'pendiente';
function clearReader(){readerCleanup?.();readerCleanup=null;readerRun++;readerAbort?.abort();readerAbort=null;if(epubBook){try{epubBook.destroy();}catch{}epubBook=null;}if(rendition){try{rendition.destroy();}catch{}rendition=null;}if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}document.getElementById('bv6Frame').replaceChildren();document.getElementById('bv6Reader').hidden=true;}
function close(){clearReader();dlg.close();}
document.getElementById('bv6Close').onclick=close;
dlg.addEventListener('close',clearReader);
document.getElementById('bv6Hide').onclick=clearReader;
function render(){const b=byId(active);if(!b){close();return;}
document.getElementById('bv6Title').textContent=b.titulo;
document.getElementById('bv6Info').innerHTML=`<p><b>Autor:</b> ${safe(b.autor)} · <b>Género:</b> ${safe(b.genero)}</p><p>${safe(b.descripcion||'Sin descripción disponible.')}</p>`;
const mine=myReview(String(b.id));
const rr=reviews().filter(r=>r.bookId===String(b.id));
const avg=rr.length?(rr.reduce((n,r)=>n+Number(r.stars),0)/rr.length).toFixed(1):'Sin calificaciones';
document.getElementById('bv6Controls').innerHTML=`<h3>Mi lectura</h3><label>Estado <select id="bv6State"><option value="pendiente">Por leer</option><option value="leyendo">Leyendo</option><option value="leido">Terminado</option></select></label><p class="bv6-help">El estado se guarda en tu cuenta y aparecerá en la lista de lectura.</p><h3>Mi valoración</h3><label>Estrellas <select id="bv6Stars">${[1,2,3,4,5].map(n=>`<option value="${n}">${'★'.repeat(n)} (${n}/5)</option>`).join('')}</select></label><label>Reseña <textarea id="bv6Text" rows="3" maxlength="1500" placeholder="Escribe tu opinión..."></textarea></label><button class="btn" id="bv6SaveReview">Guardar valoración y reseña</button><h3>Archivo para leer</h3><label>Seleccionar PDF o EPUB <input type="file" id="bv6File" accept=".pdf,.epub,application/pdf,application/epub+zip"></label><p class="bv6-help">El archivo se guarda en este navegador (IndexedDB). No se publica ni se sube a un servidor. Usa solo archivos que tengas derecho a leer.</p><div class="bv6-file-actions"><button type="button" class="btn ghost small" id="bv6OpenFile">Abrir archivo guardado</button><button type="button" class="btn ghost small" id="bv6RemoveFile">Quitar archivo guardado</button></div>`;
document.getElementById('bv6Reviews').innerHTML=`<h3>Opiniones de lectores · ${safe(avg)} ${rr.length?'★':''}</h3>`+(rr.length?rr.map(r=>`<div class="bv6-review"><strong>${safe(r.author)} · ${'★'.repeat(r.stars)}</strong><p>${safe(r.text||'Sin comentario.')}</p></div>`).join(''):'<p>Todavía no hay reseñas.</p>');
document.getElementById('bv6State').value=status(String(b.id));
if(b.archivoURL && /^https:\/\/[^\s]+$/i.test(b.archivoURL)){const wrap=document.createElement('p');const a=document.createElement('a');a.href=b.archivoURL;a.target='_blank';a.rel='noopener noreferrer';a.textContent='📖 Abrir archivo compartido (sitio externo)';a.className='btn ghost small';wrap.append(a);if(/\.epub$/i.test(new URL(b.archivoURL).pathname)){const read=document.createElement('button');read.type='button';read.className='btn';read.textContent='Leer EPUB en BookVerse';read.onclick=()=>openRemoteEpub(b);wrap.prepend(read);}document.getElementById('bv6Controls').append(wrap);}
document.getElementById('bv6Stars').value=mine?.stars||5;
document.getElementById('bv6Text').value=mine?.text||'';
document.getElementById('bv6State').onchange=e=>{let r=load(statusKey,[]);const x=r.find(x=>String(x.id)===String(b.id));if(x)x.estado=e.target.value;else r.push({id:b.id,estado:e.target.value});save(statusKey,r);document.dispatchEvent(new Event('bv6:updated'));window.dispatchEvent(new Event('bv6:updated'));};
document.getElementById('bv6SaveReview').onclick=()=>{const stars=Number(document.getElementById('bv6Stars').value);const text=document.getElementById('bv6Text').value.trim();let r=reviews().filter(x=>!(x.bookId===String(b.id)&&x.userId===uid));r.push({bookId:String(b.id),userId:uid,author:USER.nombre||'Lector',stars,text,date:new Date().toISOString()});save(revKey,r);render();};
document.getElementById('bv6File').onchange=async e=>{const file=e.target.files[0];if(!file)return;const ext=file.name.toLowerCase().split('.').pop();if(!['pdf','epub'].includes(ext)){alert('Selecciona PDF o EPUB.');return;}if(file.size>40*1024*1024){alert('El archivo supera el límite de 40 MB.');return;}try{await putFile(String(b.id),file);alert('Archivo guardado en este navegador.');await openFile(String(b.id));}catch(err){alert('No se pudo guardar el archivo: '+err.message);}};
document.getElementById('bv6OpenFile').onclick=()=>openFile(String(b.id)).catch(err=>alert('No se pudo abrir el archivo: '+err.message));
document.getElementById('bv6RemoveFile').onclick=async()=>{try{await deleteFile(String(b.id));clearReader();alert('Archivo eliminado de este navegador.');}catch(err){alert('No se pudo eliminar el archivo: '+err.message);}};
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-detail]');if(!btn)return;active=btn.dataset.detail;clearReader();render();dlg.showModal();});
// IndexedDB almacena los archivos como Blob, evitando el límite de localStorage.
const dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open('BookVerseLecturasV6',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files');};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});
async function fileOp(mode,key,value){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('files',mode);const store=tx.objectStore('files');const q=value===undefined?store.get(key):value===null?store.delete(key):store.put(value,key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
const fileKey=id=>uid+'::'+id;
const putFile=(id,file)=>fileOp('readwrite',fileKey(id),file);
const getFile=id=>fileOp('readonly',fileKey(id));
const deleteFile=id=>fileOp('readwrite',fileKey(id),null);
async function openFile(id){const file=await getFile(id);if(!file){alert('Primero selecciona un archivo PDF o EPUB para este libro.');return;}clearReader();const frame=document.getElementById('bv6Frame');document.getElementById('bv6Reader').hidden=false;const ext=file.name.toLowerCase().split('.').pop();
if(ext==='pdf'){objectURL=URL.createObjectURL(file);const iframe=document.createElement('iframe');iframe.src=objectURL;iframe.title='Lector PDF';iframe.className='bv6-pdf';frame.appendChild(iframe);document.getElementById('bv6Prev').hidden=true;document.getElementById('bv6Next').hidden=true;}
else{const run=readerRun;try{const buffer=await file.arrayBuffer();if(run===readerRun)await showEpub(buffer,id+'::'+file.name+'::'+file.lastModified,run);}catch(err){if(run===readerRun)frame.textContent='No se pudo abrir el EPUB: '+err.message;}}
}
async function openRemoteEpub(b){
 clearReader();const run=readerRun;readerAbort=new AbortController();
 const frame=document.getElementById('bv6Frame');document.getElementById('bv6Reader').hidden=false;
 frame.textContent='Cargando EPUB…';frame.scrollIntoView({block:'nearest'});
 try{const response=await fetch(b.archivoURL,{signal:readerAbort.signal,credentials:'omit'});if(!response.ok)throw new Error('HTTP '+response.status);const buffer=await response.arrayBuffer();if(run!==readerRun)return;if(buffer.byteLength>50*1024*1024)throw new Error('El archivo supera 50 MB.');await showEpub(buffer,b.id+'::'+b.archivoURL,run);}catch(err){if(run===readerRun)frame.textContent='No se pudo abrir el EPUB. Usa el enlace externo si el servidor no permite la lectura interna. '+err.message;}
}
async function showEpub(buffer,id,run){
 const frame=document.getElementById('bv6Frame');frame.replaceChildren();
 if(typeof window.ePub!=='function')throw new Error('No se pudo cargar EPUB.js.');
 const tools=document.createElement('div');tools.className='bv11-tools';tools.innerHTML=`<label>Capítulos <select aria-label="Capítulos"><option value="">Seleccionar capítulo</option></select></label><label>Letra <select aria-label="Tamaño de letra"><option>90%</option><option selected>110%</option><option>130%</option><option>150%</option><option>180%</option></select></label><label>Tema <select aria-label="Tema"><option value="light">Claro</option><option value="dark">Oscuro</option><option value="sepia">Sepia</option></select></label><progress max="100" value="0"></progress><span role="status">Calculando progreso…</span>`;
 frame.append(tools);const viewer=document.createElement('div');viewer.className='bv11-viewer';frame.append(viewer);
 const [chapters,font,theme]=tools.querySelectorAll('select');const progress=tools.querySelector('progress');const status=tools.querySelector('span');
 const book=window.ePub(buffer);epubBook=book;const r=book.renderTo(viewer,{width:'100%',height:'100%',spread:'none',allowScriptedContent:false,allowPopups:false});rendition=r;
 const key='bookverse_epub_position_'+uid+'::'+id;const saved=load(key,null);
 const themes={light:{background:'#fff',color:'#222'},dark:{background:'#171717',color:'#eee'},sepia:{background:'#f4ecd8',color:'#493a29'}};
 const settingsKey='bookverse_epub_settings_'+uid;
 const settings=load(settingsKey,{});if(themes[settings.theme])theme.value=settings.theme;if([...font.options].some(o=>o.value===settings.font))font.value=settings.font;
 function paint(contents){const doc=contents.document;if(!doc?.head)return;let style=doc.getElementById('bv-reader-theme');if(!style){style=doc.createElement('style');style.id='bv-reader-theme';}const c=themes[theme.value];style.textContent=`html,body {background-color:${c.background} !important;color:${c.color} !important;} body *:not(img):not(svg):not(svg *) {color:${c.color} !important;background-color:transparent !important;} a {text-decoration:underline !important;}`;doc.head.append(style);}
 function apply(){viewer.style.background=themes[theme.value].background;r.themes.fontSize(font.value);for(const c of r.getContents())paint(c);try{save(settingsKey,{theme:theme.value,font:font.value});}catch{}}
 font.onchange=theme.onchange=apply;
 r.hooks.content.register(contents=>{paint(contents);const doc=contents.document;let start=null,lastSwipe=0;const interactive=e=>e.target?.closest?.('a,button,input,select,textarea,[contenteditable]');const selected=()=>!!doc.getSelection()?.toString();
 doc.addEventListener('touchstart',e=>{start=e.touches.length===1&&!interactive(e)?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 doc.addEventListener('touchcancel',()=>{start=null;});
 doc.addEventListener('touchend',e=>{if(!start)return;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5&&!selected()){lastSwipe=Date.now();if(e.cancelable)e.preventDefault();turn(dx<0?1:-1);}},{passive:false});
 doc.addEventListener('click',e=>{if(Date.now()-lastSwipe<500||interactive(e)||selected())return;const width=doc.documentElement.clientWidth;if(e.clientX<width*.20)turn(-1);else if(e.clientX>width*.80)turn(1);});
 doc.addEventListener('keydown',keyboard);
 });
 function keyboard(e){if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.target?.closest?.('input,select,textarea,button,[contenteditable]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowRight'?1:-1);}}
 dlg.addEventListener('keydown',keyboard);const cleanup=()=>dlg.removeEventListener('keydown',keyboard);readerCleanup=cleanup;
 apply();
 let current=null;function update(){if(run!==readerRun||!current)return;try{const fraction=book.locations.percentageFromCfi(current);if(typeof fraction==='number'&&Number.isFinite(fraction)){progress.value=Math.round(fraction*100);status.textContent=progress.value+'% leído';}}catch{}}
 r.on('relocated',location=>{if(run!==readerRun)return;current=location.start.cfi;try{save(key,current);}catch{}update();});
 const prev=document.getElementById('bv6Prev'),next=document.getElementById('bv6Next');prev.hidden=next.hidden=false;const go=fn=>Promise.resolve().then(fn).catch(()=>{if(run===readerRun)status.textContent='No se pudo cambiar de página.';});let turning=false;function turn(direction){if(turning||run!==readerRun)return;turning=true;go(()=>direction<0?r.prev():r.next()).finally(()=>{turning=false;});}prev.onclick=()=>turn(-1);next.onclick=()=>turn(1);chapters.onchange=()=>{if(chapters.value)go(()=>r.display(chapters.value));};
 try{await r.display(saved||undefined);}catch(err){if(run!==readerRun)return;if(!saved)throw err;await r.display();}if(run!==readerRun)return;viewer.scrollIntoView({block:'nearest'});
 book.loaded.navigation.then(nav=>{if(run!==readerRun)return;function add(items,depth=0){for(const item of items||[]){const opt=document.createElement('option');opt.value=item.href;opt.textContent='  '.repeat(depth)+item.label.trim();chapters.append(opt);add(item.subitems,depth+1);}}add(nav.toc);}).catch(()=>{});
 book.ready.then(()=>{if(run===readerRun)return book.locations.generate(1600);}).then(update).catch(()=>{if(run===readerRun)status.textContent='Progreso no disponible';});
}
// Preferencias de vista y orden, por usuario, incluso tras recargar.
const pref=load(prefsKey,{});
// Las preferencias se aplican antes del primer render en paneles.js.
// Se guardan allí mismo al cambiar vista u orden.
// Estadísticas adicionales de estados y reseñas.
if(!admin){const stats=document.getElementById('userStats');if(stats){const append=()=>{const r=load(statusKey,[]);const rev=reviews().filter(x=>x.userId===uid);const existing=document.getElementById('bv6ExtraStats');if(existing)existing.remove();const wrap=document.createElement('div');wrap.id='bv6ExtraStats';wrap.className='bv6-stats';wrap.innerHTML=`<div class="stat"><small>Por leer</small><strong>${r.filter(x=>x.estado==='pendiente').length}</strong></div><div class="stat"><small>Mis reseñas</small><strong>${rev.length}</strong></div>`;stats.after(wrap);};append();document.addEventListener('bv6:updated',append);window.addEventListener('bv6:updated',append);}}
})();