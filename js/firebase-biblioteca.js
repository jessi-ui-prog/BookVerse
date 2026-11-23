import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Guarda solo favoritos y estados de lectura. Los archivos PDF/EPUB y reseñas
// siguen siendo locales. No almacena contraseñas ni concede roles.
export async function iniciarBiblioteca(uid) {
  const favKey = "bookverse_favoritos_" + uid;
  const readKey = "bookverse_lectura_" + uid;
  const ref = doc(db, "usuarios", uid, "biblioteca", "estado-general");
  const readLocal = (key) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  let ready = false;
  let queue = Promise.resolve();
  let pending = false;
  let writing = false;
  const sync = () => {
    if (!ready) return;
    pending = true;
    if (writing) return;
    writing = true;
    queue = queue.then(async () => {
      while (pending) {
        pending = false;
        const favoritos = readLocal(favKey).filter(x => typeof x === "string");
        const lecturas = readLocal(readKey).filter(x => x && typeof x.id === "string" && ["pendiente", "leyendo", "leido"].includes(x.estado))
          .map(x => ({id: x.id, estado: x.estado}));
        await setDoc(ref, { favoritos, lecturas, actualizadoEn: new Date().toISOString() });
      }
    }).catch(error => {
      console.error("No se pudo sincronizar la biblioteca con Firestore:", error);
      // Conservar los cambios locales para intentar otra vez con la siguiente acción.
    }).finally(() => { writing = false; if (pending) sync(); });
  };
  try {
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      localStorage.setItem(favKey, JSON.stringify(Array.isArray(data.favoritos) ? data.favoritos : []));
      localStorage.setItem(readKey, JSON.stringify(Array.isArray(data.lecturas) ? data.lecturas : []));
      console.log("Biblioteca personal restaurada desde Firebase.");
    } else {
      // Primera conexión: subir la biblioteca local existente de este usuario.
      pending = true;
    }
  } catch (error) {
    console.error("No se pudo descargar la biblioteca desde Firestore:", error);
    // Evitar sobrescribir datos de la nube si la descarga falló.
    return;
  }
  ready = true;
  window.addEventListener("bookverse:biblioteca-local-cambio", sync);
  if (pending) sync();
}
