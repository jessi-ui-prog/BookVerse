// BOOKVERSE - Tema claro / oscuro con lámpara de cuerda
// Se carga en <head> (sin defer) para aplicar el tema ANTES de pintar y evitar el parpadeo.
// Lámpara encendida = tema claro · lámpara apagada = tema oscuro.
// La elección se guarda en localStorage ("bookverse_theme") y se comparte entre index, login y registro.
(function () {
    "use strict";

    var KEY = "bookverse_theme";
    var root = document.documentElement;
    var reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

    function readStored() {
        try {
            var value = localStorage.getItem(KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch (error) { return null; }
    }
    function systemTheme() {
        return window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    var theme = readStored() || systemTheme();
    root.setAttribute("data-theme", theme);

    // ---------- Lámpara ----------
    var lamp, handle, path, fireflies, hint;
    var dragging = false, startX = 0, startY = 0, dragX = 0, dragY = 0, moved = 0;

    var LAMP_HTML =
        '<div class="bv-lamp" id="bvLamp">' +
            '<div class="bv-lamp-body">' +
                '<div class="lamp-glow"></div>' +
                '<div class="lamp-head"></div>' +
                '<div class="light-beam"></div>' +
                '<div class="lamp-stem"></div>' +
                '<div class="lamp-base"></div>' +
                '<svg class="string-svg" aria-hidden="true"><path id="bvStringPath" d="M 0 0 L 0 80"></path></svg>' +
                '<button class="string-handle" id="bvStringHandle" type="button" role="switch" aria-checked="false" ' +
                    'aria-label="Tema claro: jala la lámpara para cambiar de tema" title="Jala la lámpara para cambiar de tema"></button>' +
            '</div>' +
        '</div>' +
        '<p class="bv-lamp-hint" id="bvLampHint" aria-hidden="true">Jala la cuerda<i></i></p>' +
        '<div class="bv-wash" aria-hidden="true"></div>' +
        '<div class="fireflies" id="bvFireflies" aria-hidden="true"></div>';

    function random(min, max) { return Math.random() * (max - min) + min; }

    function createFireflies() {
        fireflies.innerHTML = "";
        if (reduceMotion) return;
        for (var i = 0; i < 14; i++) {
            var dot = document.createElement("span");
            dot.className = "firefly";
            var size = random(3, 6);
            dot.style.width = size + "px";
            dot.style.height = size + "px";
            dot.style.setProperty("--duration", random(35, 65) + "s");
            dot.style.setProperty("--delay", "-" + random(0, 30) + "s");
            for (var n = 1; n <= 5; n++) {
                dot.style.setProperty("--x" + n, random(0, 100) + "vw");
                dot.style.setProperty("--y" + n, random(0, 100) + "vh");
            }
            fireflies.appendChild(dot);
        }
    }

    function updateString(x, y) { path.setAttribute("d", "M 0 0 L " + x + " " + (80 + y)); }
    function resetHandle() {
        handle.style.transform = "translate(0px, 0px)";
        updateString(0, 0);
    }

    function syncLamp() {
        if (!lamp) return;
        var light = root.getAttribute("data-theme") === "light";
        lamp.classList.toggle("on", light);
        handle.setAttribute("aria-checked", String(light));
        handle.setAttribute("aria-label", light ? "Tema claro activado: jala la lámpara para pasar a tema oscuro"
                                                : "Tema oscuro activado: jala la lámpara para pasar a tema claro");
        if (light) createFireflies(); else fireflies.innerHTML = "";
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", light ? "#f7f5f0" : "#111110");
    }

    function setTheme(next, save) {
        root.classList.add("theme-anim");
        root.setAttribute("data-theme", next);
        if (save) { try { localStorage.setItem(KEY, next); } catch (error) {} }
        syncLamp();
        clearTimeout(setTheme.timer);
        setTheme.timer = setTimeout(function () { root.classList.remove("theme-anim"); }, 900);
        if (hint) { hint.classList.add("gone"); try { localStorage.setItem("bookverse_lamp_hint", "1"); } catch (error) {} }
    }

    function toggle() { setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light", true); }

    // pequeño "tirón" de la cuerda cuando se activa con teclado o con un toque
    function tug() {
        handle.style.transform = "translate(0px, 46px)";
        updateString(0, 46);
        setTimeout(resetHandle, 160);
    }

    function pointerDown(event) {
        dragging = true; moved = 0;
        handle.classList.add("dragging");
        startX = event.clientX; startY = event.clientY; dragX = 0; dragY = 0;
        if (handle.setPointerCapture) { try { handle.setPointerCapture(event.pointerId); } catch (error) {} }
    }
    function pointerMove(event) {
        if (!dragging) return;
        dragX = Math.max(-35, Math.min(35, (event.clientX - startX) * 0.3));
        dragY = Math.min(180, Math.max(0, event.clientY - startY) * 0.6);
        moved = Math.max(moved, Math.abs(event.clientX - startX), Math.abs(event.clientY - startY));
        handle.style.transform = "translate(" + dragX + "px, " + dragY + "px)";
        updateString(dragX, dragY);
    }
    function pointerUp() {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove("dragging");
        var pulled = dragY > 30;
        var tapped = moved < 6;           // un toque o clic sin arrastrar también cambia el tema
        resetHandle();
        if (pulled || tapped) toggle();
    }

    function buildLamp() {
        var wrap = document.createElement("div");
        wrap.className = "bv-theme-root";
        wrap.innerHTML = LAMP_HTML;
        document.body.appendChild(wrap);

        lamp = wrap.querySelector("#bvLamp");
        handle = wrap.querySelector("#bvStringHandle");
        path = wrap.querySelector("#bvStringPath");
        fireflies = wrap.querySelector("#bvFireflies");
        hint = wrap.querySelector("#bvLampHint");

        var seen = false;
        try { seen = localStorage.getItem("bookverse_lamp_hint") === "1"; } catch (error) {}
        if (seen) hint.classList.add("gone");

        handle.addEventListener("pointerdown", pointerDown);
        handle.addEventListener("pointermove", pointerMove);
        handle.addEventListener("pointerup", pointerUp);
        handle.addEventListener("pointercancel", pointerUp);
        // teclado (Enter / Espacio): el clic sintético solo llega con detail 0
        handle.addEventListener("click", function (event) {
            if (event.detail === 0) { tug(); toggle(); }
        });

        syncLamp();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildLamp);
    else buildLamp();

    // si cambias el tema en otra pestaña, esta se actualiza sola
    window.addEventListener("storage", function (event) {
        if (event.key === KEY && (event.newValue === "light" || event.newValue === "dark")) setTheme(event.newValue, false);
    });
})();
