// BOOKVERSE · Etapa 3 — Paneles de administrador y de usuario.
// Usa la sesión y los usuarios de login/js/auth.js (getCurrentUser, getUsers, saveUsers, logoutUser).
// Los libros, favoritos y lecturas se guardan en localStorage como datos de demostración;
// la comprobación de rol en el navegador NO es seguridad real: eso requiere un servidor (etapa siguiente).
(function () {
    "use strict";

    var BOOKS_KEY = "bookverse_libros";
    var PANEL = document.body.dataset.panel;          // "admin" | "usuario"
    var LOGIN_URL = "../login/index.html";
    var COVERS = [
        ["#5b6b45", "#2f3a27", "#f1e6c4"], ["#e4c4a6", "#a8735a", "#4a2f27"], ["#2f5a78", "#1b3552", "#f1e6c4"],
        ["#7a2323", "#3b1111", "#f1d9b0"], ["#d6b45b", "#8a6a2c", "#2b2416"], ["#4a6355", "#233a30", "#f1e6c4"]
    ];
    var SEED = [
        ["Cien años de soledad", "Gabriel García Márquez", "Realismo mágico"],
        ["Orgullo y prejuicio", "Jane Austen", "Romance"],
        ["El principito", "Antoine de Saint-Exupéry", "Fantasía"],
        ["1984", "George Orwell", "Distopía"],
        ["El gran Gatsby", "F. Scott Fitzgerald", "Clásico"],
        ["La sombra del viento", "Carlos Ruiz Zafón", "Misterio"]
    ];
    var ARTICLES_KEY = "bookverse_articulos";
    var STATES = { pendiente: "Por leer", leyendo: "Leyendo", leido: "Leído" };

    function $(id) { return document.getElementById(id); }
    function esc(text) {
        return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
        });
    }
    function norm(text) { return String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    function readJSON(key, fallback) {
        try { var value = JSON.parse(localStorage.getItem(key)); return value == null ? fallback : value; } catch (e) { return fallback; }
    }
    function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
    function newId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }
    function isAdmin(user) { return user && user.rol === "administrador"; }

    // ---------- Acceso ----------
    var user = getCurrentUser();
    if (!user) { location.replace(LOGIN_URL); return; }
    if (PANEL === "admin" && !isAdmin(user)) { location.replace("../usuario/dashboard.html"); return; }
    if (PANEL === "usuario" && isAdmin(user)) { location.replace("../admin/dashboard.html"); return; }
    document.body.classList.remove("guard");

    // ---------- Datos ----------
    function getBooks() {
        var books = readJSON(BOOKS_KEY, null);
        if (!Array.isArray(books)) {
            books = SEED.map(function (b, i) { return { id: "demo-" + (i + 1), titulo: b[0], autor: b[1], genero: b[2], descripcion: "" }; });
            writeJSON(BOOKS_KEY, books);
        }
        return books;
    }
    function getArticles() { var a=readJSON(ARTICLES_KEY,[]); return Array.isArray(a)?a:[]; }
    function saveArticles(a) { writeJSON(ARTICLES_KEY,a); }
    function compareBooks(a,b,sort) { var field=sort.indexOf("autor")===0?"autor":"titulo"; var v=String(a[field]).localeCompare(String(b[field]),"es",{sensitivity:"base"}); return sort.endsWith("desc")?-v:v; }
    function sortedBooks(books,sort) { return books.slice().sort(function(a,b){return compareBooks(a,b,sort||"titulo");}); }
    function layoutFor(id) { var select=document.querySelector('[data-layout="'+id+'"]'); return select?select.value:"grid"; }
    function setBookLayout(id) { var el=$(id); if(el) el.classList.remove("layout-list","layout-compact"); if(el && layoutFor(id)!=="grid") el.classList.add("layout-"+layoutFor(id)); }
    function displayCollection(id,books,actions) {
      var search=document.querySelector('[data-filter="'+id+'"]'), sort=document.querySelector('[data-sort="'+id+'"]');
      var q=search?norm(search.value):"";
      var filtered=sortedBooks(books.filter(function(b){return !q||norm(b.titulo+" "+b.autor+" "+b.genero).includes(q);}),sort?sort.value:"titulo");
      $(id).innerHTML=filtered.map(function(b){return bookCard(b,actions(b));}).join("")||empty("No hay libros que mostrar.");
      setBookLayout(id);
    }
    function saveBooks(books) { writeJSON(BOOKS_KEY, books); }
    function favKey() { return "bookverse_favoritos_" + user.id; }
    function readKey() { return "bookverse_lectura_" + user.id; }
    function getFavs() { var f = readJSON(favKey(), []); return Array.isArray(f) ? f : []; }
    function getReads() { var r = readJSON(readKey(), []); return Array.isArray(r) ? r : []; }

    // ---------- Interfaz común ----------
    var toastTimer;
    function toast(message) {
        var el = $("toast"); el.textContent = message; el.classList.add("show");
        clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2400);
    }
    function coverIndex(id) { var h = 0; String(id).split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return h % COVERS.length; }
    function bookCard(book, actions) {
        var c = COVERS[coverIndex(book.id)];
        return '<article class="book"><div class="cover" style="background:linear-gradient(135deg,' + c[0] + ',' + c[1] + ');color:' + c[2] + '">' +
            '<small>' + esc(book.autor) + '</small><strong>' + esc(book.titulo) + '</strong></div>' +
            '<div class="book-body"><span class="genre">' + esc(book.genero) + '</span><h3>' + esc(book.titulo) + '</h3><p>' + esc(book.autor) + '</p>' +
            (book.descripcion ? '<p class="desc">' + esc(book.descripcion) + '</p>' : '') +
            '<div class="actions">' + actions + '<button class="btn ghost small" type="button" data-detail="' + esc(book.id) + '">Detalles y lectura</button></div></div></article>';
    }
    function empty(message) { return '<p class="empty-msg">' + esc(message) + '</p>'; }
    function genresOf(books) {
        var seen = {}; books.forEach(function (b) { seen[b.genero] = true; });
        return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    var TITLES = {
        admin: { resumen: "Resumen", libros: "Gestión de libros", usuarios: "Usuarios", articulos: "Artículos" },
        usuario: { inicio: "Mi biblioteca", catalogo: "Catálogo", favoritos: "Mis favoritos", lecturas: "Lista de lectura", articulos: "Artículos" }
    }[PANEL];
    var FIRST = Object.keys(TITLES)[0];

    function route() {
        var view = location.hash.replace("#", "");
        if (!TITLES[view]) view = FIRST;
        document.querySelectorAll("section[data-view]").forEach(function (s) { s.hidden = s.dataset.view !== view; });
        document.querySelectorAll("#sideNav a").forEach(function (a) { a.classList.toggle("active", a.dataset.view === view); });
        $("panelTitle").textContent = TITLES[view];
        document.title = "BookVerse | " + TITLES[view];
        window.scrollTo(0, 0);
    }

    $("roleTag").textContent = isAdmin(user) ? "ADMINISTRADOR" : "USUARIO GENERAL";
    $("greeting").textContent = "Bienvenido, " + (user.nombre || user.correo) + ".";
    $("logoutBtn").addEventListener("click", function () { logoutUser(); location.href = "../index.html"; });
    window.addEventListener("hashchange", route);
    window.addEventListener("pageshow", function (e) { if (e.persisted && !getCurrentUser()) location.replace(LOGIN_URL); });
    window.addEventListener("storage", function () { if (!getCurrentUser()) location.replace(LOGIN_URL); });

    // =========================================================
    // ADMINISTRADOR
    // =========================================================
    function renderAdmin() {
        var books = getBooks(), users = getUsers();
        var q = norm($("adminSearch").value);

        $("adminStats").innerHTML =
            stat("Libros", books.length, "en el catálogo") + stat("Usuarios", users.length, users.filter(isAdmin).length + " administrador(es)") +
            stat("Géneros", genresOf(books).length, "distintos") + stat("Artículos", getArticles().length, "publicados");

        $("recentBooks").innerHTML = books.slice(-5).reverse().map(function (b) {
            return '<div class="mini-row"><div>' + esc(b.titulo) + '</div><span>' + esc(b.autor) + '</span></div>';
        }).join("") || empty("Aún no hay libros.");
        $("recentUsers").innerHTML = users.slice().sort(function (a, b) { return String(b.fechaRegistro).localeCompare(String(a.fechaRegistro)); }).slice(0, 5).map(function (u) {
            return '<div class="mini-row"><div>' + esc(u.nombre) + '</div><span>' + esc(u.correo) + '</span></div>';
        }).join("");

        var shown = books.filter(function (b) { return !q || norm(b.titulo + " " + b.autor + " " + b.genero).indexOf(q) !== -1; });
        shown = sortedBooks(shown, $("adminSort").value);
        $("adminBooks").innerHTML = shown.map(function (b) {
            return bookCard(b, '<button class="btn ghost small" data-act="edit" data-id="' + esc(b.id) + '">Editar</button>' +
                '<button class="btn danger small" data-act="del" data-id="' + esc(b.id) + '">Eliminar</button>');
        }).join("") || empty(books.length ? "Ningún libro coincide con la búsqueda." : "Aún no hay libros registrados.");

        $("usersTable").innerHTML = '<table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead><tbody>' +
            users.map(function (u) {
                var me = u.id === user.id, admins = users.filter(isAdmin).length;
                var locked = me || (isAdmin(u) && admins <= 1);
                return '<tr><td>' + esc(u.nombre) + (me ? '<span class="you">(tú)</span>' : '') + '</td><td>' + esc(u.correo) + '</td>' +
                    '<td><span class="badge ' + (isAdmin(u) ? 'admin' : '') + '">' + (isAdmin(u) ? 'Administrador' : 'Usuario') + '</span></td>' +
                    '<td>' + (u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString("es") : "—") + '</td>' +
                    '<td><div class="row-actions"><button class="btn ghost small" data-act="role" data-id="' + esc(u.id) + '"' + (locked ? " disabled" : "") + '>' +
                    (isAdmin(u) ? "Quitar admin" : "Hacer admin") + '</button>' +
                    '<button class="btn danger small" data-act="deluser" data-id="' + esc(u.id) + '"' + (locked ? " disabled" : "") + '>Eliminar</button></div></td></tr>';
            }).join("") + '</tbody></table>';
    }
    function stat(label, value, hint) { return '<div class="stat"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong><em>' + esc(hint) + '</em></div>'; }

    function initAdmin() {
        var dialog = $("bookDialog"), editingId = null;
        function openDialog(book) {
            editingId = book ? book.id : null;
            $("dialogTitle").textContent = book ? "Editar libro" : "Nuevo libro";
            $("fTitulo").value = book ? book.titulo : ""; $("fAutor").value = book ? book.autor : "";
            $("fGenero").value = book ? book.genero : ""; $("fDescripcion").value = book ? (book.descripcion || "") : "";
            $("generos").innerHTML = genresOf(getBooks()).concat(["Romance", "Misterio", "Fantasía", "Ciencia ficción"]).filter(function (g, i, a) { return a.indexOf(g) === i; })
                .map(function (g) { return '<option value="' + esc(g) + '">'; }).join("");
            dialog.showModal(); $("fTitulo").focus();
        }
        $("newBookBtn").addEventListener("click", function () { openDialog(null); });
        $("cancelBook").addEventListener("click", function () { dialog.close(); });
        $("adminSearch").addEventListener("input", renderAdmin);
        $("adminSort").addEventListener("change", renderAdmin);

        $("bookForm").addEventListener("submit", function (e) {
            e.preventDefault();
            var data = { titulo: $("fTitulo").value.trim(), autor: $("fAutor").value.trim(), genero: $("fGenero").value.trim(), descripcion: $("fDescripcion").value.trim() };
            if (!data.titulo || !data.autor || !data.genero) { toast("Completa título, autor y género."); return; }
            var books = getBooks();
            var duplicate = books.some(function (b) {
                return b.id !== editingId && norm(b.titulo.trim()) === norm(data.titulo) && norm(b.autor.trim()) === norm(data.autor);
            });
            if (duplicate) { toast("Este libro y autor ya están registrados."); return; }
            if (editingId) {
                books = books.map(function (b) { return b.id === editingId ? Object.assign({}, b, data) : b; });
                toast("Libro actualizado.");
            } else {
                books.push(Object.assign({ id: newId() }, data)); toast("Libro agregado.");
            }
            saveBooks(books); dialog.close(); renderAdmin();
        });

        document.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-act]"); if (!btn || btn.disabled) return;
            var id = btn.dataset.id, act = btn.dataset.act;
            if (act === "edit") { var book = getBooks().filter(function (b) { return b.id === id; })[0]; if (book) openDialog(book); }
            if (act === "del") {
                var target = getBooks().filter(function (b) { return b.id === id; })[0];
                if (target && confirm("¿Eliminar «" + target.titulo + "» del catálogo?")) { saveBooks(getBooks().filter(function (b) { return b.id !== id; })); renderAdmin(); toast("Libro eliminado."); }
            }
            if (act === "role" || act === "deluser") {
                var users = getUsers(), u = users.filter(function (x) { return x.id === id; })[0];
                if (!u || u.id === user.id) return;
                if (act === "role") {
                    u.rol = isAdmin(u) ? "usuario" : "administrador"; saveUsers(users); toast("Rol actualizado: " + u.nombre + ".");
                } else if (confirm("¿Eliminar la cuenta de " + u.nombre + "? También se borran sus favoritos y lecturas.")) {
                    saveUsers(users.filter(function (x) { return x.id !== id; }));
                    try { localStorage.removeItem("bookverse_favoritos_" + id); localStorage.removeItem("bookverse_lectura_" + id); } catch (err) {}
                    toast("Usuario eliminado.");
                }
                renderAdmin();
            }
        });
        renderAdmin();
    }

    // =========================================================
    // USUARIO GENERAL
    // =========================================================
    function renderUser() {
        var books = getBooks(), favs = getFavs(), reads = getReads();
        var byId = {}; books.forEach(function (b) { byId[b.id] = b; });
        var readList = reads.filter(function (r) { return byId[r.id]; });
        var count = function (s) { return readList.filter(function (r) { return r.estado === s; }).length; };

        $("userStats").innerHTML = stat("Libros disponibles", books.length, "en el catálogo") + stat("Mis favoritos", favs.filter(function (id) { return byId[id]; }).length, "guardados") +
            stat("Leyendo", count("leyendo"), "en curso") + stat("Leídos", count("leido"), "terminados");

        displayCollection("readingNow", readList.filter(function(r){return r.estado==="leyendo";}).map(function(r){return byId[r.id];}),function(b){return readActions(readList.find(function(r){return r.id===b.id;}));});

        // catálogo con búsqueda y filtro
        var select = $("genreFilter"), current = select.value;
        select.innerHTML = '<option value="">Todos los géneros</option>' + genresOf(books).map(function (g) { return '<option>' + esc(g) + '</option>'; }).join("");
        select.value = genresOf(books).indexOf(current) !== -1 ? current : "";
        var q = norm($("userSearch").value);
        var shown = books.filter(function (b) { return (!q || norm(b.titulo + " " + b.autor).indexOf(q) !== -1) && (!select.value || b.genero === select.value); });
        var sort = $("bookSort").value;
        shown.sort(function (a, b) {
            var field = sort === "autor" ? "autor" : "titulo";
            var result = String(a[field]).localeCompare(String(b[field]), "es", { sensitivity: "base" });
            return sort === "titulo-desc" ? -result : result;
        });
        $("catalog").innerHTML = shown.map(function (b) {
            var fav = favs.indexOf(b.id) !== -1, inList = reads.some(function (r) { return r.id === b.id; });
            return bookCard(b, '<button class="btn ghost small heart ' + (fav ? "on" : "") + '" data-act="fav" data-id="' + esc(b.id) + '" aria-pressed="' + fav + '">' + (fav ? "♥ Favorito" : "♡ Favorito") + '</button>' +
                '<button class="btn ghost small" data-act="read" data-id="' + esc(b.id) + '"' + (inList ? " disabled" : "") + '>' + (inList ? "En mi lista" : "+ Leer") + '</button>');
        }).join("") || empty(books.length ? "Ningún libro coincide con tu búsqueda." : "No hay libros disponibles todavía.");

        setBookLayout("catalog");
        displayCollection("favorites",books.filter(function(b){return favs.includes(b.id);}),function(b){return '<button class="btn danger small" data-act="fav" data-id="'+esc(b.id)+'">Quitar de favoritos</button>';});
        displayCollection("readingList",readList.map(function(r){return byId[r.id];}),function(b){return readActions(readList.find(function(r){return r.id===b.id;}));});
    }
    function readActions(r) {
        return '<select data-act="state" data-id="' + esc(r.id) + '" aria-label="Estado de lectura">' +
            Object.keys(STATES).map(function (k) { return '<option value="' + k + '"' + (r.estado === k ? " selected" : "") + '>' + STATES[k] + '</option>'; }).join("") + '</select>' +
            '<button class="btn danger small" data-act="unread" data-id="' + esc(r.id) + '">Quitar</button>';
    }

    function initUser() {
        $("userSearch").addEventListener("input", renderUser);
        $("genreFilter").addEventListener("change", renderUser);
        $("bookSort").addEventListener("change", renderUser);
        document.querySelectorAll("[data-filter],[data-sort],[data-layout]").forEach(function(el){el.addEventListener(el.tagName==="INPUT"?"input":"change",renderUser);});
        document.addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-act]"); if (!btn || btn.disabled) return;
            var id = btn.dataset.id, act = btn.dataset.act;
            if (act === "fav") {
                var favs = getFavs(), i = favs.indexOf(id);
                if (i === -1) { favs.push(id); toast("Agregado a favoritos."); } else { favs.splice(i, 1); toast("Quitado de favoritos."); }
                writeJSON(favKey(), favs);
            }
            if (act === "read") { var reads = getReads(); reads.push({ id: id, estado: "pendiente" }); writeJSON(readKey(), reads); toast("Agregado a tu lista de lectura."); }
            if (act === "unread") { writeJSON(readKey(), getReads().filter(function (r) { return r.id !== id; })); toast("Quitado de tu lista."); }
            renderUser();
        });
        document.addEventListener("change", function (e) {
            var sel = e.target.closest("select[data-act='state']"); if (!sel) return;
            writeJSON(readKey(), getReads().map(function (r) { return r.id === sel.dataset.id ? { id: r.id, estado: sel.value } : r; }));
            toast("Estado: " + STATES[sel.value] + "."); renderUser();
        });
        window.addEventListener("bv6:updated", function(){ renderUser(); });
        renderUser();
    }

    function articleCard(a,admin) {
      return '<article class="book article-card"><div class="book-body"><span class="genre">ARTÍCULO LITERARIO</span><h3>'+esc(a.titulo)+'</h3><p>Por '+esc(a.autor)+'</p><p class="article-content">'+esc(a.contenido)+'</p>'+(admin?'<div class="actions"><button class="btn ghost small" data-article="edit" data-id="'+esc(a.id)+'">Editar</button><button class="btn danger small" data-article="delete" data-id="'+esc(a.id)+'">Eliminar</button></div>':'')+'</div></article>';
    }
    function renderArticles() {
      var articles=getArticles().slice().reverse();
      if(PANEL==="admin") { $("articleAdminList").innerHTML=articles.map(function(a){return articleCard(a,true);}).join("")||empty("Todavía no hay artículos. Crea el primero."); }
      else { var q=norm($("articleSearch").value); $("articleUserList").innerHTML=articles.filter(function(a){return norm(a.titulo+" "+a.autor+" "+a.contenido).includes(q);}).map(function(a){return articleCard(a,false);}).join("")||empty("No se encontraron artículos."); }
    }
    function initArticles() {
      if(PANEL==="admin") {
        var dlg=$("articleDialog"), editing=null;
        $("newArticleBtn").addEventListener("click",function(){editing=null;$("articleForm").reset();$("articleDialogTitle").textContent="Nuevo artículo";dlg.showModal();});
        $("cancelArticle").addEventListener("click",function(){dlg.close();});
        $("articleForm").addEventListener("submit",function(e){e.preventDefault();var a=getArticles(),data={titulo:$("articleTitle").value.trim(),autor:$("articleAuthor").value.trim(),contenido:$("articleContent").value.trim()};if(!data.titulo||!data.autor||!data.contenido){toast("Completa todos los campos.");return;}if(editing){a=a.map(function(x){return x.id===editing?Object.assign({},x,data):x;});}else{a.push(Object.assign({id:newId(),fecha:new Date().toISOString()},data));}saveArticles(a);dlg.close();renderArticles();renderAdmin();toast("Artículo guardado.");});
        document.addEventListener("click",function(e){var b=e.target.closest("button[data-article]");if(!b)return;var a=getArticles(),x=a.find(function(y){return y.id===b.dataset.id;});if(!x)return;if(b.dataset.article==="edit"){editing=x.id;$("articleDialogTitle").textContent="Editar artículo";$("articleTitle").value=x.titulo;$("articleAuthor").value=x.autor;$("articleContent").value=x.contenido;dlg.showModal();}else if(confirm("¿Eliminar este artículo?")){saveArticles(a.filter(function(y){return y.id!==x.id;}));renderArticles();renderAdmin();toast("Artículo eliminado.");}});
      }else{$("articleSearch").addEventListener("input",renderArticles);}
      renderArticles();
    }
    // Restaurar preferencias ANTES de dibujar las colecciones.
    if (PANEL === "usuario") {
        var prefKey = "bookverse_preferencias_" + String(user.id || user.correo || "usuario");
        var preferences = readJSON(prefKey, {});
        document.querySelectorAll("[data-layout],[data-sort],#bookSort").forEach(function(el) {
            var key = el.dataset.layout ? "layout:" + el.dataset.layout : el.dataset.sort ? "sort:" + el.dataset.sort : "bookSort";
            if (preferences[key] && Array.from(el.options).some(function(o){ return o.value === preferences[key]; })) el.value = preferences[key];
            el.addEventListener("change", function() {
                var next = readJSON(prefKey, {}); next[key] = el.value; writeJSON(prefKey, next);
            });
        });
    }
    route();
    if (PANEL === "admin") initAdmin(); else initUser();
    initArticles();
})();
