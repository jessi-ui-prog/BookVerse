// BookVerse - autenticación de demostración con localStorage.
// Para producción se necesita un backend y contraseñas cifradas con hash.
const USERS_KEY = "bookverse_users";
const SESSION_KEY = "bookverse_user";

function getUsers() {
    try {
        const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedUsers() {
    const users = getUsers();
    if (users.length) return;
    saveUsers([
        {
            id: "admin-demo",
            nombre: "Administrador",
            correo: "admin@bookverse.com",
            password: "admin123",
            rol: "administrador",
            fechaRegistro: new Date().toISOString()
        },
        {
            id: "user-demo",
            nombre: "Lector BookVerse",
            correo: "usuario@bookverse.com",
            password: "user123",
            rol: "usuario",
            fechaRegistro: new Date().toISOString()
        }
    ]);
}

function registerUser({ nombre, correo, password }) {
    seedUsers();
    const users = getUsers();
    const normalizedEmail = correo.trim().toLowerCase();
    if (users.some(user => user.correo.toLowerCase() === normalizedEmail)) {
        throw new Error("Ya existe una cuenta registrada con ese correo.");
    }
    const user = {
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        nombre: nombre.trim(),
        correo: normalizedEmail,
        password,
        rol: "usuario",
        fechaRegistro: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return user;
}

function authenticateUser(correo, password) {
    seedUsers();
    const normalizedEmail = correo.trim().toLowerCase();
    const user = getUsers().find(item =>
        item.correo.toLowerCase() === normalizedEmail && item.password === password
    );
    if (!user) throw new Error("Correo o contraseña incorrectos.");
    const safeUser = {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
}

function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return user && user.correo && user.rol ? user : null;
    } catch {
        return null;
    }
}

function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
}

seedUsers();
