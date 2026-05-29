import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { multiplierAt } from '../hooks/useGameState.js';
import { t } from '../i18n/ru.js';

function buildRocketMesh() {
  const root = new THREE.Group();

  const blue = new THREE.MeshStandardMaterial({ color: 0x2a78d6, roughness: 0.35, metalness: 0.55 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf3f6f8, roughness: 0.25, metalness: 0.6 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd11919, roughness: 0.4, metalness: 0.3 });
  const darkRed = new THREE.MeshStandardMaterial({ color: 0x7a0a0a, roughness: 0.5, metalness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c1c7, roughness: 0.2, metalness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x121622, roughness: 0.6, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x6fb1ff, roughness: 0.05, metalness: 0.1,
    emissive: 0x1a3a66, emissiveIntensity: 0.4,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.0, 32), blue);
  body.position.y = 0;
  root.add(body);

  const ringTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 32), metal);
  ringTop.position.y = 0.92;
  root.add(ringTop);

  const ringBot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.12, 32), metal);
  ringBot.position.y = -0.92;
  root.add(ringBot);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.1, 32), white);
  nose.position.y = 1.55;
  root.add(nose);

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.35, 24), metal);
  nozzle.position.y = -1.18;
  root.add(nozzle);

  // Иллюминатор: красное кольцо + тёмное основание + стекло
  const portRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 16, 32), red);
  portRing.rotation.x = Math.PI / 2;
  portRing.position.set(0, 0.15, 0.6);
  root.add(portRing);

  const portBase = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), dark);
  portBase.position.set(0, 0.15, 0.61);
  root.add(portBase);

  const portGlass = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  portGlass.rotation.x = Math.PI / 2;
  portGlass.position.set(0, 0.15, 0.62);
  root.add(portGlass);

  // Крылья (3 штуки, симметрично вокруг оси)
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.9, -0.7);
  finShape.lineTo(0, -0.55);
  finShape.lineTo(0, 0);
  const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  for (let i = 0; i < 3; i++) {
    const fin = new THREE.Mesh(finGeom, red);
    fin.rotation.y = (i * Math.PI * 2) / 3;
    fin.position.y = -0.55;
    fin.translateX(0.6);
    fin.rotateY(-Math.PI / 2);
    root.add(fin);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.07), darkRed);
    trim.position.copy(fin.position);
    trim.rotation.copy(fin.rotation);
    trim.translateX(0.05);
    root.add(trim);
  }

  return root;
}

function buildFlame() {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 1.6, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  outer.rotation.x = Math.PI;
  outer.position.y = -2.0;
  group.add(outer);

  const mid = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 1.2, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7, depthWrite: false }),
  );
  mid.rotation.x = Math.PI;
  mid.position.y = -1.85;
  group.add(mid);

  const core = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.8, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }),
  );
  core.rotation.x = Math.PI;
  core.position.y = -1.7;
  group.add(core);

  return { group, outer, mid, core };
}

export function Rocket({ game }) {
  const bgCanvasRef = useRef(null);
  const glHostRef = useRef(null);
  const rafRef = useRef(0);
  const starsRef = useRef([]);
  const threeRef = useRef(null);
  const [display, setDisplay] = useState({ multiplier: 1.00 });

  // Init three.js once
  useEffect(() => {
    const host = glHostRef.current;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x80b8ff, 0.6);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const flameLight = new THREE.PointLight(0xff8a3d, 1.2, 6);
    flameLight.position.set(0, -2.2, 0);
    scene.add(flameLight);

    const rocket = buildRocketMesh();
    scene.add(rocket);

    const flame = buildFlame();
    rocket.add(flame.group);

    function resize() {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    threeRef.current = { renderer, scene, camera, rocket, flame, flameLight, resize };

    return () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
      threeRef.current = null;
    };
  }, []);

  // Background canvas + animation loop
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

      const three = threeRef.current;
      if (three) {
        const { renderer, scene, camera, rocket, flame, flameLight } = three;
        const ndcX = ((rocketX / W) * 2) - 1;
        const ndcY = -(((rocketY / H) * 2) - 1);
        const z = 0;
        const v = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
        const dir = v.sub(camera.position).normalize();
        const distance = (z - camera.position.z) / dir.z;
        const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));
        rocket.position.set(worldPos.x, worldPos.y, 0);

        const now = performance.now();
        if (phase === 'flying') {
          rocket.rotation.y = (now * 0.0035) % (Math.PI * 2);
          rocket.rotation.z = -0.35;
          rocket.rotation.x = 0;
          flame.group.visible = true;
        } else if (phase === 'crashed') {
          rocket.rotation.y += 0.02;
          rocket.rotation.z = Math.PI;
          rocket.rotation.x = 0;
          flame.group.visible = false;
        } else {
          rocket.rotation.y = 0;
          rocket.rotation.z = -0.18;
          rocket.rotation.x = 0;
          flame.group.visible = false;
        }

        const fl = 0.85 + Math.sin(now * 0.05) * 0.15;
        flame.outer.scale.set(1, fl, 1);
        flame.mid.scale.set(1, 0.9 + Math.sin(now * 0.07) * 0.2, 1);
        flame.core.scale.set(1, 0.8 + Math.sin(now * 0.11) * 0.25, 1);
        flameLight.intensity = phase === 'flying' ? 1.0 + Math.sin(now * 0.05) * 0.4 : 0;

        renderer.render(scene, camera);
      }

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
      <div ref={glHostRef} className="rocket-3d-host" />
      <div className={mainClass}>{mainText}</div>
    </div>
  );
}
