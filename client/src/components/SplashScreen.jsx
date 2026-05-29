import { useEffect, useRef } from 'react';

export function SplashScreen({ message = 'Запуск...' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let stars = [];
    let raf = 0;
    let running = true;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = [];
      for (let i = 0; i < 180; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * 1 + 0.3,
          size: Math.random() * 1.6 + 0.4,
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      if (!running) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0a0d1f');
      bg.addColorStop(0.5, '#0d1330');
      bg.addColorStop(1, '#06081a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // лёгкое тёплое свечение снизу — будто горизонт
      const glow = ctx.createRadialGradient(w / 2, h * 1.1, 30, w / 2, h * 1.1, h * 0.9);
      glow.addColorStop(0, 'rgba(255,140,60,0.18)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // звёзды летят вниз — иллюзия движения вверх
      ctx.fillStyle = '#ffffff';
      for (const s of stars) {
        s.y += s.z * 2.6;
        if (s.y > h) {
          s.y = -10;
          s.x = Math.random() * w;
        }
        ctx.globalAlpha = 0.5 + s.z * 0.45;
        // короткий стрик, чтобы было ощущение скорости
        ctx.fillRect(s.x, s.y, s.size, s.size + s.z * 6);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="splash">
      <canvas ref={canvasRef} className="splash-canvas" />
      <div className="splash-rocket">
        <div className="splash-trail" />
        <div className="splash-rocket-svg">
          <svg viewBox="0 0 140 210" width="140" height="210">
            <defs>
              <linearGradient id="sBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0d3b80" />
                <stop offset="22%" stopColor="#2a78d6" />
                <stop offset="50%" stopColor="#7ec6ff" />
                <stop offset="78%" stopColor="#2a78d6" />
                <stop offset="100%" stopColor="#0d3b80" />
              </linearGradient>
              <linearGradient id="sNose" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7a8a93" />
                <stop offset="40%" stopColor="#f3f6f8" />
                <stop offset="60%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#5b6a72" />
              </linearGradient>
              <linearGradient id="sFin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff6363" />
                <stop offset="55%" stopColor="#d11919" />
                <stop offset="100%" stopColor="#7a0a0a" />
              </linearGradient>
              <radialGradient id="sGlass" cx="0.35" cy="0.32" r="0.85">
                <stop offset="0%" stopColor="#9fc5ff" />
                <stop offset="35%" stopColor="#1e2a48" />
                <stop offset="100%" stopColor="#05080f" />
              </radialGradient>
              <radialGradient id="sFlameOuter" cx="0.5" cy="0.1" r="0.9">
                <stop offset="0%" stopColor="#ffd966" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#ff7a1a" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#b71c1c" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="sFlameMid" cx="0.5" cy="0.1" r="0.9">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#ffe082" />
                <stop offset="75%" stopColor="#ff8a3d" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="sFlameCore" cx="0.5" cy="0.1" r="0.7">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#fff59d" />
                <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse className="s-flame-outer" cx="70" cy="170" rx="26" ry="44" fill="url(#sFlameOuter)" />
            <ellipse className="s-flame-mid" cx="70" cy="168" rx="17" ry="34" fill="url(#sFlameMid)" />
            <ellipse className="s-flame-core" cx="70" cy="166" rx="9" ry="22" fill="url(#sFlameCore)" />

            <g>
              <path d="M44 120 L18 162 L44 154 Z" fill="url(#sFin)" stroke="#4a0606" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M96 120 L122 162 L96 154 Z" fill="url(#sFin)" stroke="#4a0606" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M44 74 L44 148 Q70 158 96 148 L96 74 Q70 66 44 74 Z" fill="url(#sBody)" stroke="#0a2244" strokeWidth="1.3" />
              <path d="M50 76 Q47 110 50 146" stroke="#cfe9ff" strokeWidth="2.2" fill="none" opacity="0.55" strokeLinecap="round" />
              <path d="M44 74 Q70 68 96 74 L70 22 Z" fill="url(#sNose)" stroke="#3c474e" strokeWidth="1.3" strokeLinejoin="round" />
              <circle cx="70" cy="106" r="18" fill="#d11919" stroke="#5b0a0a" strokeWidth="1.4" />
              <circle cx="70" cy="106" r="14.5" fill="#1a1f2c" />
              <circle cx="70" cy="106" r="13" fill="url(#sGlass)" />
              <ellipse cx="64" cy="99" rx="5" ry="3.4" fill="#ffffff" opacity="0.85" />
            </g>
          </svg>
        </div>
      </div>
      <div className="splash-text">{message}</div>
      <div className="splash-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
