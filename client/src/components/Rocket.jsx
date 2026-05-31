import { useEffect, useRef, useState } from 'react';
import { multiplierAt } from '../hooks/useGameState.js';
import { t } from '../i18n/ru.js';

export function Rocket({ game }) {
  const bgCanvasRef = useRef(null);
  const rafRef = useRef(0);
  const starsRef = useRef([]);
  const [display, setDisplay] = useState({ multiplier: 1.00 });
  const [rocketPos, setRocketPos] = useState({ x: 0, y: 0, rotate: -45 });

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    if (starsRef.current.length === 0) {
      for (let i = 0; i < 120; i++) {
        starsRef.current.push({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 1.6 + 0.3,
          v: Math.random() * 0.0008 + 0.0002,
          tw: Math.random() * 0.5 + 0.5,
        });
      }
    }

    function loop() {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, Math.max(W, H));
      grad.addColorStop(0, 'rgba(58,141,255,0.08)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#ffffff';
      for (const s of starsRef.current) {
        s.y += s.v;
        if (s.y > 1) s.y = 0;
        ctx.globalAlpha = (0.3 + s.size * 0.35) * s.tw;
        ctx.fillRect(s.x * W, s.y * H, s.size, s.size);
      }
      ctx.globalAlpha = 1;

      const phase = game.phase;
      let m = 1.00;
      if (phase === 'flying') m = multiplierAt(game);
      else if (phase === 'crashed' && game.crashPoint != null) m = game.crashPoint;

      const lm = Math.log(m);
      const maxLog = Math.log(10);
      const tt = Math.min(1, lm / maxLog);

      const cx = W / 2;
      const cy = H * 0.62;
      const ampX = Math.min(W * 0.35, 130);
      const ampY = Math.min(H * 0.25, 90);
      const offX = -ampX + ampX * 2 * tt;
      const offY = ampY - ampY * 2 * tt;

      const rocketX = cx + offX;
      const rocketY = cy + offY;

      if (phase !== 'betting') {
        ctx.beginPath();
        const steps = 40;
        for (let i = 0; i <= steps; i++) {
          const ti = (i / steps) * tt;
          const xi = cx + (-ampX + ampX * 2 * ti);
          const yi = cy + (ampY - ampY * 2 * ti);
          if (i === 0) ctx.moveTo(xi, yi); else ctx.lineTo(xi, yi);
        }
        const stroke = ctx.createLinearGradient(cx - ampX, cy + ampY, rocketX, rocketY);
        stroke.addColorStop(0, 'rgba(203,255,88,0)');
        stroke.addColorStop(1, phase === 'crashed' ? 'rgba(255,80,80,0.9)' : 'rgba(203,255,88,0.9)');
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const angle = phase === 'crashed' ? 90 : -45 + tt * 45;
      setRocketPos({ x: rocketX, y: rocketY, rotate: angle });
      setDisplay({ multiplier: m });
      rafRef.current = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [game]);

  let mainText;
  let mainClass;
  const offset = game.serverOffset || 0;
  if (game.phase === 'betting') {
    const left = Math.max(0, Math.ceil((game.bettingEndsAt - (Date.now() + offset)) / 1000));
    mainText = t.rocket.nextIn(left);
    mainClass = 'multiplier multiplier-idle';
  } else if (game.phase === 'flying') {
    mainText = `×${display.multiplier.toFixed(2)}`;
    mainClass = 'multiplier multiplier-flying';
  } else {
    mainText = t.rocket.flew((game.crashPoint ?? 0).toFixed(2));
    mainClass = 'multiplier multiplier-crashed';
  }

  return (
    <div className="rocket-stage">
      <canvas ref={bgCanvasRef} className="rocket-canvas" />
      <img
        src="/Animated_AgADyxsAAteJkUs.gif"
        alt="rocket"
        style={{
          position: 'absolute',
          left: rocketPos.x,
          top: rocketPos.y,
          transform: `translate(-50%, -50%) rotate(${rocketPos.rotate}deg)`,
          width: 90,
          height: 90,
          pointerEvents: 'none',
          filter: game.phase === 'crashed'
            ? 'grayscale(1) brightness(0.5)'
            : 'drop-shadow(0 0 12px rgba(255,120,40,0.7))',
        }}
      />
      <div className={mainClass}>{mainText}</div>
    </div>
  );
}
