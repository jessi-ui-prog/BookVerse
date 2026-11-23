// BOOKVERSE - Etapa 2: apartados con ruta propia y acceso obligatorio
// Cada apartado es una <section class="view" data-view="..."> de index.html.
// Rutas (hash):  #inicio (pública) · #biblioteca · #biblioteca/romance · #categorias · #nosotros (piden sesión)
// OJO: es una protección de demostración en el navegador; un acceso real necesita un servidor (ver README).

const SESSION_KEY = "bookverse_user"; // misma clave que usa login/js/config.js
const LOGIN_URL = "login/index.html";
const PUBLIC_VIEWS = ["inicio"];      // todo lo demás exige iniciar sesión

const VIEWS = {
    inicio: "Inicio",
    biblioteca: "Biblioteca",
    categorias: "Categorías",
    nosotros: "Nosotros"
};

// Géneros de Categorías: "term" es lo que se busca en data-search de cada libro (sin tildes)
const GENRES = {
    romance: { label: "Romance", term: "romance" },
    misterio: { label: "Misterio", term: "misterio" },
    fantasia: { label: "Fantasía", term: "fantasia" },
    "ciencia-ficcion": { label: "Ciencia ficción", term: "ciencia ficcion" }
};

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// ---------- Sesión ----------
function readSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        // Compatibilidad con una sesión antigua que guardaba solo el correo.
        try {
            const parsed = JSON.parse(raw);
            return parsed && parsed.correo ? parsed : null;
        } catch {
            return { correo: raw, nombre: raw, rol: "usuario" };
        }
    } catch (error) { return null; }
}

const authLink = document.getElementById("authLink");
const panelLink = document.getElementById("panelLink");

function updateAuthUI() {
    const user = readSession();
    document.body.classList.toggle("is-auth", Boolean(user));
    panelLink.hidden = !user;
    if (user) panelLink.href = user.rol === "administrador" ? "admin/dashboard.html" : "usuario/dashboard.html";
    authLink.textContent = user ? "Cerrar sesión" : "Iniciar sesión";
    authLink.href = user ? "#inicio" : LOGIN_URL;
    authLink.title = user ? `Sesión iniciada como ${user.nombre || user.correo}` : "";
    const roleLabel = user ? (user.rol === "administrador" ? "Administrador" : "Usuario") : "";
    authLink.setAttribute("aria-label", user ? `Cerrar sesión de ${roleLabel}` : "Iniciar sesión");
    document.querySelectorAll("[data-protected]").forEach((link) => {
        link.title = user ? "" : "Requiere iniciar sesión";
    });
}

authLink.addEventListener("click", (event) => {
    if (!readSession()) return; // sin sesión, el enlace lleva al login
    event.preventDefault();
    try { localStorage.removeItem(SESSION_KEY); } catch (error) {}
    updateAuthUI();
    if (location.hash !== "#inicio") location.hash = "#inicio"; // al cerrar sesión se sale de los apartados privados
});

