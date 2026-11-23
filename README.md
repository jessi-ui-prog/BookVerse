# BookVerse - Etapa 1

Biblioteca virtual desarrollada como proyecto académico de Programación Web.

## Tecnologías
- HTML5
- CSS3
- JavaScript
- Bootstrap 5 (incluido mediante CDN para apoyo de presentación y adaptación).

## Cómo ejecutar
1. Descarga y descomprime la carpeta del proyecto.
2. Abre la carpeta `BookVerse_Etapa1` en Visual Studio Code.
3. Abre `index.html` en un navegador. También puedes utilizar la extensión Live Server.
4. No se necesita instalar JSON Server todavía; se configurará en una etapa posterior.

## Estructura
- `index.html`: estructura de la página principal.
- `css/styles.css`: estilos y diseño adaptable.
- `js/main.js`: menú móvil, buscador local y año del pie de página.
- `assets/`: recursos gráficos del proyecto.
- `login/`: página de inicio de sesión con el búho animado (ver abajo).

## Apartados y acceso obligatorio (Etapa 2)
`index.html` funciona como una sola página con **apartados** que se abren de uno en uno. La ruta va en el hash de la URL:

| Ruta | Apartado | ¿Pide sesión? |
|---|---|---|
| `#inicio` (o sin hash) | Hero y franja de características | No |
| `#biblioteca` | Catálogo con buscador | Sí |
| `#biblioteca/romance`, `/misterio`, `/fantasia`, `/ciencia-ficcion` | Catálogo filtrado por género (se abre desde las tarjetas de Categorías) | Sí |
| `#categorias` | Géneros | Sí |
| `#nosotros` | Quiénes somos | Sí |

- **Cómo funciona:** cada apartado es una `<section class="view" data-view="...">`. `js/main.js` lee el hash y muestra solo el apartado pedido.
- **Acceso obligatorio:** si alguien intenta abrir un apartado privado sin sesión (con el menú, un botón o escribiendo la URL), se le manda a `login/index.html?next=#apartado`. El login le dice a qué quería entrar y, al iniciar sesión, lo devuelve a ese mismo apartado. Sin sesión, el menú muestra un candado junto a los apartados privados.
- **Cerrar sesión** (menú) vuelve a Inicio.
- **Añadir un apartado nuevo:** crea su `<section class="view" data-view="nombre" hidden>`, añade el enlace en el menú con `data-nav="nombre"` (y `data-protected` si pide sesión) y agrégalo a `VIEWS` en `js/main.js` y a `SECTION_NAMES` en `login/js/config.js`. Para hacerlo público, añádelo a `PUBLIC_VIEWS`.
- **Importante (limitación):** esta protección es de demostración y se ejecuta en el navegador. El contenido de los apartados privados sigue dentro del HTML, así que alguien con conocimientos técnicos podría verlo con las herramientas del navegador. Para proteger contenido de verdad, la sesión y las páginas privadas deben validarse en un servidor.

## Login (vinculado a BookVerse)
```
login/
├── index.html        # Marcado del login
├── css/login.css     # Estilos; usa las variables de ../css/styles.css
└── js/
    ├── config.js     # Ajustes del búho, contraseña demo, HOME_URL y SESSION_KEY
    ├── sprites.js    # Dibujo del búho y paleta (colores de BookVerse)
    ├── owl.js        # Animación (resortes, canvas, mirada, parpadeo)
    └── login.js      # Formulario, mostrar contraseña y envío
```
- **Colores compartidos:** `login/index.html` carga primero `../css/styles.css` y después `css/login.css`, así que la paleta (`--gold`, `--black`, `--cream`…) se define una sola vez.
- **Enlaces:** el menú de `index.html` tiene «Iniciar sesión» → `login/index.html`; el login vuelve a BookVerse desde el logo, «← Volver a BookVerse» o, tras iniciar sesión, automáticamente.
- **Sesión de demostración:** al entrar con la contraseña `nightowl42` se guarda el correo en `sessionStorage` (`bookverse_user`) y el menú de BookVerse muestra «Cerrar sesión». Es solo una demo: la contraseña es visible en el código. Para un login real, sustituye `signIn()` en `login/js/login.js` por un `fetch()` a tu servidor.
- Los scripts son clásicos (no módulos ES) y el orden de carga importa: `config` → `sprites` → `owl` → `login`.
- Búho original: @codinvisual · t.me/CodinVisual.

