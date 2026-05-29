import { useState, useEffect } from 'react';
import { StarIcon } from './icons.jsx';
import { api } from '../api/http.js';

// 1 star = 1.19 RUB
const STAR_TO_RUB = 1.19;
// TON wallet addresses
const TON_ADDR  = 'UQA9zSSArryJML1DX7gXLnWPZv9CD6mu2FYIiwPmMkqvg-ak';
const SEND_ADDR = 'UQBOGTwqctfHIF1oecbsNU0NFcVvyr2QKpahU7JJkfchZB0C';

const AMOUNTS = [
  { stars: 100,   bonus: 0    },
  { stars: 500,   bonus: 0    },
  { stars: 1000,  bonus: 100  },
  { stars: 2500,  bonus: 250  },
  { stars: 5000,  bonus: 500  },
  { stars: 10000, bonus: 1000 },
  { stars: 25000, bonus: 2500 },
];

const METHODS = [
  { id: 'stars',  label: 'Stars',    emoji: '⭐' },
  { id: 'sbp',    label: 'СБП (RU)', emoji: '🎯' },
  { id: 'ton',    label: 'TON',      emoji: '💎' },
  { id: 'send',   label: '@Send',    emoji: '🐦' },
  { id: 'gifts',  label: 'Подарки',  emoji: '🐻' },
];

// Список Telegram NFT подарков (актуальные примерные цены в звёздах)
const TG_GIFTS = [
  { name: 'Heart Locket', sub: 'Random',       emoji: '💙', stars: 1096 },
  { name: 'Nail Bracelet Moon Cat',             emoji: '🪬', stars: 499  },
  { name: "Durov's Cap Jade",                   emoji: '🧢', stars: 432  },
  { name: 'Swiss Watch Day Trader',             emoji: '⌚', stars: 375  },
  { name: 'Loot Bag Riot Pack',                 emoji: '👜', stars: 350  },
  { name: 'Precious Peach Neo-Chrome',          emoji: '🍑', stars: 332  },
  { name: 'Victory Medal The Founder',          emoji: '🏅', stars: 285  },
  { name: 'Jingle Bells Cash Machine',          emoji: '🔔', stars: 200  },
  { name: 'Artisan Brick Grass Block',          emoji: '🟩', stars: 180  },
  { name: 'Scared Cat', sub: 'Random',          emoji: '🐱', stars: 128  },
  { name: 'Desk Calendar TON',                  emoji: '📅', stars: 100  },
  { name: 'Lunar Snake', sub: 'Random',         emoji: '🐍', stars: 35   },
  { name: 'Ice Cream', sub: 'Random',           emoji: '🍦', stars: 11   },
  { name: 'Candy Cane', sub: 'Random',          emoji: '🍬', stars: 7    },
  { name: 'Star', sub: 'Random',                emoji: '⭐', stars: 5    },
  { name: 'Plush Pepe', sub: 'Random',          emoji: '🐸', stars: 3    },
];

