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

// Имена стикер-сетов Telegram для подарков
function giftImg(stickerSetName) {
  return `/api/gifts/image?name=${encodeURIComponent(stickerSetName)}`;
}

// Список Telegram NFT подарков с официальными изображениями
const TG_GIFTS = [
  { name: 'Plush Pepe',       stars: 644615, img: giftImg('PlushPepe') },
  { name: 'Heart Locket',     stars: 143409, img: giftImg('HeartLocket') },
  { name: "Durov's Cap",      stars: 55875,  img: giftImg('DurovCap') },
  { name: 'Precious Peach',   stars: 29639,  img: giftImg('PreciousPeach') },
  { name: 'Heroic Helmet',    stars: 20199,  img: giftImg('HeroicHelmet') },
  { name: 'Scared Cat',       stars: 17916,  img: giftImg('ScaredCat') },
  { name: 'Astral Shard',     stars: 15150,  img: giftImg('AstralShard') },
  { name: 'Mighty Arm',       stars: 12889,  img: giftImg('MightyArm') },
  { name: 'Loot Bag',         stars: 11959,  img: giftImg('LootBag') },
  { name: 'Nail Bracelet',    stars: 11244,  img: giftImg('NailBracelet') },
  { name: 'Ion Gem',          stars: 7374,   img: giftImg('IonGem') },
  { name: 'Perfume Bottle',   stars: 7308,   img: giftImg('PerfumeBottle') },
  { name: 'Mini Oscar',       stars: 7308,   img: giftImg('MiniOscar') },
  { name: 'Westside Sign',    stars: 7202,   img: giftImg('WestsideSign') },
  { name: 'Gem Signet',       stars: 6903,   img: giftImg('GemSignet') },
  { name: 'Artisan Brick',    stars: 6491,   img: giftImg('ArtisanBrick') },
  { name: 'Magic Potion',     stars: 6112,   img: giftImg('MagicPotion') },
  { name: 'Kissed Frog',      stars: 4637,   img: giftImg('KissedFrog') },
  { name: 'Swiss Watch',      stars: 4517,   img: giftImg('SwissWatch') },
  { name: 'Sharp Tongue',     stars: 4452,   img: giftImg('SharpTongue') },
  { name: 'Genie Lamp',       stars: 4287,   img: giftImg('GenieLamp') },
  { name: 'Bonded Ring',      stars: 3982,   img: giftImg('BondedRing') },
  { name: 'Neko Helmet',      stars: 3877,   img: giftImg('NekoHelmet') },
  { name: 'Toy Bear',         stars: 3842,   img: giftImg('ToyBear') },
  { name: 'Vintage Cigar',    stars: 3202,   img: giftImg('VintageCigar') },
  { name: 'Signet Ring',      stars: 3173,   img: giftImg('SignetRing') },
  { name: 'Voodoo Doll',      stars: 2972,   img: giftImg('VoodooDoll') },
  { name: 'Electric Skull',   stars: 2816,   img: giftImg('ElectricSkull') },
  { name: 'Diamond Ring',     stars: 2509,   img: giftImg('DiamondRing') },
  { name: 'Eternal Rose',     stars: 2376,   img: giftImg('EternalRose') },
  { name: 'Bling Binky',      stars: 2324,   img: giftImg('BlingBinky') },
  { name: 'Rare Bird',        stars: 2293,   img: giftImg('RareBird') },
  { name: "Khabib's Papakha", stars: 2245,   img: giftImg('KhabibPapakha') },
  { name: 'Cupid Charm',      stars: 1857,   img: giftImg('CupidCharm') },
  { name: 'Sky Stilettos',    stars: 1593,   img: giftImg('SkyStilettos') },
  { name: 'Ionic Dryer',      stars: 1404,   img: giftImg('IonicDryer') },
  { name: 'Love Potion',      stars: 1395,   img: giftImg('LovePotion') },
  { name: 'UFC Strike',       stars: 1339,   img: giftImg('UfcStrike') },
  { name: 'Mad Pumpkin',      stars: 1142,   img: giftImg('MadPumpkin') },
  { name: 'Trapped Heart',    stars: 1136,   img: giftImg('TrappedHeart') },
  { name: 'Skull Flower',     stars: 1047,   img: giftImg('SkullFlower') },
  { name: 'Flying Broom',     stars: 1041,   img: giftImg('FlyingBroom') },
  { name: 'Snoop Cigar',      stars: 1032,   img: giftImg('SnoopCigar') },
  { name: 'Record Player',    stars: 1008,   img: giftImg('RecordPlayer') },
  { name: 'Crystal Ball',     stars: 917,    img: giftImg('CrystalBall') },
  { name: 'Love Candle',      stars: 940,    img: giftImg('LoveCandle') },
  { name: 'Valentine Box',    stars: 882,    img: giftImg('ValentineBox') },
  { name: 'Sakura Flower',    stars: 878,    img: giftImg('SakuraFlower') },
  { name: 'Top Hat',          stars: 856,    img: giftImg('TopHat') },
  { name: 'Berry Box',        stars: 793,    img: giftImg('BerryBox') },
  { name: 'Jolly Chimp',      stars: 708,    img: giftImg('JollyChimp') },
  { name: 'Hanging Star',     stars: 702,    img: giftImg('HangingStar') },
  { name: 'Bunny Muffin',     stars: 699,    img: giftImg('BunnyMuffin') },
  { name: 'Jelly Bunny',      stars: 675,    img: giftImg('JellyBunny') },
  { name: 'Jingle Bells',     stars: 668,    img: giftImg('JingleBells') },
  { name: 'Joyful Bundle',    stars: 665,    img: giftImg('JoyfulBundle') },
  { name: 'Sleigh Bell',      stars: 663,    img: giftImg('SleighBell') },
  { name: 'Evil Eye',         stars: 650,    img: giftImg('EvilEye') },
  { name: 'Light Sword',      stars: 619,    img: giftImg('LightSword') },
  { name: 'Witch Hat',        stars: 455,    img: giftImg('WitchHat') },
  { name: 'Restless Jar',     stars: 447,    img: giftImg('RestlessJar') },
  { name: 'Swag Bag',         stars: 447,    img: giftImg('SwagBag') },
  { name: 'Stellar Rocket',   stars: 433,    img: giftImg('StellarRocket') },
  { name: 'Snow Globe',       stars: 419,    img: giftImg('SnowGlobe') },
  { name: 'Snow Mittens',     stars: 414,    img: giftImg('SnowMittens') },
  { name: 'Timeless Book',    stars: 413,    img: giftImg('TimelessBook') },
  { name: 'Star Notepad',     stars: 413,    img: giftImg('StarNotepad') },
  { name: 'B-Day Candle',     stars: 407,    img: giftImg('BDayCandle') },
  { name: 'Money Pot',        stars: 388,    img: giftImg('MoneyPot') },
  { name: 'Hex Pot',          stars: 385,    img: giftImg('HexPot') },
  { name: 'Cookie Heart',     stars: 385,    img: giftImg('CookieHeart') },
  { name: 'Santa Hat',        stars: 381,    img: giftImg('SantaHat') },
  { name: 'Mousse Cake',      stars: 378,    img: giftImg('MousseCake') },
  { name: 'Victory Medal',    stars: 371,    img: giftImg('VictoryMedal') },
  { name: 'Party Sparkler',   stars: 363,    img: giftImg('PartySparkler') },
  { name: 'Mood Pack',        stars: 363,    img: giftImg('MoodPack') },
  { name: 'Easter Egg',       stars: 361,    img: giftImg('EasterEgg') },
  { name: 'Fresh Socks',      stars: 357,    img: giftImg('FreshSocks') },
  { name: 'Spiced Wine',      stars: 355,    img: giftImg('SpicedWine') },
  { name: 'Pretty Posy',      stars: 355,    img: giftImg('PrettyPosy') },
  { name: 'Ginger Cookie',    stars: 336,    img: giftImg('GingerCookie') },
  { name: 'Happy Brownie',    stars: 333,    img: giftImg('HappyBrownie') },
  { name: 'Tama Gadget',      stars: 332,    img: giftImg('TamaGadget') },
  { name: 'Jack-in-the-Box',  stars: 330,    img: giftImg('JackInTheBox') },
  { name: 'Hypno Lollipop',   stars: 330,    img: giftImg('HypnoLollipop') },
  { name: 'Lol Pop',          stars: 310,    img: giftImg('LolPop') },
  { name: 'Jester Hat',       stars: 321,    img: giftImg('JesterHat') },
  { name: 'Pet Snake',        stars: 317,    img: giftImg('PetSnake') },
  { name: 'Winter Wreath',    stars: 312,    img: giftImg('WinterWreath') },
  { name: 'Pool Float',       stars: 311,    img: giftImg('PoolFloat') },
  { name: 'Holiday Drink',    stars: 295,    img: giftImg('HolidayDrink') },
  { name: 'Big Year',         stars: 292,    img: giftImg('BigYear') },
  { name: 'Ice Cream',        stars: 289,    img: giftImg('IceCream') },
  { name: 'Whip Cupcake',     stars: 286,    img: giftImg('WhipCupcake') },
  { name: 'Snake Box',        stars: 276,    img: giftImg('SnakeBox') },
  { name: 'Instant Ramen',    stars: 273,    img: giftImg('InstantRamen') },
  { name: 'Lunar Snake',      stars: 267,    img: giftImg('LunarSnake') },
  { name: 'Candy Cane',       stars: 266,    img: giftImg('CandyCane') },
  { name: 'Vice Cream',       stars: 264,    img: giftImg('ViceCream') },
  { name: 'Xmas Stocking',    stars: 264,    img: giftImg('XmasStocking') },
  { name: 'Chill Flame',      stars: 262,    img: giftImg('ChillFlame') },
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
