
import { auth } from "../../js/firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const form = document.getElementById("registerForm");
const mensaje = document.getElementById("registerMessage");
const boton = document.getElementById("registerButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensaje.textContent = "";
  mensaje.className = "register-message";

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const password = document.getElementById("password").value;
  const confirmar = document.getElementById("confirmPassword").value;

  if (nombre.length < 3) {
    mostrarError("El nombre debe tener al menos 3 caracteres.");
    return;
  }

  if (!form.reportValidity()) return;

  if (password.length < 6) {
    mostrarError("La contraseña debe tener mínimo 6 caracteres.");
    return;
  }

  if (password !== confirmar) {
    mostrarError("Las contraseñas no coinciden.");
    return;
  }

  boton.disabled = true;
  boton.textContent = "Creando cuenta...";

  try {
    const credenciales = await createUserWithEmailAndPassword(
      auth,
      correo,
      password
    );

    await updateProfile(credenciales.user, {
      displayName: nombre
    });

    // El login actual todavía no utiliza Firebase.
    await signOut(auth);

    mensaje.textContent =
      "¡Cuenta creada correctamente en Firebase!";
    mensaje.classList.add("success");

    form.reset();

    // Permanecemos aquí para comprobar el registro.
  } catch (error) {
    const errores = {
      "auth/email-already-in-use":
        "Este correo ya está registrado.",
      "auth/invalid-email":
        "El correo electrónico no es válido.",
      "auth/weak-password":
        "La contraseña es demasiado débil.",
      "auth/network-request-failed":
        "No se pudo conectar a Internet.",
      "auth/operation-not-allowed":
        "Activa Correo/Contraseña en Firebase Authentication."
    };

    mostrarError(
      errores[error.code] ||
      "Ocurrió un error: " + error.code
    );
  } finally {
    boton.disabled = false;
    boton.textContent = "Crear cuenta";
  }
});

function mostrarError(texto) {
  mensaje.textContent = texto;
  mensaje.classList.add("error");
}
