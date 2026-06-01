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

// Список Telegram NFT подарков с официальными изображениями
const TG_GIFTS = [
  { name: 'Plush Pepe',       stars: 644615, img: 'https://nft.fragment.com/gift/plushpepe.webp' },
  { name: 'Heart Locket',     stars: 143409, img: 'https://nft.fragment.com/gift/heartlocket.webp' },
  { name: "Durov's Cap",      stars: 55875,  img: 'https://nft.fragment.com/gift/durovcap.webp' },
  { name: 'Precious Peach',   stars: 29639,  img: 'https://nft.fragment.com/gift/preciouspeach.webp' },
  { name: 'Heroic Helmet',    stars: 20199,  img: 'https://nft.fragment.com/gift/heroichelmet.webp' },
  { name: 'Scared Cat',       stars: 17916,  img: 'https://nft.fragment.com/gift/scaredcat.webp' },
  { name: 'Astral Shard',     stars: 15150,  img: 'https://nft.fragment.com/gift/astralshard.webp' },
  { name: 'Mighty Arm',       stars: 12889,  img: 'https://nft.fragment.com/gift/mightyarm.webp' },
  { name: 'Loot Bag',         stars: 11959,  img: 'https://nft.fragment.com/gift/lootbag.webp' },
  { name: 'Nail Bracelet',    stars: 11244,  img: 'https://nft.fragment.com/gift/nailbracelet.webp' },
  { name: 'Ion Gem',          stars: 7374,   img: 'https://nft.fragment.com/gift/iongem.webp' },
  { name: 'Perfume Bottle',   stars: 7308,   img: 'https://nft.fragment.com/gift/perfumebottle.webp' },
  { name: 'Mini Oscar',       stars: 7308,   img: 'https://nft.fragment.com/gift/minioscар.webp' },
  { name: 'Westside Sign',    stars: 7202,   img: 'https://nft.fragment.com/gift/westsidесign.webp' },
  { name: 'Gem Signet',       stars: 6903,   img: 'https://nft.fragment.com/gift/gemsignet.webp' },
  { name: 'Artisan Brick',    stars: 6491,   img: 'https://nft.fragment.com/gift/artisanbrick.webp' },
  { name: 'Magic Potion',     stars: 6112,   img: 'https://nft.fragment.com/gift/magicpotion.webp' },
  { name: 'Kissed Frog',      stars: 4637,   img: 'https://nft.fragment.com/gift/kissedfrog.webp' },
  { name: 'Swiss Watch',      stars: 4517,   img: 'https://nft.fragment.com/gift/swisswatch.webp' },
  { name: 'Sharp Tongue',     stars: 4452,   img: 'https://nft.fragment.com/gift/sharptongue.webp' },
  { name: 'Genie Lamp',       stars: 4287,   img: 'https://nft.fragment.com/gift/genielamp.webp' },
  { name: 'Bonded Ring',      stars: 3982,   img: 'https://nft.fragment.com/gift/bondedring.webp' },
  { name: 'Neko Helmet',      stars: 3877,   img: 'https://nft.fragment.com/gift/nekohelmet.webp' },
  { name: 'Toy Bear',         stars: 3842,   img: 'https://nft.fragment.com/gift/toybear.webp' },
  { name: 'Vintage Cigar',    stars: 3202,   img: 'https://nft.fragment.com/gift/vintagecigar.webp' },
  { name: 'Signet Ring',      stars: 3173,   img: 'https://nft.fragment.com/gift/signetring.webp' },
  { name: 'Voodoo Doll',      stars: 2972,   img: 'https://nft.fragment.com/gift/voodoodoll.webp' },
  { name: 'Electric Skull',   stars: 2816,   img: 'https://nft.fragment.com/gift/electricskull.webp' },
  { name: 'Diamond Ring',     stars: 2509,   img: 'https://nft.fragment.com/gift/diamondring.webp' },
  { name: 'Eternal Rose',     stars: 2376,   img: 'https://nft.fragment.com/gift/eternalrose.webp' },
  { name: 'Bling Binky',      stars: 2324,   img: 'https://nft.fragment.com/gift/blingbinky.webp' },
  { name: 'Rare Bird',        stars: 2293,   img: 'https://nft.fragment.com/gift/rarebird.webp' },
  { name: "Khabib's Papakha", stars: 2245,   img: 'https://nft.fragment.com/gift/khabibpapakha.webp' },
  { name: 'Cupid Charm',      stars: 1857,   img: 'https://nft.fragment.com/gift/cupidcharm.webp' },
  { name: 'Sky Stilettos',    stars: 1593,   img: 'https://nft.fragment.com/gift/skystilettos.webp' },
  { name: 'Ionic Dryer',      stars: 1404,   img: 'https://nft.fragment.com/gift/ionicdryer.webp' },
  { name: 'Love Potion',      stars: 1395,   img: 'https://nft.fragment.com/gift/lovepotion.webp' },
  { name: 'UFC Strike',       stars: 1339,   img: 'https://nft.fragment.com/gift/ufcstrike.webp' },
  { name: 'Mad Pumpkin',      stars: 1142,   img: 'https://nft.fragment.com/gift/madpumpkin.webp' },
  { name: 'Trapped Heart',    stars: 1136,   img: 'https://nft.fragment.com/gift/trappedheart.webp' },
  { name: 'Skull Flower',     stars: 1047,   img: 'https://nft.fragment.com/gift/skullflower.webp' },
  { name: 'Flying Broom',     stars: 1041,   img: 'https://nft.fragment.com/gift/flyingbroom.webp' },
  { name: 'Snoop Cigar',      stars: 1032,   img: 'https://nft.fragment.com/gift/snoopcigаr.webp' },
  { name: 'Record Player',    stars: 1008,   img: 'https://nft.fragment.com/gift/recordplayer.webp' },
  { name: 'Crystal Ball',     stars: 917,    img: 'https://nft.fragment.com/gift/crystalball.webp' },
  { name: 'Love Candle',      stars: 940,    img: 'https://nft.fragment.com/gift/lovecandle.webp' },
  { name: 'Valentine Box',    stars: 882,    img: 'https://nft.fragment.com/gift/valentinebox.webp' },
  { name: 'Sakura Flower',    stars: 878,    img: 'https://nft.fragment.com/gift/sakuraflower.webp' },
  { name: 'Top Hat',          stars: 856,    img: 'https://nft.fragment.com/gift/tophat.webp' },
  { name: 'Berry Box',        stars: 793,    img: 'https://nft.fragment.com/gift/berrybox.webp' },
  { name: 'Jolly Chimp',      stars: 708,    img: 'https://nft.fragment.com/gift/jollychimр.webp' },
  { name: 'Hanging Star',     stars: 702,    img: 'https://nft.fragment.com/gift/hangingstar.webp' },
  { name: 'Bunny Muffin',     stars: 699,    img: 'https://nft.fragment.com/gift/bunnymuffin.webp' },
  { name: 'Jelly Bunny',      stars: 675,    img: 'https://nft.fragment.com/gift/jellybunny.webp' },
  { name: 'Jingle Bells',     stars: 668,    img: 'https://nft.fragment.com/gift/jinglebells.webp' },
  { name: 'Joyful Bundle',    stars: 665,    img: 'https://nft.fragment.com/gift/joyfullbundle.webp' },
  { name: 'Sleigh Bell',      stars: 663,    img: 'https://nft.fragment.com/gift/sleighbell.webp' },
  { name: 'Evil Eye',         stars: 650,    img: 'https://nft.fragment.com/gift/evileye.webp' },
  { name: 'Light Sword',      stars: 619,    img: 'https://nft.fragment.com/gift/lightsword.webp' },
  { name: 'Witch Hat',        stars: 455,    img: 'https://nft.fragment.com/gift/witchhat.webp' },
  { name: 'Restless Jar',     stars: 447,    img: 'https://nft.fragment.com/gift/restlessjar.webp' },
  { name: 'Swag Bag',         stars: 447,    img: 'https://nft.fragment.com/gift/swagbag.webp' },
  { name: 'Stellar Rocket',   stars: 433,    img: 'https://nft.fragment.com/gift/stellarrocket.webp' },
  { name: 'Snow Globe',       stars: 419,    img: 'https://nft.fragment.com/gift/snowglobe.webp' },
  { name: 'Snow Mittens',     stars: 414,    img: 'https://nft.fragment.com/gift/snowmittens.webp' },
  { name: 'Timeless Book',    stars: 413,    img: 'https://nft.fragment.com/gift/timelessbook.webp' },
  { name: 'Star Notepad',     stars: 413,    img: 'https://nft.fragment.com/gift/starnotepad.webp' },
  { name: 'B-Day Candle',     stars: 407,    img: 'https://nft.fragment.com/gift/bdaycandle.webp' },
  { name: 'Money Pot',        stars: 388,    img: 'https://nft.fragment.com/gift/moneypot.webp' },
  { name: 'Hex Pot',          stars: 385,    img: 'https://nft.fragment.com/gift/hexpot.webp' },
  { name: 'Cookie Heart',     stars: 385,    img: 'https://nft.fragment.com/gift/cookieheart.webp' },
  { name: 'Santa Hat',        stars: 381,    img: 'https://nft.fragment.com/gift/santahat.webp' },
  { name: 'Mousse Cake',      stars: 378,    img: 'https://nft.fragment.com/gift/moussecake.webp' },
  { name: 'Victory Medal',    stars: 371,    img: 'https://nft.fragment.com/gift/victorymedal.webp' },
  { name: 'Party Sparkler',   stars: 363,    img: 'https://nft.fragment.com/gift/partysparkler.webp' },
  { name: 'Mood Pack',        stars: 363,    img: 'https://nft.fragment.com/gift/moodpack.webp' },
  { name: 'Easter Egg',       stars: 361,    img: 'https://nft.fragment.com/gift/easteregg.webp' },
  { name: 'Fresh Socks',      stars: 357,    img: 'https://nft.fragment.com/gift/freshsocks.webp' },
  { name: 'Spiced Wine',      stars: 355,    img: 'https://nft.fragment.com/gift/spicedwine.webp' },
  { name: 'Pretty Posy',      stars: 355,    img: 'https://nft.fragment.com/gift/prettyposy.webp' },
  { name: 'Ginger Cookie',    stars: 336,    img: 'https://nft.fragment.com/gift/gingercookie.webp' },
  { name: 'Happy Brownie',    stars: 333,    img: 'https://nft.fragment.com/gift/happybrownie.webp' },
  { name: 'Tama Gadget',      stars: 332,    img: 'https://nft.fragment.com/gift/tamagadget.webp' },
  { name: 'Jack-in-the-Box',  stars: 330,    img: 'https://nft.fragment.com/gift/jackinthebox.webp' },
  { name: 'Hypno Lollipop',   stars: 330,    img: 'https://nft.fragment.com/gift/hypnolollipop.webp' },
  { name: 'Lol Pop',          stars: 310,    img: 'https://nft.fragment.com/gift/lolpop.webp' },
  { name: 'Jester Hat',       stars: 321,    img: 'https://nft.fragment.com/gift/jesterhat.webp' },
  { name: 'Pet Snake',        stars: 317,    img: 'https://nft.fragment.com/gift/petsnake.webp' },
  { name: 'Winter Wreath',    stars: 312,    img: 'https://nft.fragment.com/gift/winterwreath.webp' },
  { name: 'Pool Float',       stars: 311,    img: 'https://nft.fragment.com/gift/poolfloat.webp' },
  { name: 'Holiday Drink',    stars: 295,    img: 'https://nft.fragment.com/gift/holidaydrink.webp' },
  { name: 'Big Year',         stars: 292,    img: 'https://nft.fragment.com/gift/bigyear.webp' },
  { name: 'Ice Cream',        stars: 289,    img: 'https://nft.fragment.com/gift/icecream.webp' },
  { name: 'Whip Cupcake',     stars: 286,    img: 'https://nft.fragment.com/gift/whipcupcake.webp' },
  { name: 'Snake Box',        stars: 276,    img: 'https://nft.fragment.com/gift/snakebox.webp' },
  { name: 'Instant Ramen',    stars: 273,    img: 'https://nft.fragment.com/gift/instantramen.webp' },
  { name: 'Lunar Snake',      stars: 267,    img: 'https://nft.fragment.com/gift/lunarsnake.webp' },
  { name: 'Candy Cane',       stars: 266,    img: 'https://nft.fragment.com/gift/candycane.webp' },
  { name: 'Vice Cream',       stars: 264,    img: 'https://nft.fragment.com/gift/vicecream.webp' },
  { name: 'Xmas Stocking',    stars: 264,    img: 'https://nft.fragment.com/gift/xmasstocking.webp' },
  { name: 'Chill Flame',      stars: 262,    img: 'https://nft.fragment.com/gift/chillflame.webp' },
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
