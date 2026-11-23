const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");

registerForm.addEventListener("submit", event => {
    event.preventDefault();
    registerMessage.textContent = "";
    registerMessage.className = "register-message";

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (nombre.length < 3) {
        showError("Escribe un nombre de al menos 3 caracteres.");
        return;
    }
    if (!registerForm.reportValidity()) return;
    if (password.length < 6) {
        showError("La contraseña debe tener al menos 6 caracteres.");
        return;
    }
    if (password !== confirmPassword) {
        showError("Las contraseñas no coinciden.");
        return;
    }

    try {
        registerButton.disabled = true;
        registerButton.textContent = "Creando cuenta…";
        registerUser({ nombre, correo, password });
        registerMessage.textContent = "¡Cuenta creada! Ahora puedes iniciar sesión.";
        registerMessage.classList.add("success");
        registerForm.reset();
        setTimeout(() => { location.href = "index.html"; }, 1300);
    } catch (error) {
        showError(error.message);
        registerButton.disabled = false;
        registerButton.textContent = "Crear cuenta";
    }
});

function showError(message) {
    registerMessage.textContent = message;
    registerMessage.classList.add("error");
}
