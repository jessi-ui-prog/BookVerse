// Login de BookVerse: conserva las animaciones del búho y valida usuarios registrados.
const nextMatch = /^#([a-z]+)(\/[a-z-]+)?$/.exec(new URLSearchParams(location.search).get('next') || '');
const nextHash = nextMatch && Object.prototype.hasOwnProperty.call(SECTION_NAMES, nextMatch[1]) ? nextMatch[0] : '';
if (nextHash) {
    document.querySelector('.owl-form .lead').textContent = 'Inicia sesión para entrar a «' + SECTION_NAMES[nextMatch[1]] + '».';
}

mail.onfocus = lookAtCaret;
mail.oninput = lookAtCaret;
mail.onblur = () => { owl.lookX.to = 0; owl.lookY.to = 0.6; };
pass.onfocus = () => wings(COVER, COVER);
pass.onblur = e => { if (e.relatedTarget !== show) wings(0, 0); };
pass.oninput = () => { note.textContent = ''; owl.left.v -= NUDGE; owl.right.v -= NUDGE; };
show.onpointerdown = e => e.preventDefault();
show.onclick = () => {
    pass.focus();
    const peek = pass.type === 'password';
    pass.type = peek ? 'text' : 'password';
    wings(COVER, peek ? PEEK : COVER);
    show.setAttribute('aria-pressed', peek);
    show.setAttribute('aria-label', peek ? 'Ocultar contraseña' : 'Mostrar contraseña');
    const r = pass.getBoundingClientRect();
    if (peek) lookAt(r.left + 70, r.top + r.height / 2);
};
room.addEventListener('pointermove', e => {
    if (document.activeElement !== mail && document.activeElement !== pass) lookAt(e.clientX, e.clientY);
});

function cheer() {
    owl.happy = true;
    wings(SPREAD, SPREAD);
    owl.hop.v = HOP;
    setTimeout(() => { owl.happy = false; wings(0, 0); }, 1500);
}
function shakeHead() {
    owl.shake.v = 1.6;
    owl.frown = 0.4;
    setTimeout(() => { owl.frown = 0; }, 900);
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión…';
    note.textContent = '';
    try {
        await new Promise(done => setTimeout(done, 250));
        const user = authenticateUser(mail.value, pass.value);
        cheer();
        form.classList.add('done');
        btn.textContent = 'Sesión iniciada';
        // sin destino pedido (?next=), cada rol entra a su panel; con destino se respeta
        const target = nextHash ? HOME_URL + nextHash
            : (user.rol === 'administrador' ? '../admin/dashboard.html' : '../usuario/dashboard.html');
        setTimeout(() => { location.href = target; }, still.matches ? 400 : REDIRECT_DELAY);
    } catch (err) {
        shakeHead();
        note.textContent = err.message;
        btn.disabled = false;
        btn.textContent = 'Iniciar sesión';
    }
});
