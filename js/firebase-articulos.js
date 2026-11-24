import { auth, db } from "./firebase-config.js";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const section = document.querySelector('section[data-view="articulos"]');
if (section) {
  const root = document.createElement('div');
  root.id = 'bv-articulos-nube';
  root.style.cssText = 'border:1px solid #a78241;border-radius:14px;padding:18px;margin:18px 0;';
  const title = document.createElement('h2'); title.textContent = 'Artículos compartidos en Firebase';
  const intro = document.createElement('p'); intro.textContent = 'Publica y consulta artículos literarios. Solo puedes editar los tuyos.';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = '+ Nuevo artículo'; toggle.className = 'btn';
  const form = document.createElement('form'); form.hidden = true; form.style.cssText = 'display:grid;gap:10px;max-width:680px;margin:14px 0;';
  const fields = {};
  for (const [key,label,max,multi] of [['titulo','Título',150,false],['contenido','Contenido',5000,true]]) {
    const wrap = document.createElement('label'); wrap.textContent = label; wrap.style.cssText = 'display:grid;gap:5px;';
    const el = document.createElement(multi?'textarea':'input'); if(!multi) el.type='text';
    el.maxLength = max; el.required = true; el.style.cssText = 'width:100%;box-sizing:border-box;padding:10px;border:1px solid #b89147;border-radius:8px;background:#fff;color:#111;font:inherit;';
    if(multi) el.rows=5; wrap.append(el); form.append(wrap); fields[key]=el;
  }
  const submit=document.createElement('button');submit.className='btn';submit.type='submit';submit.textContent='Publicar artículo';
  const cancel=document.createElement('button');cancel.className='btn ghost';cancel.type='button';cancel.textContent='Cancelar';
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:10px;flex-wrap:wrap;';actions.append(submit,cancel);form.append(actions);
  const status=document.createElement('p');status.setAttribute('role','status');
  const refresh=document.createElement('button');refresh.className='btn ghost small';refresh.textContent='Actualizar artículos';refresh.type='button';
  const list=document.createElement('div');list.style.cssText='display:grid;gap:12px;margin-top:14px;';
  root.append(title,intro,toggle,form,status,refresh,list);section.prepend(root);
  let editing=null;
  const close=()=>{form.hidden=true;editing=null;form.reset();submit.textContent='Publicar artículo';};
  toggle.onclick=()=>{if(!auth.currentUser){status.textContent='Inicia sesión primero.';return;} form.hidden=!form.hidden;if(!form.hidden)fields.titulo.focus();};
  cancel.onclick=close;
  async function load(){
    status.textContent='Cargando artículos...';list.replaceChildren();
    try{
      const snap=await getDocs(query(collection(db,'articulos'),where('publico','==',true)));
      const rows=snap.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>String(b.creadoEn||'').localeCompare(String(a.creadoEn||'')));
      status.textContent=rows.length?`${rows.length} artículo(s) compartido(s).`:'Todavía no hay artículos compartidos.';
      for(const a of rows){
        const card=document.createElement('article');card.className='book';card.style.cssText='padding:15px;';
        const h=document.createElement('h3');h.textContent=a.titulo;
        const by=document.createElement('small');by.textContent='Por '+(a.autor||'Lector');
        const body=document.createElement('p');body.textContent=a.contenido;body.style.whiteSpace='pre-wrap';
        card.append(h,by,body);
        if(a.creadoPor===auth.currentUser?.uid){
          const buttons=document.createElement('div');buttons.style.cssText='display:flex;gap:10px;flex-wrap:wrap;';
          const edit=document.createElement('button');edit.type='button';edit.className='btn ghost small';edit.textContent='Editar';
          const del=document.createElement('button');del.type='button';del.className='btn danger small';del.textContent='Eliminar';
          edit.onclick=()=>{editing=a.id;fields.titulo.value=a.titulo;fields.contenido.value=a.contenido;form.hidden=false;submit.textContent='Guardar cambios';form.scrollIntoView({behavior:'smooth',block:'center'});};
          del.onclick=async()=>{if(!confirm('¿Eliminar este artículo definitivamente?'))return;del.disabled=true;try{await deleteDoc(doc(db,'articulos',a.id));await load();}catch(e){status.textContent='Error al eliminar: '+(e.code||e.message);del.disabled=false;}};
          buttons.append(edit,del);card.append(buttons);
        }
        list.append(card);
      }
    }catch(e){status.textContent='No se pudieron cargar los artículos: '+(e.code||e.message);}
  }
  form.onsubmit=async e=>{
    e.preventDefault();const user=auth.currentUser;if(!user)return;
    const titulo=fields.titulo.value.trim(),contenido=fields.contenido.value.trim();
    if(!titulo||!contenido||titulo.length>150||contenido.length>5000){status.textContent='Completa los campos dentro de los límites.';return;}
    submit.disabled=true;
    try{
      if(editing)await updateDoc(doc(db,'articulos',editing),{titulo,contenido});
      else await addDoc(collection(db,'articulos'),{titulo,contenido,autor:(user.displayName||'Lector').slice(0,100),creadoPor:user.uid,creadoEn:new Date().toISOString(),publico:true});
      close();await load();
    }catch(e){status.textContent='No se pudo guardar: '+(e.code||e.message);}
    finally{submit.disabled=false;}
  };
  refresh.onclick=load;
  await load();
}