export function TopUpModal({ onClose, telegramApi }) {
  const [promo, setPromo] = useState('');
  const [method, setMethod] = useState('stars');
  const [tonRate, setTonRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [giftsOpen, setGiftsOpen] = useState(false);

  // Загружаем курс TON при открытии
  useEffect(() => {
    api.get('/payments/ton-rate')
      .then((r) => setTonRate(r.ton_per_star))
      .catch(() => setTonRate(0.0025));
  }, []);

  async function handleAmount(stars) {
    if (method === 'stars') await payWithStars(stars);
    else if (method === 'sbp') paySBP(stars);
    else if (method === 'ton') payTON(stars);
    else if (method === 'send') paySend(stars);
    else if (method === 'gifts') setGiftsOpen(true);
  }

  // Stars — через Telegram invoice
  async function payWithStars(stars) {
    setLoading(true);
    try {
      const { link } = await api.post('/payments/stars/invoice', { stars });
      if (telegramApi?.openInvoice) {
        telegramApi.openInvoice(link, (status) => {
          if (status === 'paid') onClose();
        });
      } else {
        window.open(link, '_blank');
      }
    } catch (e) {
      alert(e.message === 'stars_not_configured'
        ? 'Stars оплата не настроена. Добавьте TELEGRAM_BOT_TOKEN в .env'
        : e.message);
    } finally {
      setLoading(false);
    }
  }

  // СБП — открываем ссылку (заглушка, так как требует банковский эквайринг)
  function paySBP(stars) {
    const rubles = (stars * STAR_TO_RUB).toFixed(2);
    alert(`Перевод ${rubles} ₽ через СБП.\n\nДля подключения реального СБП-эквайринга добавьте платёжный провайдер (Tinkoff, Sberbank и т.д.).`);
  }

  // TON — открываем @wallet внутри Telegram
  function payTON(stars) {
    if (!tonRate) return;
    const ton = stars * tonRate;
    const nanoTon = Math.round(ton * 1e9);
    const comment = `darilo_${stars}stars`;
    // t.me/wallet поддерживает transfer deeplink и открывается прямо в Telegram
    const link = `https://t.me/wallet?startattach=ton-transfer&to=${TON_ADDR}&amount=${nanoTon}&text=${encodeURIComponent(comment)}`;
    if (telegramApi?.openTelegramLink) {
      telegramApi.openTelegramLink(link);
    } else if (telegramApi?.openLink) {
      telegramApi.openLink(link);
    } else {
      window.open(link, '_blank');
    }
  }

  // @Send — открываем @send внутри Telegram
  function paySend(stars) {
    if (!tonRate) return;
    const ton = stars * tonRate;
    const comment = `darilo_${stars}stars`;
    // t.me/send deeplink для перевода TON через @Send кошелёк
    const link = `https://t.me/send?startattach=ton-transfer&to=${SEND_ADDR}&amount=${ton.toFixed(9)}&text=${encodeURIComponent(comment)}`;
    if (telegramApi?.openTelegramLink) {
      telegramApi.openTelegramLink(link);
    } else if (telegramApi?.openLink) {
      telegramApi.openLink(link);
    } else {
      window.open(link, '_blank');
    }
  }

  // Форматирование TON
  function fmtTon(stars) {
    if (!tonRate) return '…';
    const val = stars * tonRate;
    return val < 0.01 ? val.toFixed(4) : val.toFixed(2);
  }

  // Форматирование рублей
  function fmtRub(stars) {
    return (stars * STAR_TO_RUB).toFixed(0);
  }

  if (giftsOpen) {
    return (
      <div className="topup-overlay" onClick={() => setGiftsOpen(false)}>
        <div className="topup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="topup-handle" />
          <div className="gifts-header">
            <button className="gifts-back" onClick={() => setGiftsOpen(false)}>← Назад</button>
            <span className="gifts-title">Список подарков</span>
          </div>
          <p className="gifts-sub">Цены актуальны на момент открытия. Отправь подарок @luvscale — баланс зачислят вручную.</p>
          <div className="gifts-list">
            {TG_GIFTS.map((g) => (
              <div key={g.name} className="gift-row">
                <span className="gift-emoji">{g.emoji}</span>
                <div className="gift-info">
                  <div className="gift-name">{g.name}{g.sub ? <span className="gift-sub"> ({g.sub})</span> : null}</div>
                </div>
                <div className="gift-price">
                  <StarIcon size={13} />
                  {g.stars.toLocaleString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topup-overlay" onClick={onClose}>
      <div className="topup-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="topup-handle" />

        {/* Промокод */}
        <div className="topup-promo-row">
          <input
            className="topup-promo-input"
            placeholder="Введи промокод"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
          />
          <button className="topup-promo-btn">Применить</button>
        </div>

        {/* Способы оплаты */}
        <div className="topup-section-title">Выберите способ пополнения</div>
        <div className="topup-methods">
          {METHODS.map((m) => (
            <button
              key={m.id}
              className={`topup-method ${method === m.id ? 'active' : ''}`}
              onClick={() => setMethod(m.id)}
            >
              <span>{m.label}</span>
              <span className="topup-method-icon">{m.emoji}</span>
            </button>
          ))}
        </div>

        {/* Блок "Подарки" */}
        {method === 'gifts' && (
          <div className="topup-gifts-card">
            <div className="topup-gifts-bear">🐻</div>
            <p className="topup-gifts-text">
              Отправь свой подарок <strong>@luvscale</strong> и получи <StarIcon size={14} /> на баланс
            </p>
            <button className="topup-gifts-list-btn" onClick={() => setGiftsOpen(true)}>
              📋 Список подарков
            </button>
          </div>
        )}

        {/* Суммы */}
        {method !== 'gifts' && (
          <>
            <div className="topup-section-title">Выберите сумму пополнения</div>
            <div className="topup-amounts">
              {AMOUNTS.map((a) => (
                <button
                  key={a.stars}
                  className="topup-amount-row"
                  onClick={() => !loading && handleAmount(a.stars)}
                  disabled={loading}
                >
                  <div className="topup-amount-stars-deco">
                    <span>✦</span><span>✦</span><span>✦</span>
                  </div>
                  <div className="topup-amount-center">
                    <span className="topup-amount-value">
                      {a.stars.toLocaleString('ru-RU')}
                    </span>
                    <StarIcon size={18} />
                    {a.bonus > 0 && (
                      <span className="topup-amount-bonus">+{a.bonus.toLocaleString('ru-RU')}</span>
                    )}
                  </div>
                  {method === 'sbp' && (
                    <span className="topup-amount-sub">{fmtRub(a.stars)} ₽</span>
                  )}
                  {(method === 'ton' || method === 'send') && (
                    <span className="topup-amount-sub">{fmtTon(a.stars)} TON</span>
                  )}
                  <div className="topup-amount-plus">+</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
