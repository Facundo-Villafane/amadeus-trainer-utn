// src/utils/avatarEyeTracker.js
//
// Hace que los ojos de los avatares DiceBear (estilo "gaze") sigan al cursor.
// El SVG de DiceBear ya trae una animación de "mirada" en loop (clase .dbga-look),
// pero corre sola vía CSS y no reacciona al mouse. Acá la desactivamos por avatar
// y la reemplazamos por un transform manejado a mano según la posición real del cursor.
//
// Un solo listener de mousemove (compartido entre todos los avatares registrados)
// más un loop de requestAnimationFrame actualizan todas las instancias activas,
// en vez de un listener por avatar.

const MAX_OFFSET_PX = 3.2; // mismo orden de magnitud que la animación original de DiceBear
const registered = new Set();

let mouseX = 0;
let mouseY = 0;
let hasMouse = false;
let rafId = null;
let listenerAttached = false;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function onMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  hasMouse = true;
}

function tick() {
  rafId = null;
  if (!hasMouse || registered.size === 0) return;

  registered.forEach((lookEl) => {
    if (!lookEl.isConnected) {
      registered.delete(lookEl);
      return;
    }
    const rect = lookEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.hypot(dx, dy) || 1;

    // Ángulo hacia el cursor, magnitud acotada (los ojos no se "salen" del hueco)
    const offset = Math.min(MAX_OFFSET_PX, dist / 20);
    const x = (dx / dist) * offset;
    const y = (dy / dist) * offset;

    lookEl.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  });

  scheduleTick();
}

function scheduleTick() {
  if (rafId === null) {
    rafId = requestAnimationFrame(tick);
  }
}

/**
 * Registra el grupo `.dbga-look` de un avatar inlineado para que empiece a
 * seguir al cursor. Apaga la animación en loop propia de DiceBear para ese
 * elemento puntual (el resto de la animación — parpadeo, salto — sigue igual).
 * @param {SVGGElement} lookEl
 * @returns {() => void} función para des-registrar el avatar (llamar al desmontar)
 */
export function registerAvatarEyes(lookEl) {
  if (!lookEl || prefersReducedMotion()) return () => {};

  lookEl.style.animation = 'none';
  lookEl.style.transition = 'transform 0.12s ease-out';
  registered.add(lookEl);

  if (!listenerAttached) {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    listenerAttached = true;
  }
  scheduleTick();

  return () => {
    registered.delete(lookEl);
    if (registered.size === 0 && listenerAttached) {
      window.removeEventListener('mousemove', onMouseMove);
      listenerAttached = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}
