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
        <img
          src="/Animated_AgADyxsAAteJkUs.gif"
          alt="rocket"
          style={{ width: 140, height: 140, objectFit: 'contain' }}
        />
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