## Tema claro / oscuro con lámpara
Una lámpara fija en la esquina inferior derecha cambia el tema: **jala la cuerda dorada** (o haz clic / toca, o usa Enter/Espacio con el teclado). Lámpara encendida = tema claro; apagada = tema oscuro. La elección se guarda en `localStorage` (`bookverse_theme`) y se comparte entre inicio, login y registro; la primera vez se usa la preferencia del sistema.
- `js/theme.js`: aplica el tema antes de pintar (va en `<head>`), crea la lámpara y guarda la elección.
- `css/theme.css`: colores de cada tema (bloques `html[data-theme="dark"]` y `html[data-theme="light"]`) y estilos de la lámpara. Tamaño en `--lamp-scale`, posición en `--lamp-right` / `--lamp-bottom`.
- Cargado en `index.html`, `login/index.html` y `login/registro.html`. La lámpara está adaptada de «Animated Lamp Login» (misma estética, tamaño reducido).
- Para teñir un componente nuevo en cada tema, añade sus reglas en `theme.css` bajo `html[data-theme="light"]` / `html[data-theme="dark"]`.

## Etapa 3: paneles de usuario
- `admin/dashboard.html`: resumen, gestión de libros (agregar, editar, eliminar, buscar), usuarios (cambiar rol, eliminar; no puedes tocar tu propia cuenta ni dejar al sistema sin administrador) y un apartado de artículos reservado para la etapa 5.
- `usuario/dashboard.html`: resumen, catálogo con búsqueda y filtro por género, favoritos y lista de lectura (Por leer / Leyendo / Leído). Los favoritos y las lecturas son **por usuario** (`bookverse_favoritos_<id>`, `bookverse_lectura_<id>`).
- `css/paneles.css` y `js/paneles.js` son compartidos; usan la sesión de `login/js/auth.js` y respetan el tema claro/oscuro con la lámpara.
- Tras iniciar sesión, el administrador entra a su panel y el usuario al suyo (si el login venía de un enlace protegido con `?next=`, se respeta ese destino). En el sitio aparece «Mi panel» cuando hay sesión.
- Cada rol solo abre su panel: si no, se le redirige al suyo o al login. Esto es solo comodidad de demostración; la seguridad real exige validar en un servidor.
- Los libros (`bookverse_libros`) se siembran con los 6 del catálogo. El catálogo de la página de inicio sigue siendo estático: se conectará a estos datos con JSON Server en la siguiente etapa.

## Estado
Etapa 1: diseño visual y estructura inicial. Los libros mostrados son datos de demostración; la conexión con Open Library se realizará posteriormente.


## Etapa 2: registro, inicio de sesión y roles

Se agregó un formulario de registro en `login/registro.html` y autenticación de demostración mediante un arreglo JSON guardado en `localStorage`.

### Cuentas de prueba
- Administrador: `admin@bookverse.com` / `admin123`
- Usuario general: `usuario@bookverse.com` / `user123`

Los usuarios que se registran desde el formulario reciben el rol `usuario`. El rol del administrador de demostración está asignado en el arreglo inicial de usuarios.

### Archivos nuevos o modificados
- `login/js/auth.js`: funciones para crear usuarios, iniciar sesión, leer sesión y cerrar sesión.
- `login/registro.html`, `login/css/registro.css`, `login/js/registro.js`: formulario de registro y validaciones.
- `login/js/login.js`: valida el correo y contraseña contra los usuarios guardados.
- `login/index.html`: agrega el acceso al registro y carga el módulo de autenticación.
- `js/main.js`: lee la sesión JSON guardada y actualiza el acceso de la página principal.

### Cómo probar
1. Abre `index.html` con Live Server.
2. Selecciona Iniciar sesión.
3. Prueba las dos cuentas de demostración.
4. Cierra sesión y selecciona “Regístrate aquí” para crear una cuenta nueva.
5. Inicia sesión con la cuenta nueva.

### Importante sobre seguridad
Esta etapa usa `localStorage` para cumplir el prototipo académico. Los datos se guardan en el navegador y las contraseñas quedan visibles para quien inspeccione el almacenamiento. No debe usarse para cuentas reales. En una aplicación real, la autenticación y el almacenamiento seguro de contraseñas deben realizarse en un servidor.
