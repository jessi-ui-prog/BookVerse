import { auth } from "./firebase-config.js";
import { db } from "./firebase-config.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { cargarLibrosFirebase } from "./firebase-catalogo.js";

const catalogo = document.querySelector('section[data-view="catalogo"]');
if (catalogo) {
  const barra = catalogo.querySelector('.toolbar');
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = '+ Publicar libro';
  boton.setAttribute('aria-expanded', 'false');
  boton.style.cssText = 'background:#b89147;color:#17130c;border:1px solid #d6b46b;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;min-height:42px;';

  const panel = document.createElement('section');
  panel.hidden = true;
  panel.style.cssText = 'margin:16px 0;padding:20px;border:1px solid #a78241;border-radius:14px;background:#211d1a;color:#f7ebd4;';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Publicar un libro en BookVerse';
  titulo.style.cssText = 'margin:0 0 8px;color:#e6c178;';
  const ayuda = document.createElement('p');
  ayuda.textContent = 'Comparte la ficha del libro y, si tienes permiso de distribución, un enlace HTTPS directo a un PDF/EPUB alojado externamente. BookVerse no aloja archivos.';
  ayuda.style.cssText = 'margin:0 0 16px;';
  const form = document.createElement('form');
  form.style.cssText = 'display:grid;gap:12px;max-width:640px;';
  const campos = [
    ['titulo','Título del libro',150,true],
    ['autor','Autor',120,true],
    ['genero','Género',60,true],
    ['descripcion','Descripción',2000,false],
    ['archivoURL','Enlace HTTPS al PDF/EPUB (opcional)',1000,false]
  ];
  const controles = {};
  for (const [clave,etiqueta,max,requerido] of campos) {
    const label = document.createElement('label');
    label.textContent = etiqueta;
    label.style.cssText = 'display:grid;gap:6px;font-weight:600;';
    const control = clave === 'descripcion' ? document.createElement('textarea') : document.createElement('input');
    if (clave !== 'descripcion') control.type = 'text';
    control.name = clave;
    control.maxLength = max;
    control.required = requerido;
    control.style.cssText = 'box-sizing:border-box;width:100%;padding:11px;border-radius:8px;border:1px solid #a78241;background:#fff;color:#191919;font:inherit;';
    if (clave === 'descripcion') control.rows = 4;
    label.append(control);
    form.append(label);
    controles[clave] = control;
  }
  const acciones = document.createElement('div');
  acciones.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;';
  const guardar = document.createElement('button');
  guardar.type = 'submit';
  guardar.textContent = 'Publicar en Firebase';
  guardar.style.cssText = 'padding:11px 18px;border:0;border-radius:8px;background:#c7a15a;color:#15120d;font-weight:700;cursor:pointer;';
  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.textContent = 'Cancelar';
  cancelar.style.cssText = 'padding:11px 18px;border:1px solid #c7a15a;border-radius:8px;background:transparent;color:#f7ebd4;cursor:pointer;';
  acciones.append(guardar,cancelar);
  const mensaje = document.createElement('p');
  mensaje.setAttribute('role','status');
  mensaje.setAttribute('aria-live','polite');
  form.append(acciones,mensaje);
  panel.append(titulo,ayuda,form);
  barra?.insertAdjacentElement('beforebegin',boton);
  boton.insertAdjacentElement('afterend',panel);
  const cerrar = () => { panel.hidden = true; boton.setAttribute('aria-expanded','false'); };
  boton.addEventListener('click', () => {panel.hidden = !panel.hidden; boton.setAttribute('aria-expanded',String(!panel.hidden)); if (!panel.hidden) controles.titulo.focus();});
  cancelar.addEventListener('click',cerrar);
  form.addEventListener('submit',async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const user = auth.currentUser;
    if (!user) { mensaje.textContent = 'Debes iniciar sesión para publicar.'; return; }
    const titulo = controles.titulo.value.trim();
    const autor = controles.autor.value.trim();
    const genero = controles.genero.value.trim();
    const descripcion = controles.descripcion.value.trim();
    const archivoURL = controles.archivoURL.value.trim();
    if (archivoURL && (!/^https:\/\//i.test(archivoURL) || !/^https:\/\/[^\s]+$/i.test(archivoURL))) { mensaje.textContent = 'El enlace debe comenzar por https:// y no contener espacios.'; return; }
    if (!titulo || !autor || !genero) { mensaje.textContent = 'Completa título, autor y género.'; return; }
    if (titulo.length > 150 || autor.length > 120 || genero.length > 60 || descripcion.length > 2000 || archivoURL.length > 1000) { mensaje.textContent = 'Revisa la longitud de los campos.'; return; }
    guardar.disabled = true;
    guardar.textContent = 'Publicando...';
    mensaje.textContent = '';
    try {
      await addDoc(collection(db,'libros'), {
        titulo, autor, genero, descripcion,
        publico: true, archivoURL, creadoPor: user.uid
      });
      await cargarLibrosFirebase();
      form.reset();
      mensaje.textContent = '¡Libro publicado! Ya está disponible en el catálogo compartido.';
      console.log('BookVerse: publicación guardada en Firestore.');
    } catch (error) {
      console.error('No se pudo publicar el libro:',error);
      mensaje.textContent = error.code === 'permission-denied'
        ? 'Firebase rechazó la publicación. Comprueba las reglas de Firestore.'
        : 'No se pudo publicar: ' + (error.code || error.message);
    } finally {
      guardar.disabled = false;
      guardar.textContent = 'Publicar en Firebase';
    }
  });
}
