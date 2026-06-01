import { Router } from 'express';
import https from 'node:https';

export const giftsRouter = Router();

// Захардкоженные file_path (получены через Bot API, без токена в URL клиента)
const GIFT_PATHS = {
  instant_ramen:   'thumbnails/file_132.webp',
  lunar_snake:     'thumbnails/file_128.webp',
  candy_cane:      'thumbnails/file_120.webp',
  chill_flame:     'thumbnails/file_126.webp',
  lol_pop:         'thumbnails/file_118.webp',
  ice_cream:       'thumbnails/file_119.webp',
  whip_cupcake:    'thumbnails/file_125.webp',
  snake_box:       'thumbnails/file_127.webp',
  jack_in_the_box: 'thumbnails/file_131.webp',
  hypno_lollipop:  'thumbnails/file_129.webp',
  jester_hat:      'thumbnails/file_130.webp',
  pet_snake:       'thumbnails/file_122.webp',
  winter_wreath:   'thumbnails/file_123.webp',
  plush_pepe:      'thumbnails/file_121.webp',
  heart_locket:    'thumbnails/file_148.webp',
  durov_cap:       'thumbnails/file_142.webp',
  precious_peach:  'thumbnails/file_208.webp',
  heroic_helmet:   'thumbnails/file_145.webp',
  scared_cat:      'thumbnails/file_138.webp',
  astral_shard:    'thumbnails/file_135.webp',
  mighty_arm:      'thumbnails/file_136.webp',
  loot_bag:        'thumbnails/file_146.webp',
  ion_gem:         'thumbnails/file_134.webp',
  perfume_bottle:  'thumbnails/file_137.webp',
  mini_oscar:      'thumbnails/file_143.webp',
  westside_sign:   'thumbnails/file_144.webp',
  gem_signet:      'thumbnails/file_156.webp',
  artisan_brick:   'thumbnails/file_155.webp',
  kissed_frog:     'thumbnails/file_117.webp',
  swiss_watch:     'thumbnails/file_124.webp',
  sharp_tongue:    'thumbnails/file_152.webp',
  genie_lamp:      'thumbnails/file_147.webp',
  neko_helmet:     'thumbnails/file_167.webp',
  toy_bear:        'thumbnails/file_153.webp',
  vintage_cigar:   'thumbnails/file_178.webp',
  signet_ring:     'thumbnails/file_139.webp',
  eternal_rose:    'thumbnails/file_180.webp',
  khabib_papakha:  'thumbnails/file_160.webp',
  cupid_charm:     'thumbnails/file_150.webp',
  sky_stilettos:   'thumbnails/file_192.webp',
  ionic_dryer:     'thumbnails/file_184.webp',
  love_potion:     'thumbnails/file_172.webp',
  ufc_strike:      'thumbnails/file_179.webp',
  flying_broom:    'thumbnails/file_149.webp',
  snoop_cigar:     'thumbnails/file_151.webp',
  record_player:   'thumbnails/file_193.webp',
  crystal_ball:    'thumbnails/file_205.webp',
  love_candle:     'thumbnails/file_177.webp',
  sakura_flower:   'thumbnails/file_196.webp',
  top_hat:         'thumbnails/file_154.webp',
  jolly_chimp:     'thumbnails/file_173.webp',
  hanging_star:    'thumbnails/file_175.webp',
  bunny_muffin:    'thumbnails/file_195.webp',
  jingle_bells:    'thumbnails/file_210.webp',
  sleigh_bell:     'thumbnails/file_140.webp',
  evil_eye:        'thumbnails/file_162.webp',
  witch_hat:       'thumbnails/file_165.webp',
  swag_bag:        'thumbnails/file_185.webp',
  stellar_rocket:  'thumbnails/file_157.webp',
  snow_globe:      'thumbnails/file_188.webp',
  timeless_book:   'thumbnails/file_171.webp',
  star_notepad:    'thumbnails/file_174.webp',
  b_day_candle:    'thumbnails/file_182.webp',
  money_pot:       'thumbnails/file_176.webp',
  hex_pot:         'thumbnails/file_189.webp',
  cookie_heart:    'thumbnails/file_199.webp',
  santa_hat:       'thumbnails/file_183.webp',
  victory_medal:   'thumbnails/file_198.webp',
  party_sparkler:  'thumbnails/file_170.webp',
  mood_pack:       'thumbnails/file_191.webp',
  easter_egg:      'thumbnails/file_159.webp',
  fresh_socks:     'thumbnails/file_190.webp',
  spiced_wine:     'thumbnails/file_186.webp',
  pretty_posy:     'thumbnails/file_164.webp',
  ginger_cookie:   'thumbnails/file_209.webp',
  happy_brownie:   'thumbnails/file_201.webp',
  tama_gadget:     'thumbnails/file_161.webp',
  desk_calendar:   'thumbnails/file_200.webp',
  faith_amulet:    'thumbnails/file_166.webp',
  homemade_cake:   'thumbnails/file_207.webp',
  bow_tie:         'thumbnails/file_203.webp',
  spring_basket:   'thumbnails/file_204.webp',
  clover_pin:      'thumbnails/file_158.webp',
  eternal_candle:  'thumbnails/file_202.webp',
  lush_bouquet:    'thumbnails/file_197.webp',
  snoop_dogg:      'thumbnails/file_206.webp',
  spy_agaric:      'thumbnails/file_187.webp',
  input_key:       'thumbnails/file_169.webp',
  low_rider:       'thumbnails/file_194.webp',
};

// GET /api/gifts/image?name=instant_ramen
giftsRouter.get('/image', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'missing name' });

  const filePath = GIFT_PATHS[name];
  if (!filePath) return res.status(404).json({ error: 'not found' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ error: 'no bot token' });

  const imgUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

  https.get(imgUrl, (imgRes) => {
    if (imgRes.statusCode !== 200) {
      return res.status(imgRes.statusCode).json({ error: 'upstream error' });
    }
    res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    imgRes.pipe(res);
  }).on('error', () => res.status(500).json({ error: 'proxy error' }));
});
