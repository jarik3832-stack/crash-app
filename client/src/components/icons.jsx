export function StarIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5z"
        fill="#ffd24a"
        stroke="#caa024"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function GemIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="gem-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7dc6ff" />
          <stop offset="100%" stopColor="#1e80ff" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5L21 11l-9 10.5L3 11 12 2.5z"
        fill="url(#gem-g)"
        stroke="#1666c4"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M12 2.5L8 11h8L12 2.5z" fill="#bfe2ff" opacity="0.7" />
    </svg>
  );
}

export function CloseIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MoreIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function PlusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h10v3a5 5 0 01-10 0V3z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <path d="M5 5h2M17 5h2M12 11v4M8 21h8M10 18h4v3h-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function RocketNavIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 3c4 1 6 4 7 8-4 1-7 3-8 7-3-1-5-3-7-7 1-4 4-7 8-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ProfileNavIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CoinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#ffd24a" stroke="#caa024" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="#7a5a00">¢</text>
    </svg>
  );
}
