import { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { StarIcon } from './icons.jsx';
import { api } from '../api/http.js';

// 1 star = 1.19 RUB
const STAR_TO_RUB = 1.19;
// TON wallet address — receives all TON payments via TON Connect
const TON_ADDR = 'UQA9zSSArryJML1DX7gXLnWPZv9CD6mu2FYIiwPmMkqvg-ak';

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

function giftImg(name) {
  return `/api/gifts/image?name=${encodeURIComponent(name)}`;
}

// Список подарков с правильными именами стикер-сетов (snake_case)
const TG_GIFTS = [
  { name: 'Plush Pepe',       stars: 644615, img: giftImg('plush_pepe') },
  { name: 'Heart Locket',     stars: 143409, img: giftImg('heart_locket') },
  { name: "Durov's Cap",      stars: 55875,  img: giftImg('durov_cap') },
  { name: 'Precious Peach',   stars: 29639,  img: giftImg('precious_peach') },
  { name: 'Heroic Helmet',    stars: 20199,  img: giftImg('heroic_helmet') },
  { name: 'Scared Cat',       stars: 17916,  img: giftImg('scared_cat') },
  { name: 'Astral Shard',     stars: 15150,  img: giftImg('astral_shard') },
  { name: 'Mighty Arm',       stars: 12889,  img: giftImg('mighty_arm') },
  { name: 'Loot Bag',         stars: 11959,  img: giftImg('loot_bag') },
  { name: 'Ion Gem',          stars: 7374,   img: giftImg('ion_gem') },
  { name: 'Perfume Bottle',   stars: 7308,   img: giftImg('perfume_bottle') },
  { name: 'Mini Oscar',       stars: 7308,   img: giftImg('mini_oscar') },
  { name: 'Westside Sign',    stars: 7202,   img: giftImg('westside_sign') },
  { name: 'Gem Signet',       stars: 6903,   img: giftImg('gem_signet') },
  { name: 'Artisan Brick',    stars: 6491,   img: giftImg('artisan_brick') },
  { name: 'Kissed Frog',      stars: 4637,   img: giftImg('kissed_frog') },
  { name: 'Swiss Watch',      stars: 4517,   img: giftImg('swiss_watch') },
  { name: 'Sharp Tongue',     stars: 4452,   img: giftImg('sharp_tongue') },
  { name: 'Genie Lamp',       stars: 4287,   img: giftImg('genie_lamp') },
  { name: 'Neko Helmet',      stars: 3877,   img: giftImg('neko_helmet') },
  { name: 'Toy Bear',         stars: 3842,   img: giftImg('toy_bear') },
  { name: 'Vintage Cigar',    stars: 3202,   img: giftImg('vintage_cigar') },
  { name: 'Signet Ring',      stars: 3173,   img: giftImg('signet_ring') },
  { name: 'Eternal Rose',     stars: 2376,   img: giftImg('eternal_rose') },
  { name: "Khabib's Papakha", stars: 2245,   img: giftImg('khabib_papakha') },
  { name: 'Cupid Charm',      stars: 1857,   img: giftImg('cupid_charm') },
  { name: 'Sky Stilettos',    stars: 1593,   img: giftImg('sky_stilettos') },
  { name: 'Ionic Dryer',      stars: 1404,   img: giftImg('ionic_dryer') },
  { name: 'Love Potion',      stars: 1395,   img: giftImg('love_potion') },
  { name: 'UFC Strike',       stars: 1339,   img: giftImg('ufc_strike') },
  { name: 'Flying Broom',     stars: 1041,   img: giftImg('flying_broom') },
  { name: 'Snoop Cigar',      stars: 1032,   img: giftImg('snoop_cigar') },
  { name: 'Record Player',    stars: 1008,   img: giftImg('record_player') },
  { name: 'Crystal Ball',     stars: 917,    img: giftImg('crystal_ball') },
  { name: 'Love Candle',      stars: 940,    img: giftImg('love_candle') },
  { name: 'Valentine Box',    stars: 882,    img: giftImg('valentine_box') },
  { name: 'Sakura Flower',    stars: 878,    img: giftImg('sakura_flower') },
  { name: 'Top Hat',          stars: 856,    img: giftImg('top_hat') },
  { name: 'Jolly Chimp',      stars: 708,    img: giftImg('jolly_chimp') },
  { name: 'Hanging Star',     stars: 702,    img: giftImg('hanging_star') },
  { name: 'Bunny Muffin',     stars: 699,    img: giftImg('bunny_muffin') },
  { name: 'Jingle Bells',     stars: 668,    img: giftImg('jingle_bells') },
  { name: 'Sleigh Bell',      stars: 663,    img: giftImg('sleigh_bell') },
  { name: 'Evil Eye',         stars: 650,    img: giftImg('evil_eye') },
  { name: 'Witch Hat',        stars: 455,    img: giftImg('witch_hat') },
  { name: 'Swag Bag',         stars: 447,    img: giftImg('swag_bag') },
  { name: 'Stellar Rocket',   stars: 433,    img: giftImg('stellar_rocket') },
  { name: 'Snow Globe',       stars: 419,    img: giftImg('snow_globe') },
  { name: 'Timeless Book',    stars: 413,    img: giftImg('timeless_book') },
  { name: 'Star Notepad',     stars: 413,    img: giftImg('star_notepad') },
  { name: 'B-Day Candle',     stars: 407,    img: giftImg('b_day_candle') },
  { name: 'Money Pot',        stars: 388,    img: giftImg('money_pot') },
  { name: 'Hex Pot',          stars: 385,    img: giftImg('hex_pot') },
  { name: 'Cookie Heart',     stars: 385,    img: giftImg('cookie_heart') },
  { name: 'Santa Hat',        stars: 381,    img: giftImg('santa_hat') },
  { name: 'Victory Medal',    stars: 371,    img: giftImg('victory_medal') },
  { name: 'Party Sparkler',   stars: 363,    img: giftImg('party_sparkler') },
  { name: 'Mood Pack',        stars: 363,    img: giftImg('mood_pack') },
  { name: 'Easter Egg',       stars: 361,    img: giftImg('easter_egg') },
  { name: 'Fresh Socks',      stars: 357,    img: giftImg('fresh_socks') },
  { name: 'Spiced Wine',      stars: 355,    img: giftImg('spiced_wine') },
  { name: 'Pretty Posy',      stars: 355,    img: giftImg('pretty_posy') },
  { name: 'Ginger Cookie',    stars: 336,    img: giftImg('ginger_cookie') },
  { name: 'Happy Brownie',    stars: 333,    img: giftImg('happy_brownie') },
  { name: 'Tama Gadget',      stars: 332,    img: giftImg('tama_gadget') },
  { name: 'Jack-in-the-Box',  stars: 330,    img: giftImg('jack_in_the_box') },
  { name: 'Hypno Lollipop',   stars: 330,    img: giftImg('hypno_lollipop') },
  { name: 'Jester Hat',       stars: 321,    img: giftImg('jester_hat') },
  { name: 'Lol Pop',          stars: 310,    img: giftImg('lol_pop') },
  { name: 'Pet Snake',        stars: 317,    img: giftImg('pet_snake') },
  { name: 'Winter Wreath',    stars: 312,    img: giftImg('winter_wreath') },
  { name: 'Ice Cream',        stars: 289,    img: giftImg('ice_cream') },
  { name: 'Whip Cupcake',     stars: 286,    img: giftImg('whip_cupcake') },
  { name: 'Snake Box',        stars: 276,    img: giftImg('snake_box') },
  { name: 'Instant Ramen',    stars: 273,    img: giftImg('instant_ramen') },
  { name: 'Lunar Snake',      stars: 267,    img: giftImg('lunar_snake') },
  { name: 'Candy Cane',       stars: 266,    img: giftImg('candy_cane') },
  { name: 'Chill Flame',      stars: 262,    img: giftImg('chill_flame') },
  { name: 'Desk Calendar',    stars: 492,    img: giftImg('desk_calendar') },
  { name: 'Faith Amulet',     stars: 490,    img: giftImg('faith_amulet') },
  { name: 'Homemade Cake',    stars: 489,    img: giftImg('homemade_cake') },
  { name: 'Bow Tie',          stars: 473,    img: giftImg('bow_tie') },
  { name: 'Spring Basket',    stars: 460,    img: giftImg('spring_basket') },
  { name: 'Clover Pin',       stars: 457,    img: giftImg('clover_pin') },
  { name: 'Eternal Candle',   stars: 544,    img: giftImg('eternal_candle') },
  { name: 'Lush Bouquet',     stars: 515,    img: giftImg('lush_bouquet') },
  { name: 'Moon Pendant',     stars: 510,    img: giftImg('moon_pendant') },
  { name: 'Snoop Dogg',       stars: 499,    img: giftImg('snoop_dogg') },
  { name: 'Spy Agaric',       stars: 499,    img: giftImg('spy_agaric') },
  { name: 'Input Key',        stars: 492,    img: giftImg('input_key') },
  { name: 'Low Rider',        stars: 4969,   img: giftImg('low_rider') },
];

export function TopUpModal({ onClose, telegramApi }) {
  const [tonConnectUI] = useTonConnectUI();
  const [promo, setPromo] = useState('');
  const [method, setMethod] = useState('stars');
  const [tonRate, setTonRate] = useState(null);      // TON per star
  const [rubPerUsdt, setRubPerUsdt] = useState(90);  // RUB per 1 USDT
  const [loading, setLoading] = useState(false);
  const [giftsOpen, setGiftsOpen] = useState(false);

  useEffect(() => {
    api.get('/payments/ton-rate')
      .then((r) => {
        setTonRate(r.ton_per_star);
        if (r.rub_per_usdt) setRubPerUsdt(r.rub_per_usdt);
      })
      .catch(() => {
        setTonRate(0.0025);
        setRubPerUsdt(90);
      });
  }, []);

  async function handleAmount(stars) {
    if (method === 'stars') await payWithStars(stars);
    else if (method === 'sbp') paySBP(stars);
    else if (method === 'ton') payTON(stars);
    else if (method === 'send') await paySend(stars);
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

  // СБП — заглушка, требует банковский эквайринг
  function paySBP(stars) {
    const rubles = (stars * STAR_TO_RUB).toFixed(2);
    alert(`Перевод ${rubles} ₽ через СБП.\n\nДля подключения реального СБП-эквайринга добавьте платёжный провайдер (Tinkoff, Sberbank и т.д.).`);
  }

  // TON — открываем TON Connect модал, после подключения кошелька автоматически шлём транзакцию
  async function payTON(stars) {
    if (!tonRate) return;

    const nanoTon = Math.round(stars * tonRate * 1e9).toString();
    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{ address: TON_ADDR, amount: nanoTon }],
    };

    const sendTx = async () => {
      setLoading(true);
      try {
        await tonConnectUI.sendTransaction(tx);
        onClose();
      } catch (e) {
        // Пользователь отклонил — не показываем ошибку
        if (e?.message && !e.message.includes('reject') && !e.message.includes('cancel')) {
          alert('Ошибка TON: ' + e.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Кошелёк уже подключён — сразу отправляем транзакцию
    if (tonConnectUI.connected) {
      await sendTx();
      return;
    }

    // Открываем "Connect your TON wallet" и после подключения шлём транзакцию
    tonConnectUI.openModal();
    let unsub;
    const timer = setTimeout(() => unsub?.(), 120000); // очистка через 2 мин
    unsub = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        clearTimeout(timer);
        unsub?.();
        unsub = null;
        sendTx();
      }
    });
  }

  // @Send — создаём USDT инвойс через Crypto Bot API, открываем мини-апп оплаты
  async function paySend(stars) {
    setLoading(true);
    try {
      const { url } = await api.post('/payments/cryptopay/invoice', { stars });
      if (telegramApi?.openTelegramLink) {
        telegramApi.openTelegramLink(url);
      } else if (telegramApi?.openLink) {
        telegramApi.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      alert(e.message === 'cryptopay_not_configured'
        ? 'Crypto Bot оплата не настроена. Добавьте CRYPTO_PAY_TOKEN в .env'
        : e.message);
    } finally {
      setLoading(false);
    }
  }

  // Форматирование TON
  function fmtTon(stars) {
    if (!tonRate) return '…';
    const val = stars * tonRate;
    return val < 0.01 ? val.toFixed(4) : val.toFixed(2);
  }

  // Форматирование USDT (для @send)
  function fmtUsdt(stars) {
    const rubles = stars * STAR_TO_RUB;
    const usdt = rubles / rubPerUsdt;
    return usdt < 0.01 ? usdt.toFixed(4) : usdt.toFixed(2);
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
            <span className="gifts-title">Принимаемые подарки</span>
          </div>
          <p className="gifts-sub">Отправь подарок @luvscale — баланс зачислят вручную.</p>
          <div className="gifts-grid">
            {TG_GIFTS.map((g) => (
              <div key={g.name} className="gift-card">
                <div className="gift-card-img-wrap">
                  <img
                    src={g.img}
                    alt={g.name}
                    className="gift-card-img"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="gift-card-name">{g.name}</div>
                <div className="gift-card-price">
                  <StarIcon size={13} /> {g.stars.toLocaleString('ru-RU')}
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
                  {method === 'ton' && (
                    <span className="topup-amount-sub">{fmtTon(a.stars)} TON</span>
                  )}
                  {method === 'send' && (
                    <span className="topup-amount-sub">{fmtRub(a.stars)} ₽ ≈ {fmtUsdt(a.stars)} USDT</span>
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