// ---------- Catálogo: buscador + filtro por género ----------
const bookSearch = document.getElementById("bookSearch");
let bookCards = document.querySelectorAll(".book-card");
const catalogCount = document.getElementById("catalogCount");
const emptyState = document.getElementById("emptyState");
const genreChip = document.getElementById("genreChip");
const genreName = document.getElementById("genreName");
let activeGenre = null;
const BOOKS_STORAGE_KEY = "bookverse_libros";
const PUBLIC_SEED = Array.from(bookCards).map(card => card.outerHTML);
function htmlEscape(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function refreshPublicBooks() {
    let books;
    try { books=JSON.parse(localStorage.getItem(BOOKS_STORAGE_KEY)); } catch(e) { books=null; }
    if (!Array.isArray(books)) return;
    const grid=document.getElementById("booksGrid");
    grid.innerHTML=books.map((b,i)=>{
      const original=PUBLIC_SEED.find(html=>html.toLocaleLowerCase('es').includes('>'+String(b.titulo).toLocaleLowerCase('es')+'</h3>'));
      if(original && String(b.id).startsWith('demo-')) return original;
      return `<article class="book-card" data-search="${htmlEscape([b.titulo,b.autor,b.genero].join(' ').toLocaleLowerCase('es'))}"><div class="book-cover" style="background:linear-gradient(135deg,#4d3c24,#171410);min-height:230px;display:flex;align-items:center;justify-content:center;padding:22px;text-align:center"><strong style="font-family:Georgia,serif;color:#e2c98f;font-size:22px">${htmlEscape(b.titulo)}</strong></div><div class="book-info"><span class="book-category">${htmlEscape(b.genero)}</span><h3>${htmlEscape(b.titulo)}</h3><p>${htmlEscape(b.autor)}</p></div></article>`;
    }).join('');
    bookCards=document.querySelectorAll('.book-card');
}
refreshPublicBooks();
window.addEventListener('storage', e => {if(e.key===BOOKS_STORAGE_KEY){refreshPublicBooks();applyFilters();}});
window.addEventListener('pageshow',()=>{refreshPublicBooks();applyFilters();});

function applyFilters() {
    const text = bookSearch.value.trim().toLocaleLowerCase("es");
    const genreTerm = activeGenre ? GENRES[activeGenre].term : "";
    let visibleBooks = 0;

    bookCards.forEach((card) => {
        const searchable = card.dataset.search.toLocaleLowerCase("es");
        const matches = searchable.includes(text) && searchable.includes(genreTerm);
        card.hidden = !matches;
        if (matches) visibleBooks++;
    });

    const filtering = text !== "" || genreTerm !== "";
    catalogCount.textContent = filtering
        ? `${visibleBooks} ${visibleBooks === 1 ? "libro encontrado" : "libros encontrados"}`
        : `${bookCards.length} libros destacados`;
    emptyState.hidden = visibleBooks !== 0;
}

function setGenre(key) {
    activeGenre = key && has(GENRES, key) ? key : null;
    genreChip.hidden = !activeGenre;
    if (activeGenre) genreName.textContent = GENRES[activeGenre].label;
    applyFilters();
}

bookSearch.addEventListener("input", applyFilters);
genreChip.addEventListener("click", () => { location.hash = "#biblioteca"; }); // quitar el filtro

// ---------- Apartados ----------
const viewSections = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll("[data-nav]");
let currentView = null;

function parseHash() {
    const [rawView = "", rawParam = ""] = location.hash.replace(/^#\/?/, "").split("/");
    return { view: has(VIEWS, rawView) ? rawView : "inicio", param: rawParam };
}

function route() {
    const { view, param } = parseHash();

    // Acceso obligatorio: sin sesión, cualquier apartado privado manda al login y recuerda a dónde volver
    if (!PUBLIC_VIEWS.includes(view) && !readSession()) {
        const next = "#" + view + (param ? "/" + param : "");
        location.replace(`${LOGIN_URL}?next=${encodeURIComponent(next)}`);
        return;
    }

    viewSections.forEach((section) => { section.hidden = section.dataset.view !== view; });
    navLinks.forEach((link) => link.classList.toggle("active", link.dataset.nav === view));
    document.title = view === "inicio" ? "BookVerse | Biblioteca virtual" : `${VIEWS[view]} | BookVerse`;
    setGenre(view === "biblioteca" ? param : null);

    if (view !== currentView || param) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    currentView = view;
}

window.addEventListener("hashchange", route);
// al volver con el botón "atrás" el navegador puede restaurar la página sin recargarla: se revisa la sesión de nuevo
window.addEventListener("pageshow", (event) => { if (event.persisted) { updateAuthUI(); route(); } });

// ---------- Menú adaptable para móviles ----------
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

// Cerrar el menú al seleccionar una opción
document.querySelectorAll(".main-nav a").forEach((link) => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
    });
});

// Año automático en el pie de página
document.getElementById("currentYear").textContent = new Date().getFullYear();

// ---------- Arranque ----------
updateAuthUI();
route();
