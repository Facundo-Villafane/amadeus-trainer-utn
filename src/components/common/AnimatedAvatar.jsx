// src/components/common/AnimatedAvatar.jsx
import { useEffect, useRef, useState } from 'react';
import { getProfilePhotoUrl } from '../../utils/profileUtils';
import { registerAvatarEyes } from '../../utils/avatarEyeTracker';

// Cache en memoria: varios avatares pueden pedir el mismo seed en la misma
// pantalla (ej. el mismo usuario aparece en el podio y en la tabla)
const svgCache = new Map();

async function fetchSvgText(url) {
  if (svgCache.has(url)) return svgCache.get(url);
  const promise = fetch(url).then(res => {
    if (!res.ok) throw new Error(`DiceBear ${res.status}`);
    return res.text();
  });
  svgCache.set(url, promise);
  return promise;
}

/**
 * Avatar de usuario. Para fotos reales (Google) o Gravatar se comporta como
 * un <img> normal. Para avatares DiceBear, inyecta el SVG en el DOM y hace
 * que los ojos sigan al cursor (trackEyes=true) además del parpadeo/salto
 * en loop que ya trae el SVG animado.
 *
 * @param {Object} props
 * @param {Object} props.user
 * @param {number} [props.size=80]
 * @param {string} [props.alt='Avatar']
 * @param {string} [props.className]
 * @param {boolean} [props.trackEyes=false]
 */
export default function AnimatedAvatar({ user, size = 80, alt = 'Avatar', className = '', trackEyes = false }) {
  const url = getProfilePhotoUrl(user, size);
  const isDiceBear = url.includes('api.dicebear.com');
  const containerRef = useRef(null);
  const [svgMarkup, setSvgMarkup] = useState(null);

  useEffect(() => {
    if (!isDiceBear) {
      setSvgMarkup(null);
      return;
    }
    let cancelled = false;
    fetchSvgText(url)
      .then(text => { if (!cancelled) setSvgMarkup(text); })
      .catch(() => { if (!cancelled) setSvgMarkup(null); });
    return () => { cancelled = true; };
  }, [url, isDiceBear]);

  useEffect(() => {
    if (!trackEyes || !svgMarkup || !containerRef.current) return;
    const lookEl = containerRef.current.querySelector('.dbga-look');
    if (!lookEl) return;
    return registerAvatarEyes(lookEl);
  }, [trackEyes, svgMarkup]);

  if (isDiceBear && svgMarkup) {
    return (
      <span
        ref={containerRef}
        role="img"
        aria-label={alt}
        className={className}
        style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
        // El markup viene de la API de DiceBear (misma URL que ya se usaba en <img src>), no de input de usuario
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  }

  // Foto real, Gravatar, o mientras carga el SVG por primera vez
  return <img src={url} alt={alt} className={className} width={size} height={size} />;
}
