import { useEffect, useRef, useState } from 'react';
import { GemIcon, StarIcon } from './icons.jsx';

const ROW_ITEMS = 50;
const ITEM_WIDTH = 90;
const ANIMATION_MS = 3200;

export function CaseReel({ items, winningItemId, onSettled }) {
  const trackRef = useRef(null);
  const [reel] = useState(() => buildReel(items, winningItemId));
  const [phase, setPhase] = useState('spinning');

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Land on a tile of the winning item near the right side of the strip.
    const winningIdx = reel.lastIndexOf(reel.find((it) => it._winningTile));
    const targetX = winningIdx * ITEM_WIDTH;
    const viewportCenter = (track.parentElement?.clientWidth ?? 320) / 2 - ITEM_WIDTH / 2;
    const offset = -(targetX - viewportCenter);

    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    void track.offsetWidth;

    track.style.transition = `transform ${ANIMATION_MS}ms cubic-bezier(0.15, 0.9, 0.2, 1)`;
    track.style.transform = `translateX(${offset}px)`;

    const tm = setTimeout(() => {
      setPhase('done');
      onSettled?.();
    }, ANIMATION_MS + 50);
    return () => clearTimeout(tm);
  }, [reel, onSettled]);

  return (
    <div className="case-reel-wrap">
      <div ref={trackRef} className="case-reel-track">
        {reel.map((it, idx) => (
          <div key={idx} className="case-reel-item">
            <div className="ri-icon">
              {it.reward_kind === 'coins' ? <StarIcon size={28} /> : <GemIcon size={28} />}
            </div>
            <div className="ri-amt">{it.amount}</div>
          </div>
        ))}
      </div>
      <div className="case-reel-pointer" />
    </div>
  );
}

function buildReel(items, winningItemId) {
  const out = [];
  for (let i = 0; i < ROW_ITEMS; i++) {
    const it = items[Math.floor(Math.random() * items.length)];
    out.push({ ...it });
  }
  // Place the actual winning item near the right; mark with _winningTile.
  const winning = items.find((x) => x.id === winningItemId) ?? items[0];
  out[ROW_ITEMS - 6] = { ...winning, _winningTile: true };
  return out;
}
