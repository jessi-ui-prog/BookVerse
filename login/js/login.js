
const nextMatch = /^#([a-z]+)(\/[a-z-]+)?$/.exec(
  new URLSearchParams(location.search).get("next") || ""
);

const nextHash =
  nextMatch &&
  Object.prototype.hasOwnProperty.call(
    SECTION_NAMES,
    nextMatch[1]
  )
    ? nextMatch[0]
    : "";

if (nextHash) {
  document.querySelector(".owl-form .lead").textContent =
    "Inicia sesión para entrar a «" +
    SECTION_NAMES[nextMatch[1]] + "».";
}

// Mantener las animaciones originales del búho.
mail.onfocus = lookAtCaret;
mail.oninput = lookAtCaret;

mail.onblur = () => {
  owl.lookX.to = 0;
  owl.lookY.to = 0.6;
};

pass.onfocus = () => wings(COVER, COVER);

pass.onblur = e => {
  if (e.relatedTarget !== show) wings(0, 0);
};

pass.oninput = () => {
  note.textContent = "";
  owl.left.v -= NUDGE;
  owl.right.v -= NUDGE;
};

show.onpointerdown = e => e.preventDefault();

show.onclick = () => {
  pass.focus();

  const peek = pass.type === "password";
  pass.type = peek ? "text" : "password";

  wings(COVER, peek ? PEEK : COVER);

  show.setAttribute("aria-pressed", String(peek));
  show.setAttribute(
    "aria-label",
    peek ? "Ocultar contraseña" : "Mostrar contraseña"
  );

  const r = pass.getBoundingClientRect();

  if (peek) {
    lookAt(r.left + 70, r.top + r.height / 2);
  }
};

room.addEventListener("pointermove", e => {
  if (
    document.activeElement !== mail &&
    document.activeElement !== pass
  ) {
    lookAt(e.clientX, e.clientY);
  }
});

function cheer() {
  owl.happy = true;
  wings(SPREAD, SPREAD);
  owl.hop.v = HOP;

  setTimeout(() => {
    owl.happy = false;
    wings(0, 0);
  }, 1500);
}

function shakeHead() {
  owl.shake.v = 1.6;
  owl.frown = 0.4;

  setTimeout(() => {
    owl.frown = 0;
  }, 900);
}

// Inicio de sesión con Firebase Authentication.
form.addEventListener("submit", async e => {
  e.preventDefault();

  if (btn.disabled) return;

  btn.disabled = true;
  btn.textContent = "Iniciando sesión...";
  note.textContent = "";

  try {
    const { auth } = await import(
      "../../js/firebase-config.js"
    );

    const { signInWithEmailAndPassword } = await import(
      "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js"
    );

    const credenciales = await signInWithEmailAndPassword(
      auth,
      mail.value.trim(),
      pass.value
    );

    cheer();
    form.classList.add("done");

    btn.textContent = "Sesión iniciada";

    const nombre =
      credenciales.user.displayName ||
      credenciales.user.email;

    note.textContent =
      "¡Bienvenido a BookVerse, " + nombre +
      "! Tu sesión de Firebase funciona correctamente.";

    console.log(
      "Usuario autenticado en Firebase:",
      credenciales.user.uid
    );

<<<<<<< HEAD
    let destino = "../usuario/dashboard.html";
    try {
      const { db } = await import("../../js/firebase-config.js");
      const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js");
      const uid = credenciales.user.uid;
      const admin = await getDoc(doc(db, "administradores", uid));
      if (admin.exists()) destino = "../admin/firebase.html";
      await setDoc(doc(db,"usuarios",uid),{
        nombre: credenciales.user.displayName || "Usuario",
        correo: credenciales.user.email || "",
        uid
      },{merge:true});
    } catch (err) { console.warn("Perfil o rol no disponible:",err); }
    setTimeout(() => { window.location.href = destino; }, 1200);
=======
    setTimeout(() => {
    window.location.href = "../usuario/dashboard.html";
    }, 1200);
>>>>>>> 2e42f958300c100ca3b3882b530d4e91f83f3e1a

    // Primero debemos adaptar sus comprobaciones de sesión.
  
  } catch (error) {
    shakeHead();

    const mensajes = {
      "auth/invalid-credential":
        "Correo o contraseña incorrectos.",
      "auth/invalid-email":
        "Introduce un correo válido.",
      "auth/user-disabled":
        "Esta cuenta está deshabilitada.",
      "auth/too-many-requests":
        "Demasiados intentos. Inténtalo más tarde.",
      "auth/network-request-failed":
        "Comprueba tu conexión a Internet."
    };

    note.textContent =
      mensajes[error.code] ||
      "No se pudo iniciar sesión: " + error.code;

    btn.disabled = false;
    btn.textContent = "Iniciar sesión";
  }
});
