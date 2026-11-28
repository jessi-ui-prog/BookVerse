import { subirArchivoLibro, eliminarArchivoLibro } from "./supabase-storage.js";
import { auth } from "./firebase-config.js";
import { db } from "./firebase-config.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { cargarLibrosFirebase } from "./firebase-catalogo.js";

const catalogo = document.querySelector('section[data-view="catalogo"]');
if (catalogo) {
  const barra = catalogo.querySelector('.toolbar');
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.id = 'bv-publicar-trigger';
  boton.textContent = '+ Publicar libro';
  boton.setAttribute('aria-expanded', 'false');
  boton.style.cssText = 'background:#b89147;color:#17130c;border:1px solid #d6b46b;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer;min-height:42px;';

  const panel = document.createElement('dialog');
  panel.id = 'bv-publicar-dialog';
  panel.setAttribute('aria-label', 'Publicar un libro');
  panel.style.cssText = 'margin:0;padding:20px;width:min(680px,calc(100% - 24px));max-height:90vh;border:1px solid #a78241;border-radius:14px;background:#211d1a;color:#f7ebd4;';
  const titulo = document.createElement('h2');
  titulo.textContent = 'Publicar un libro en BookVerse';
  titulo.style.cssText = 'margin:0 0 8px;color:#e6c178;';
  const ayuda = document.createElement('p');
  ayuda.textContent = 'Comparte la ficha del libro y sube un PDF o EPUB de hasta 50 MB, o utiliza un enlace HTTPS externo. Los archivos subidos son públicos: comparte solo obras autorizadas.';
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
  const archivoLabel = document.createElement('label');
  archivoLabel.textContent = 'Archivo PDF o EPUB (opcional, máximo 50 MB)';
  archivoLabel.style.cssText = 'display:grid;gap:6px;font-weight:600;';
  const archivo = document.createElement('input');
  archivo.type = 'file'; archivo.accept = '.pdf,.epub';
  archivo.style.cssText = controles.archivoURL.style.cssText;
  archivoLabel.append(archivo); form.append(archivoLabel);
  const permisoLabel = document.createElement('label');
  const permiso = document.createElement('input'); permiso.type = 'checkbox';
  permisoLabel.append(permiso, ' Confirmo que tengo permiso para compartir el archivo o enlace públicamente.');
  form.append(permisoLabel);
  const acciones = document.createElement('div');
  acciones.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;';
  const guardar = document.createElement('button');
  guardar.type = 'submit';
  guardar.textContent = 'Publicar libro';
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
  document.body.append(panel);
  const cerrar = () => { if (!guardar.disabled) panel.close(); };
  const abrir = () => { if (!panel.open) { panel.showModal(); boton.setAttribute('aria-expanded','true'); controles.titulo.focus(); } };
  panel.addEventListener('close', () => boton.setAttribute('aria-expanded','false'));
  panel.addEventListener('cancel', e => { if (guardar.disabled) e.preventDefault(); });
  boton.addEventListener('click', abrir);
  window.addEventListener('bookverse:publicar', abrir);
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
    let archivoURL = controles.archivoURL.value.trim();
    const seleccionado = archivo.files[0];
    if (seleccionado && archivoURL) { mensaje.textContent = "Selecciona un archivo o un enlace, no ambos."; return; }
    if ((seleccionado || archivoURL) && !permiso.checked) { mensaje.textContent = "Confirma el permiso de distribución."; return; }
    if (archivoURL && (!/^https:\/\//i.test(archivoURL) || !/^https:\/\/[^\s]+$/i.test(archivoURL))) { mensaje.textContent = 'El enlace debe comenzar por https:// y no contener espacios.'; return; }
    if (!titulo || !autor || !genero) { mensaje.textContent = 'Completa título, autor y género.'; return; }
    if (titulo.length > 150 || autor.length > 120 || genero.length > 60 || descripcion.length > 2000 || archivoURL.length > 1000) { mensaje.textContent = 'Revisa la longitud de los campos.'; return; }
    guardar.disabled = true; cancelar.disabled = true;
    let subida = null; let guardado = false;
    guardar.textContent = 'Publicando...';
    mensaje.textContent = '';
    try {
      if (seleccionado) {
        mensaje.textContent = 'Subiendo archivo a Supabase...';
        subida = await subirArchivoLibro(seleccionado);
        archivoURL = subida.archivoURL;
      }
      if (auth.currentUser?.uid !== user.uid) throw new Error('La sesión cambió.');
      mensaje.textContent = 'Guardando ficha en Firestore...';
      await addDoc(collection(db,'libros'), {
        titulo, autor, genero, descripcion,
        publico: true, archivoURL, creadoPor: user.uid
      });
      guardado = true;
      await cargarLibrosFirebase();
      window.dispatchEvent(new Event("bookverse:publicacion-guardada"));
      form.reset();
      mensaje.textContent = '¡Libro publicado! Ya está disponible en el catálogo compartido.';
      console.log('BookVerse: publicación guardada en Firestore.');
    } catch (error) {
      let aviso = '';
      if (subida && !guardado) { try { await eliminarArchivoLibro(subida.archivoRuta); } catch (e) { aviso = ' No se pudo limpiar el archivo subido; revisa Storage.'; console.error(e); } }
      console.error('No se pudo publicar el libro:',error);
      mensaje.textContent = error.code === 'permission-denied'
        ? 'Firebase rechazó la publicación. Comprueba las reglas de Firestore.'
        : 'No se pudo publicar: ' + (error.code || error.message);
      mensaje.textContent += aviso;
    } finally {
      guardar.disabled = false; cancelar.disabled = false;
      guardar.textContent = 'Publicar libro';
    }
  });
}
