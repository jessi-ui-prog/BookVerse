
import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const LOGIN_URL = "../login/index.html";

onAuthStateChanged(auth, async (firebaseUser) => {
  if (!firebaseUser) {
    window.location.replace(LOGIN_URL);
    return;
  }

  // Perfil temporal para las funciones antiguas del panel.
  // No es un mecanismo de autorización.
  const usuario = {
    id: firebaseUser.uid,
    nombre: firebaseUser.displayName ||
            firebaseUser.email.split("@")[0],
    correo: firebaseUser.email,
    rol: "usuario"
  };

  // Compatibilidad temporal con el panel existente.
  window.getCurrentUser = () => usuario;

  // El panel de usuario no administra otras cuentas.
  window.getUsers = () => [];
  window.saveUsers = () => {};

  window.logoutUser = () => {
    signOut(auth).then(() => {
      window.location.replace(LOGIN_URL);
    }).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  };

  // Restaurar favoritos y lectura de Firestore antes de pintar el panel.
  await (await import("./firebase-biblioteca.js")).iniciarBiblioteca(firebaseUser.uid);

  // Cargar las funciones del panel después de verificar Firebase.
  await cargarScript("../js/paneles.js");

  await cargarScript(
    "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js"
  );
  
  await cargarScript("../js/etapa6.js");

  await import("./firebase-catalogo.js");
  await import("./firebase-publicar.js");
  await import("./firebase-mis-publicaciones.js");
  await import("./firebase-articulos.js");
});

function cargarScript(ruta) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ruta;
    script.onload = resolve;
    script.onerror = () => reject(
      new Error("No se pudo cargar: " + ruta)
    );
    document.body.appendChild(script);
  });
}
