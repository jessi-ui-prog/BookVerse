/* Owl Login by @codinvisual · t.me/CodinVisual · free for your own site, don't resell this file */
// Ajustes del búho y contraseña de la demo
const COVER = -159;
const PEEK = -65;
const SPREAD = 40;
const STIFF = 0.12;
const DAMP = 0.74;
const HOP = 2.6;
const NUDGE = 3;


// Vínculo con BookVerse
const HOME_URL = '../index.html';       // a dónde vuelve el usuario al iniciar sesión
// SESSION_KEY ('bookverse_user') ya se declara en auth.js; declararla también aquí rompía auth.js ("already been declared").
const REDIRECT_DELAY = 1700;
const REGISTER_URL = 'registro.html';            // ms que dura la celebración del búho antes de volver

// Apartados de BookVerse que piden sesión (los mismos de index.html / js/main.js)
const SECTION_NAMES = { biblioteca: 'Biblioteca', categorias: 'Categorías', nosotros: 'Nosotros' };

