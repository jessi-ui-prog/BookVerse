/* BookVerse Etapa 6: detalles, reseñas, valoraciones, preferencias y archivos locales. */
(function(){'use strict';
const USER=typeof getCurrentUser==='function'?getCurrentUser():null;
if(!USER)return;
const admin=document.body.dataset.panel==='admin';
const BOOKS='bookverse_libros';
const uid=String(USER.id||USER.correo||'usuario');
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k));return x==null?d:x;}catch{return d;}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const books=()=>load(BOOKS,[]);
const revKey='bookverse_resenas_v6';
const prefsKey='bookverse_preferencias_'+uid;
const statusKey='bookverse_lectura_'+uid;
let active=null, objectURL=null, rendition=null;
const dlg=document.createElement('dialog');dlg.className='bv6-dialog';dlg.id='bv6Dialog';dlg.innerHTML=`<div class="bv6-top"><h2 id="bv6Title">Libro</h2><button type="button" class="btn ghost small" id="bv6Close">Cerrar ×</button></div><div id="bv6Info"></div><div id="bv6Controls"></div><div id="bv6Reviews"></div><div id="bv6Reader" hidden><div class="bv6-reader-bar"><button type="button" class="btn ghost small" id="bv6Prev">← Anterior</button><button type="button" class="btn ghost small" id="bv6Next">Siguiente →</button><button type="button" class="btn ghost small" id="bv6Hide">Cerrar lector</button></div><div id="bv6Frame"></div></div>`;
document.body.appendChild(dlg);
const byId=id=>books().find(b=>String(b.id)===String(id));
const reviews=()=>load(revKey,[]);
const myReview=id=>reviews().find(r=>r.bookId===id&&r.userId===uid);
const status=id=>load(statusKey,[]).find(r=>String(r.id)===String(id))?.estado||'pendiente';
function clearReader(){if(rendition){try{rendition.destroy();}catch{}rendition=null;}if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}document.getElementById('bv6Frame').replaceChildren();document.getElementById('bv6Reader').hidden=true;}
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
else{document.getElementById('bv6Prev').hidden=false;document.getElementById('bv6Next').hidden=false;if(typeof window.ePub!=='function'){frame.textContent='El lector EPUB necesita cargar epub.js desde Internet. Conéctate y vuelve a abrir este archivo.';return;}try{const buffer=await file.arrayBuffer();const book=window.ePub(buffer);const viewer=document.createElement('div');viewer.className='bv6-epub';frame.appendChild(viewer);rendition=book.renderTo(viewer,{width:'100%',height:520});await rendition.display();document.getElementById('bv6Prev').onclick=()=>rendition?.prev();document.getElementById('bv6Next').onclick=()=>rendition?.next();}catch(err){frame.textContent='No se pudo abrir el EPUB: '+err.message;}}
}
// Preferencias de vista y orden, por usuario, incluso tras recargar.
const pref=load(prefsKey,{});
// Las preferencias se aplican antes del primer render en paneles.js.
// Se guardan allí mismo al cambiar vista u orden.
// Estadísticas adicionales de estados y reseñas.
if(!admin){const stats=document.getElementById('userStats');if(stats){const append=()=>{const r=load(statusKey,[]);const rev=reviews().filter(x=>x.userId===uid);const existing=document.getElementById('bv6ExtraStats');if(existing)existing.remove();const wrap=document.createElement('div');wrap.id='bv6ExtraStats';wrap.className='bv6-stats';wrap.innerHTML=`<div class="stat"><small>Por leer</small><strong>${r.filter(x=>x.estado==='pendiente').length}</strong></div><div class="stat"><small>Mis reseñas</small><strong>${rev.length}</strong></div>`;stats.after(wrap);};append();document.addEventListener('bv6:updated',append);window.addEventListener('bv6:updated',append);}}
})();