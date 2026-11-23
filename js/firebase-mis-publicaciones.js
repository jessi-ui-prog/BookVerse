import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { cargarLibrosFirebase } from "./firebase-catalogo.js";

const catalogo = document.querySelector('section[data-view="catalogo"]');
if (catalogo) {
  const section = document.createElement('section');
  section.id = 'bv-mis-publicaciones';
  section.style.cssText = 'margin:20px 0;padding:18px;border:1px solid #a78241;border-radius:14px;background:#211d1a;color:#f7ebd4;';
  section.innerHTML = '<h2 style="color:#e6c178;margin:0 0 8px">Mis publicaciones</h2><p>Administra los libros que publicaste desde tu cuenta.</p>';
  const refresh = document.createElement('button');
  refresh.type = 'button'; refresh.textContent = 'Actualizar mis publicaciones';
  refresh.className = 'btn ghost small';
  const status = document.createElement('p');
  status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  const list = document.createElement('div');
  list.style.cssText = 'display:grid;gap:12px;margin-top:14px;';
  section.append(refresh,status,list);
  const toolbar = catalogo.querySelector('.toolbar');
  if (toolbar) toolbar.insertAdjacentElement('beforebegin',section);
  else catalogo.prepend(section);

  const fieldSpecs = [
    ['titulo','Título',150,true], ['autor','Autor',120,true],
    ['genero','Género',60,true], ['descripcion','Descripción',2000,false]
  ];
  const styleInput = 'box-sizing:border-box;width:100%;padding:10px;border-radius:8px;border:1px solid #a78241;background:#fff;color:#191919;font:inherit;';
  const buttonStyle = 'padding:9px 14px;border-radius:8px;border:1px solid #c7a15a;cursor:pointer;';

  async function listar() {
    const user = auth.currentUser;
    list.replaceChildren();
    if (!user) { status.textContent = 'Inicia sesión para ver tus publicaciones.'; return; }
    status.textContent = 'Consultando tus publicaciones...';
    refresh.disabled = true;
    try {
      // Las reglas de Firestore permiten leer únicamente libros públicos.
      // Ambos filtros son necesarios para que la consulta sea autorizada.
      const q = query(collection(db,'libros'),where('publico','==',true));
      const snap = await getDocs(q);
      const propios = snap.docs.filter(item => item.data().creadoPor === user.uid);
      status.textContent = propios.length === 0 ? 'Aún no has publicado libros desde esta cuenta.' : `Tienes ${propios.length} publicación(es).`;
      propios.forEach(item => mostrar(item.id,item.data()));
    } catch (error) {
      console.error('Mis publicaciones:',error);
      status.textContent = error.code === 'failed-precondition'
        ? 'Firestore solicita un índice para esta consulta. Abre la consola del navegador y utiliza el enlace que proporciona Firebase para crearlo gratuitamente.'
        : 'No se pudieron cargar tus publicaciones: '+(error.code||error.message);
    } finally { refresh.disabled = false; }
  }

  function mostrar(id,libro) {
    const card = document.createElement('article');
    card.style.cssText = 'padding:14px;border:1px solid #6f5938;border-radius:10px;';
    const heading = document.createElement('strong');
    heading.textContent = `${libro.titulo || 'Sin título'} — ${libro.autor || 'Autor desconocido'}`;
    const detail = document.createElement('p');
    detail.textContent = `${libro.genero || 'General'} · ${libro.descripcion || 'Sin descripción'}`;
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    const edit = document.createElement('button');
    edit.type='button'; edit.textContent='Editar'; edit.style.cssText=buttonStyle+'background:#c7a15a;color:#15120d;';
    const remove = document.createElement('button');
    remove.type='button'; remove.textContent='Eliminar'; remove.style.cssText=buttonStyle+'background:transparent;color:#f7ebd4;';
    const feedback = document.createElement('p');
    feedback.setAttribute('role','status'); feedback.setAttribute('aria-live','polite');
    actions.append(edit,remove);
    card.append(heading,detail,actions,feedback);
    list.append(card);

    edit.addEventListener('click',() => {
      if (card.querySelector('form')) return;
      const form = document.createElement('form');
      form.style.cssText = 'display:grid;gap:10px;margin-top:14px;max-width:640px;';
      const controls = {};
      for (const [key,label,max,required] of fieldSpecs) {
        const wrapper = document.createElement('label');
        wrapper.style.cssText='display:grid;gap:5px;'; wrapper.textContent=label;
        const input = document.createElement(key==='descripcion'?'textarea':'input');
        if (key!=='descripcion') input.type='text';
        input.maxLength=max; input.required=required; input.value=libro[key]||'';
        input.style.cssText=styleInput;
        if (key==='descripcion') input.rows=3;
        wrapper.append(input); form.append(wrapper); controls[key]=input;
      }
      const save=document.createElement('button');save.type='submit';save.textContent='Guardar cambios';save.style.cssText=buttonStyle+'background:#c7a15a;color:#15120d;';
      const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';cancel.style.cssText=buttonStyle+'background:transparent;color:#f7ebd4;';
      const row=document.createElement('div');row.style.cssText='display:flex;gap:10px;flex-wrap:wrap;';row.append(save,cancel);form.append(row);card.append(form);
      cancel.addEventListener('click',()=>form.remove());
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        if (!form.reportValidity()) return;
        const changes=Object.fromEntries(fieldSpecs.map(([key])=>[key,controls[key].value.trim()]));
        if (!changes.titulo || !changes.autor || !changes.genero) {feedback.textContent='Título, autor y género son obligatorios.';return;}
        if (fieldSpecs.some(([key,,max])=>changes[key].length>max)) {feedback.textContent='Uno de los campos excede el límite.';return;}
        save.disabled=true;remove.disabled=true;feedback.textContent='Guardando...';
        try {
          if (auth.currentUser?.uid!==libro.creadoPor) throw new Error('Esta publicación no pertenece a tu cuenta.');
          await updateDoc(doc(db,'libros',id),changes);
          await cargarLibrosFirebase();
          feedback.textContent='Cambios guardados en Firebase.';
          await listar();
        } catch(error) {console.error(error);feedback.textContent='No se pudo editar: '+(error.code||error.message);}
        finally {save.disabled=false;remove.disabled=false;}
      });
    });

    remove.addEventListener('click',async()=>{
      if (!window.confirm(`¿Eliminar definitivamente «${libro.titulo}» del catálogo compartido? Esta acción no se puede deshacer.`)) return;
      remove.disabled=true;edit.disabled=true;feedback.textContent='Eliminando...';
      try {
        if (auth.currentUser?.uid!==libro.creadoPor) throw new Error('Esta publicación no pertenece a tu cuenta.');
        await deleteDoc(doc(db,'libros',id));
        await cargarLibrosFirebase();
        await listar();
      } catch(error) {console.error(error);feedback.textContent='No se pudo eliminar: '+(error.code||error.message);remove.disabled=false;edit.disabled=false;}
    });
  }

  refresh.addEventListener('click',listar);
  await listar();
}
