import TelegramBot from 'node-telegram-bot-api';
import { db, getAllGameSettings, setGameSetting } from '../db/index.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';

// Список подарков с telegifter.ru
const GIFT_LIST = [
  { name: 'Plush Pepe',       stars: 644615 },
  { name: 'Heart Locket',     stars: 143409 },
  { name: "Durov's Cap",      stars: 55875  },
  { name: 'Precious Peach',   stars: 29639  },
  { name: 'Heroic Helmet',    stars: 20199  },
  { name: 'Scared Cat',       stars: 17916  },
  { name: 'Astral Shard',     stars: 15150  },
  { name: 'Mighty Arm',       stars: 12889  },
  { name: 'Loot Bag',         stars: 11959  },
  { name: 'Nail Bracelet',    stars: 11244  },
  { name: 'Ion Gem',          stars: 7374   },
  { name: 'Perfume Bottle',   stars: 7308   },
  { name: 'Mini Oscar',       stars: 7308   },
  { name: 'Westside Sign',    stars: 7202   },
  { name: 'Gem Signet',       stars: 6903   },
  { name: 'Artisan Brick',    stars: 6491   },
  { name: 'Magic Potion',     stars: 6112   },
  { name: 'Kissed Frog',      stars: 4637   },
  { name: 'Swiss Watch',      stars: 4517   },
  { name: 'Sharp Tongue',     stars: 4452   },
  { name: 'Genie Lamp',       stars: 4287   },
  { name: 'Bonded Ring',      stars: 3982   },
  { name: 'Neko Helmet',      stars: 3877   },
  { name: 'Toy Bear',         stars: 3842   },
  { name: 'Vintage Cigar',    stars: 3202   },
  { name: 'Signet Ring',      stars: 3173   },
  { name: 'Voodoo Doll',      stars: 2972   },
  { name: 'Electric Skull',   stars: 2816   },
  { name: 'Diamond Ring',     stars: 2509   },
  { name: 'Eternal Rose',     stars: 2376   },
  { name: 'Bling Binky',      stars: 2324   },
  { name: 'Rare Bird',        stars: 2293   },
  { name: "Khabib's Papakha", stars: 2245   },
  { name: 'Cupid Charm',      stars: 1857   },
  { name: 'Sky Stilettos',    stars: 1593   },
  { name: 'Ionic Dryer',      stars: 1404   },
  { name: 'Love Potion',      stars: 1395   },
  { name: 'UFC Strike',       stars: 1339   },
  { name: 'Mad Pumpkin',      stars: 1142   },
  { name: 'Trapped Heart',    stars: 1136   },
  { name: 'Skull Flower',     stars: 1047   },
  { name: 'Flying Broom',     stars: 1041   },
  { name: 'Snoop Cigar',      stars: 1032   },
  { name: 'Record Player',    stars: 1008   },
  { name: 'Love Candle',      stars: 940    },
  { name: 'Crystal Ball',     stars: 917    },
  { name: 'Valentine Box',    stars: 882    },
  { name: 'Sakura Flower',    stars: 878    },
  { name: 'Top Hat',          stars: 856    },
  { name: 'Berry Box',        stars: 793    },
  { name: 'Jolly Chimp',      stars: 708    },
  { name: 'Hanging Star',     stars: 702    },
  { name: 'Bunny Muffin',     stars: 699    },
  { name: 'Jelly Bunny',      stars: 675    },
  { name: 'Jingle Bells',     stars: 668    },
  { name: 'Joyful Bundle',    stars: 665    },
  { name: 'Sleigh Bell',      stars: 663    },
  { name: 'Evil Eye',         stars: 650    },
  { name: 'Light Sword',      stars: 619    },
  { name: 'Eternal Candle',   stars: 544    },
  { name: 'Lush Bouquet',     stars: 515    },
  { name: 'Moon Pendant',     stars: 510    },
  { name: 'Snoop Dogg',       stars: 499    },
  { name: 'Spy Agaric',       stars: 499    },
  { name: 'Input Key',        stars: 492    },
  { name: 'Desk Calendar',    stars: 492    },
  { name: 'Faith Amulet',     stars: 490    },
  { name: 'Homemade Cake',    stars: 489    },
  { name: 'Bow Tie',          stars: 473    },
  { name: 'Spring Basket',    stars: 460    },
  { name: 'Clover Pin',       stars: 457    },
  { name: 'Witch Hat',        stars: 455    },
  { name: 'Restless Jar',     stars: 447    },
  { name: 'Swag Bag',         stars: 447    },
  { name: 'Stellar Rocket',   stars: 433    },
  { name: 'Snow Globe',       stars: 419    },
  { name: 'Snow Mittens',     stars: 414    },
  { name: 'Timeless Book',    stars: 413    },
  { name: 'Star Notepad',     stars: 413    },
  { name: 'B-Day Candle',     stars: 407    },
  { name: 'Money Pot',        stars: 388    },
  { name: 'Hex Pot',          stars: 385    },
  { name: 'Cookie Heart',     stars: 385    },
  { name: 'Santa Hat',        stars: 381    },
  { name: 'Mousse Cake',      stars: 378    },
  { name: 'Victory Medal',    stars: 371    },
  { name: 'Party Sparkler',   stars: 363    },
  { name: 'Easter Egg',       stars: 361    },
  { name: 'Fresh Socks',      stars: 357    },
  { name: 'Spiced Wine',      stars: 355    },
  { name: 'Pretty Posy',      stars: 355    },
  { name: 'Ginger Cookie',    stars: 336    },
  { name: 'Happy Brownie',    stars: 333    },
  { name: 'Tama Gadget',      stars: 332    },
  { name: 'Jack in the Box',  stars: 330    },
  { name: 'Hypno Lollipop',   stars: 330    },
  { name: 'Jester Hat',       stars: 321    },
  { name: 'Lol Pop',          stars: 310    },
  { name: 'Pet Snake',        stars: 317    },
  { name: 'Winter Wreath',    stars: 312    },
  { name: 'Pool Float',       stars: 311    },
  { name: 'Holiday Drink',    stars: 295    },
  { name: 'Big Year',         stars: 292    },
  { name: 'Ice Cream',        stars: 289    },
  { name: 'Whip Cupcake',     stars: 286    },
  { name: 'Snake Box',        stars: 276    },
  { name: 'Instant Ramen',    stars: 273    },
  { name: 'Lunar Snake',      stars: 267    },
  { name: 'Candy Cane',       stars: 266    },
  { name: 'Low Rider',        stars: 4969   },
].map(g => ({ ...g, img: `https://telegifter.ru/wp-content/themes/gifts/assets/img/gifts/noupdate/${encodeURIComponent(g.name)}.webp` }));

// callback_data ограничен 64 байтами — кодируем имя через индекс
function encodeGiftName(name) {
  const idx = GIFT_LIST.findIndex(g => g.name === name);
  return idx >= 0 ? String(idx) : '0';
}
function decodeGiftByIndex(idx) {
  return GIFT_LIST[parseInt(idx)] || GIFT_LIST[0];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '../../data');
const UPLOADS_DIR = join(DATA_DIR, 'uploads');

// Создаем папку для загрузок
mkdirSync(UPLOADS_DIR, { recursive: true });

const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

// Временное хранилище для состояний пользователей
const userStates = new Map();

export function startBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  function isAdmin(userId) {
    return userId === ADMIN_TELEGRAM_ID;
  }

  // Скачать файл по URL
  async function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          writeFileSync(filepath, Buffer.concat(chunks));
          resolve(filepath);
        });
      }).on('error', reject);
    });
  }

  // /myid
  bot.onText(/\/myid/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    bot.sendMessage(chatId, `Ваш Telegram ID: \`${userId}\`\n\nДобавьте его в .env:\nADMIN_TELEGRAM_ID=${userId}`, {
      parse_mode: 'Markdown',
    });
  });

  // /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Открой игру через кнопку меню.');
  });

  // /admin
  bot.onText(/\/admin$/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к админ-панели.');
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '📦 Управление кейсами', callback_data: 'admin_cases' }],
        [{ text: '👥 Управление игроками', callback_data: 'admin_players' }],
        [{ text: '⚙️ Настройки игры', callback_data: 'admin_settings' }],
      ],
    };

    bot.sendMessage(chatId, '🔧 *Админ-панель*\n\nВыберите раздел:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // Обработка callback
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;

    if (!isAdmin(userId)) {
      return bot.answerCallbackQuery(query.id, { text: '❌ Нет доступа' });
    }

    const data = query.data;

    try {
      // Главное меню кейсов
      if (data === 'admin_cases') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '➕ Добавить кейс', callback_data: 'case_add' }],
            [{ text: '📋 Список кейсов', callback_data: 'case_list' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }],
          ],
        };

        await bot.editMessageText('📦 *Управление кейсами*\n\nВыберите действие:', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Добавить кейс
      else if (data === 'case_add') {
        await bot.editMessageText(
          '➕ *Добавление кейса*\n\n' +
          'Отправьте данные в формате:\n' +
          '```\n' +
          'Название: Лунный кейс\n' +
          'Цена: 100\n' +
          'Редкость: rare\n' +
          '```\n\n' +
          'Редкость: free, common, rare, epic, limited\n\n' +
          'После этого отправьте изображение кейса.',
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin_cases' }]],
            },
          }
        );
        userStates.set(userId, { action: 'creating_case' });
        bot.answerCallbackQuery(query.id);
      }

      // Список кейсов
      else if (data === 'case_list') {
        const cases = db.prepare('SELECT * FROM cases ORDER BY price_coins').all();

        if (cases.length === 0) {
          await bot.editMessageText('📋 *Список кейсов*\n\nКейсов пока нет.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin_cases' }]],
            },
          });
        } else {
          const buttons = cases.map((c) => [
            { text: `${c.name_ru} (${c.price_coins}⭐)`, callback_data: `case_edit_${c.id}` },
          ]);
          buttons.push([{ text: '🔙 Назад', callback_data: 'admin_cases' }]);

          await bot.editMessageText('📋 *Список кейсов*\n\nВыберите кейс:', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons },
          });
        }
        bot.answerCallbackQuery(query.id);
      }

      // Редактирование кейса
      else if (data.startsWith('case_edit_')) {
        const caseId = parseInt(data.replace('case_edit_', ''));
        const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);

        if (!caseData) {
          return bot.answerCallbackQuery(query.id, { text: '❌ Кейс не найден' });
        }

        const items = db.prepare('SELECT * FROM case_items WHERE case_id = ?').all(caseId);
        const itemsText = items.map((it) => `  • ${it.label_ru}: ${it.amount}⭐ (${it.chance}%)`).join('\n');

        const keyboard = {
          inline_keyboard: [
            [{ text: '🖼️ Изменить изображение', callback_data: `case_image_${caseId}` }],
            [{ text: '✏️ Изменить цену', callback_data: `case_price_${caseId}` }],
            [{ text: '🎁 Добавить предмет', callback_data: `case_additem_${caseId}` }],
            [{ text: '📋 Список предметов', callback_data: `case_items_${caseId}` }],
            [{ text: '🗑️ Удалить кейс', callback_data: `case_delete_${caseId}` }],
            [{ text: '🔙 Назад', callback_data: 'case_list' }],
          ],
        };

        const text = `📦 *${caseData.name_ru}*\n\n` +
          `Цена: ${caseData.price_coins}⭐\n` +
          `Редкость: ${caseData.rarity}\n` +
          `Включен: ${caseData.enabled ? 'Да' : 'Нет'}\n\n` +
          `*Предметы:*\n${itemsText || '  Нет предметов'}`;

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Изменить изображение кейса
      else if (data.startsWith('case_image_')) {
        const caseId = parseInt(data.replace('case_image_', ''));
        userStates.set(userId, { action: 'updating_case_image', caseId });

        await bot.sendMessage(chatId, '🖼️ Отправьте новое изображение для кейса:');
        bot.answerCallbackQuery(query.id);
      }

      // Добавить предмет в кейс — показываем список подарков постранично
      else if (data.startsWith('case_additem_')) {
        const caseId = parseInt(data.replace('case_additem_', ''));
        userStates.set(userId, { action: 'adding_item', caseId });

        await bot.editMessageText(
          `🎁 *Добавление предмета в кейс #${caseId}*\n\n` +
          'Выберите способ добавления:',
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 Выбрать подарок из списка', callback_data: `gift_pick_${caseId}_0` }],
                [{ text: '✏️ Ввести данные вручную', callback_data: `item_manual_${caseId}` }],
                [{ text: '🔙 Назад', callback_data: `case_edit_${caseId}` }],
              ],
            },
          }
        );
        bot.answerCallbackQuery(query.id);
      }

      // Ручной ввод предмета
      else if (data.startsWith('item_manual_')) {
        const caseId = parseInt(data.replace('item_manual_', ''));
        userStates.set(userId, { action: 'adding_item', caseId });

        await bot.sendMessage(
          chatId,
          `✏️ *Ручное добавление предмета в кейс #${caseId}*\n\n` +
          'Отправьте данные:\n' +
          '```\n' +
          'Название: Алмаз\n' +
          'Сумма: 500\n' +
          'Шанс: 10\n' +
          'Редкость: rare\n' +
          '```\n\nПосле этого отправьте фото предмета.',
          { parse_mode: 'Markdown' }
        );
        bot.answerCallbackQuery(query.id);
      }

      // Выбор подарка из списка (постранично по 8)
      else if (data.startsWith('gift_pick_')) {
        const parts = data.split('_');
        const caseId = parseInt(parts[2]);
        const page = parseInt(parts[3]) || 0;
        const PAGE_SIZE = 8;

        const gifts = GIFT_LIST.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        const totalPages = Math.ceil(GIFT_LIST.length / PAGE_SIZE);

        const buttons = gifts.map((g, i) => ([{
          text: `${g.name} (${g.stars}⭐)`,
          callback_data: `gift_sel_${caseId}_${page * PAGE_SIZE + i}`,
        }]));

        const navRow = [];
        if (page > 0) navRow.push({ text: '◀️', callback_data: `gift_pick_${caseId}_${page - 1}` });
        navRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' });
        if (page < totalPages - 1) navRow.push({ text: '▶️', callback_data: `gift_pick_${caseId}_${page + 1}` });

        buttons.push(navRow);
        buttons.push([{ text: '🔙 Назад', callback_data: `case_additem_${caseId}` }]);

        await bot.editMessageText(
          `🎁 *Выберите подарок для кейса #${caseId}*\n_(страница ${page + 1} из ${totalPages})_`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons },
          }
        );
        bot.answerCallbackQuery(query.id);
      }

      // Подарок выбран — просим ввести данные, затем фото
      else if (data.startsWith('gift_sel_')) {
        const parts = data.split('_');
        const caseId = parseInt(parts[2]);
        const giftIdx = parseInt(parts[3]);
        const gift = decodeGiftByIndex(giftIdx);

        if (!gift) return bot.answerCallbackQuery(query.id, { text: '❌ Подарок не найден' });

        userStates.set(userId, {
          action: 'adding_gift_item_text',
          caseId,
          giftName: gift.name,
          giftImg: gift.img,
        });

        const imgUrl = `https://telegifter.ru/wp-content/themes/gifts/assets/img/gifts/noupdate/${encodeURIComponent(gift.name)}.webp`;

        try {
          await bot.sendPhoto(chatId, imgUrl, {
            caption:
              `✅ Выбран: *${gift.name}*\n\n` +
              'Отправьте данные:\n```\nСумма: 500\nШанс: 10\nРедкость: rare\n```\n\nЗатем отправьте *фото* или напишите "пропустить" для фото по умолчанию',
            parse_mode: 'Markdown',
          });
        } catch {
          await bot.sendMessage(chatId,
            `✅ Выбран: *${gift.name}*\n\nОтправьте:\`\`\`\nСумма: 500\nШанс: 10\nРедкость: rare\n\`\`\`\n\nЗатем фото или "пропустить"`,
            { parse_mode: 'Markdown' }
          );
        }
        bot.answerCallbackQuery(query.id);
      }

      else if (data === 'noop') {
        bot.answerCallbackQuery(query.id);
      }

      // Список предметов кейса
      else if (data.startsWith('case_items_')) {
        const caseId = parseInt(data.replace('case_items_', ''));
        const items = db.prepare('SELECT * FROM case_items WHERE case_id = ?').all(caseId);

        if (items.length === 0) {
          await bot.sendMessage(chatId, '📋 В этом кейсе пока нет предметов.');
        } else {
          const buttons = items.map((it) => [
            { text: `${it.label_ru} (${it.amount}⭐)`, callback_data: `item_edit_${it.id}` },
          ]);
          buttons.push([{ text: '🔙 Назад', callback_data: `case_edit_${caseId}` }]);

          await bot.sendMessage(chatId, '📋 *Предметы кейса:*', {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons },
          });
        }
        bot.answerCallbackQuery(query.id);
      }

      // Удалить кейс
      else if (data.startsWith('case_delete_')) {
        const caseId = parseInt(data.replace('case_delete_', ''));

        db.prepare('DELETE FROM case_items WHERE case_id = ?').run(caseId);
        db.prepare('DELETE FROM cases WHERE id = ?').run(caseId);

        await bot.editMessageText('✅ Кейс успешно удален!', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 К списку', callback_data: 'case_list' }]],
          },
        });
        bot.answerCallbackQuery(query.id);
      }

      // Управление игроками
      else if (data === 'admin_players') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '💰 Добавить валюту', callback_data: 'player_add_currency' }],
            [{ text: '📊 Статистика игроков', callback_data: 'player_stats' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }],
          ],
        };

        await bot.editMessageText('👥 *Управление игроками*\n\nВыберите действие:', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Добавить валюту
      else if (data === 'player_add_currency') {
        await bot.editMessageText(
          '💰 *Добавить валюту игроку*\n\n' +
          'Используйте команду:\n' +
          '`/addcoins <telegram_id> <количество>`\n\n' +
          'Например: `/addcoins 123456789 1000`',
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin_players' }]],
            },
          }
        );
        bot.answerCallbackQuery(query.id);
      }

      // Статистика игроков
      else if (data === 'player_stats') {
        const stats = db.prepare(`
          SELECT COUNT(*) as total,
                 SUM(balance) as total_balance,
                 SUM(demo_balance) as total_demo
          FROM users
        `).get();

        const topPlayers = db.prepare(`
          SELECT telegram_id, username, balance
          FROM users
          ORDER BY balance DESC
          LIMIT 5
        `).all();

        let text = '📊 *Статистика игроков*\n\n';
        text += `Всего игроков: ${stats.total}\n`;
        text += `Общий баланс: ${stats.total_balance || 0}⭐\n`;
        text += `Демо баланс: ${stats.total_demo || 0}⭐\n\n`;
        text += '*Топ-5 игроков:*\n';
        topPlayers.forEach((p, i) => {
          text += `${i + 1}. @${p.username || 'unknown'} - ${p.balance}⭐\n`;
        });

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin_players' }]],
          },
        });
        bot.answerCallbackQuery(query.id);
      }

      // Настройки игры
      else if (data === 'admin_settings') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '🎲 Настроить шансы крэша', callback_data: 'settings_crash' }],
            [{ text: '📦 Настроить шансы кейсов', callback_data: 'settings_cases' }],
            [{ text: '🔙 Назад', callback_data: 'admin_back' }],
          ],
        };

        await bot.editMessageText('⚙️ *Настройки игры*\n\nВыберите раздел:', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Настройки крэша
      else if (data === 'settings_crash') {
        const settings = getAllGameSettings();

        const keyboard = {
          inline_keyboard: [
            [{ text: '📉 Минимальный крэш', callback_data: 'set_crash_min' }],
            [{ text: '📈 Максимальный крэш', callback_data: 'set_crash_max' }],
            [{ text: '🏠 House Edge', callback_data: 'set_crash_edge' }],
            [{ text: '🔙 Назад', callback_data: 'admin_settings' }],
          ],
        };

        const text = '🎲 *Настройки шансов крэша*\n\n' +
          `Минимальный крэш: ${settings.crash_min || '1.00'}x\n` +
          `Максимальный крэш: ${settings.crash_max || '100.00'}x\n` +
          `House Edge: ${(parseFloat(settings.crash_house_edge || 0.04) * 100).toFixed(1)}%\n\n` +
          'Выберите параметр для изменения:';

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Настройки кейсов
      else if (data === 'settings_cases') {
        const settings = getAllGameSettings();

        const keyboard = {
          inline_keyboard: [
            [{ text: '🏠 House Edge кейсов', callback_data: 'set_case_edge' }],
            [{ text: '🔙 Назад', callback_data: 'admin_settings' }],
          ],
        };

        const text = '📦 *Настройки шансов кейсов*\n\n' +
          `House Edge: ${(parseFloat(settings.case_house_edge || 0.10) * 100).toFixed(1)}%\n\n` +
          'House Edge определяет процент прибыли казино от кейсов.\n' +
          'Например, 10% означает что в среднем игрок получит 90% от стоимости кейса.';

        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }

      // Установка минимального крэша
      else if (data === 'set_crash_min') {
        userStates.set(userId, { action: 'setting_crash_min' });
        await bot.sendMessage(chatId, '📉 Отправьте минимальное значение крэша (например: 1.00):');
        bot.answerCallbackQuery(query.id);
      }

      // Установка максимального крэша
      else if (data === 'set_crash_max') {
        userStates.set(userId, { action: 'setting_crash_max' });
        await bot.sendMessage(chatId, '📈 Отправьте максимальное значение крэша (например: 100.00):');
        bot.answerCallbackQuery(query.id);
      }

      // Установка house edge крэша
      else if (data === 'set_crash_edge') {
        userStates.set(userId, { action: 'setting_crash_edge' });
        await bot.sendMessage(chatId, '🏠 Отправьте House Edge в процентах (например: 4 для 4%):');
        bot.answerCallbackQuery(query.id);
      }

      // Установка house edge кейсов
      else if (data === 'set_case_edge') {
        userStates.set(userId, { action: 'setting_case_edge' });
        await bot.sendMessage(chatId, '🏠 Отправьте House Edge кейсов в процентах (например: 10 для 10%):');
        bot.answerCallbackQuery(query.id);
      }

      // Назад в главное меню
      else if (data === 'admin_back') {
        const keyboard = {
          inline_keyboard: [
            [{ text: '📦 Управление кейсами', callback_data: 'admin_cases' }],
            [{ text: '👥 Управление игроками', callback_data: 'admin_players' }],
            [{ text: '⚙️ Настройки игры', callback_data: 'admin_settings' }],
          ],
        };

        await bot.editMessageText('🔧 *Админ-панель*\n\nВыберите раздел:', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        bot.answerCallbackQuery(query.id);
      }
    } catch (err) {
      console.error('[bot] Callback error:', err);
      bot.answerCallbackQuery(query.id, { text: '❌ Ошибка: ' + err.message });
    }
  });

  // Обработка текстовых сообщений
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!isAdmin(userId)) return;
    if (!text || text.startsWith('/')) return;

    const state = userStates.get(userId);
    if (!state) return;

    try {
      // Создание кейса
      if (state.action === 'creating_case') {
        const nameMatch = text.match(/Название:\s*(.+)/i);
        const priceMatch = text.match(/Цена:\s*(\d+)/i);
        const rarityMatch = text.match(/Редкость:\s*(\w+)/i);

        if (!nameMatch || !priceMatch || !rarityMatch) {
          return bot.sendMessage(chatId, '❌ Неверный формат. Проверьте данные.');
        }

        const name = nameMatch[1].trim();
        const price = parseInt(priceMatch[1]);
        const rarity = rarityMatch[1].toLowerCase();

        userStates.set(userId, {
          action: 'creating_case_waiting_image',
          name,
          price,
          rarity,
        });

        bot.sendMessage(chatId, '✅ Данные приняты! Теперь отправьте изображение кейса.');
      }

      // Добавление предмета вручную
      else if (state.action === 'adding_item') {
        const nameMatch = text.match(/Название:\s*(.+)/i);
        const amountMatch = text.match(/Сумма:\s*(\d+)/i);
        const chanceMatch = text.match(/Шанс:\s*([\d.]+)/i);
        const rarityMatch = text.match(/Редкость:\s*(\w+)/i);

        if (!nameMatch || !amountMatch || !chanceMatch) {
          return bot.sendMessage(chatId, '❌ Неверный формат. Проверьте данные.');
        }

        const name = nameMatch[1].trim();
        const amount = parseInt(amountMatch[1]);
        const chance = parseFloat(chanceMatch[1]);
        const rarity = rarityMatch ? rarityMatch[1].toLowerCase() : 'common';

        userStates.set(userId, {
          action: 'adding_item_waiting_image',
          caseId: state.caseId,
          name,
          amount,
          chance,
          rarity,
        });

        bot.sendMessage(chatId, '✅ Данные приняты! Теперь отправьте изображение предмета.');
      }

      // Добавление подарка — ввод суммы/шанса, затем ждём фото
      else if (state.action === 'adding_gift_item_text') {
        const amountMatch = text.match(/Сумма:\s*(\d+)/i);
        const chanceMatch = text.match(/Шанс:\s*([\d.]+)/i);
        const rarityMatch = text.match(/Редкость:\s*(\w+)/i);

        if (!amountMatch || !chanceMatch) {
          return bot.sendMessage(chatId, '❌ Нужно указать Сумму и Шанс.');
        }

        const amount = parseInt(amountMatch[1]);
        const chance = parseFloat(chanceMatch[1]);
        const rarity = rarityMatch ? rarityMatch[1].toLowerCase() : 'rare';

        // Переходим в ожидание фото
        userStates.set(userId, {
          action: 'adding_gift_item_image',
          caseId: state.caseId,
          giftName: state.giftName,
          giftImg: state.giftImg,
          amount,
          chance,
          rarity,
        });

        bot.sendMessage(chatId, '✅ Данные приняты! Отправьте фото подарка или напишите "пропустить" для фото по умолчанию.');
      }

      // Если пользователь написал "пропустить" — используем фото по умолчанию
      else if (state.action === 'adding_gift_item_image') {
        const useDefault = text.toLowerCase().includes('пропустить') || text.toLowerCase().includes('скип') || text.toLowerCase() === 'нет';

        if (useDefault) {
          db.prepare(`
            INSERT INTO case_items (case_id, label_ru, amount, weight, rarity, image_url, reward_kind, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, 'coins', 0)
          `).run(state.caseId, state.giftName, state.amount, state.chance, state.rarity, state.giftImg);

          userStates.delete(userId);
          bot.sendMessage(chatId,
            `✅ *${state.giftName}* добавлен в кейс!\nСумма: ${state.amount}⭐ | Шанс: ${state.chance}% | Редкость: ${state.rarity}`,
            { parse_mode: 'Markdown' }
          );
        } else {
          bot.sendMessage(chatId, '❓ Не понял. Отправь фото подарка или напиши "пропустить"');
        }
      }

      // Настройка минимального крэша
      else if (state.action === 'setting_crash_min') {
        const value = parseFloat(text);
        if (isNaN(value) || value < 1.00) {
          return bot.sendMessage(chatId, '❌ Неверное значение. Минимум должен быть >= 1.00');
        }
        setGameSetting('crash_min', value.toFixed(2));
        userStates.delete(userId);
        bot.sendMessage(chatId, `✅ Минимальный крэш установлен: ${value.toFixed(2)}x`);
      }

      // Настройка максимального крэша
      else if (state.action === 'setting_crash_max') {
        const value = parseFloat(text);
        if (isNaN(value) || value < 1.00) {
          return bot.sendMessage(chatId, '❌ Неверное значение. Максимум должен быть >= 1.00');
        }
        setGameSetting('crash_max', value.toFixed(2));
        userStates.delete(userId);
        bot.sendMessage(chatId, `✅ Максимальный крэш установлен: ${value.toFixed(2)}x`);
      }

      // Настройка house edge крэша
      else if (state.action === 'setting_crash_edge') {
        const value = parseFloat(text);
        if (isNaN(value) || value < 0 || value > 100) {
          return bot.sendMessage(chatId, '❌ Неверное значение. Введите число от 0 до 100');
        }
        setGameSetting('crash_house_edge', (value / 100).toFixed(4));
        userStates.delete(userId);
        bot.sendMessage(chatId, `✅ House Edge крэша установлен: ${value.toFixed(1)}%`);
      }

      // Настройка house edge кейсов
      else if (state.action === 'setting_case_edge') {
        const value = parseFloat(text);
        if (isNaN(value) || value < 0 || value > 100) {
          return bot.sendMessage(chatId, '❌ Неверное значение. Введите число от 0 до 100');
        }
        setGameSetting('case_house_edge', (value / 100).toFixed(4));
        userStates.delete(userId);
        bot.sendMessage(chatId, `✅ House Edge кейсов установлен: ${value.toFixed(1)}%`);
      }
    } catch (err) {
      console.error('[bot] Message error:', err);
      bot.sendMessage(chatId, `❌ Ошибка: ${err.message}`);
    }
  });

  // Обработка фото
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) return;

    const state = userStates.get(userId);
    if (!state) return;

    try {
      const photo = msg.photo[msg.photo.length - 1];
      const file = await bot.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      const fileName = `${Date.now()}_${file.file_path.split('/').pop()}`;
      const filePath = join(UPLOADS_DIR, fileName);

      await downloadFile(fileUrl, filePath);
      const imageUrl = `/uploads/${fileName}`;

      // Завершение создания кейса
      if (state.action === 'creating_case_waiting_image') {
        const slug = state.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const result = db.prepare(`
          INSERT INTO cases (slug, name_ru, price_coins, rarity, image_url, image_emoji, enabled)
          VALUES (?, ?, ?, ?, ?, '', 1)
        `).run(slug, state.name, state.price, state.rarity, imageUrl);

        userStates.delete(userId);

        bot.sendMessage(
          chatId,
          `✅ Кейс "${state.name}" успешно создан!\n\n` +
          `ID: ${result.lastInsertRowid}\n` +
          `Цена: ${state.price}⭐\n` +
          `Редкость: ${state.rarity}\n\n` +
          `Теперь добавьте предметы через меню /admin`
        );
      }

      // Обновление изображения кейса
      else if (state.action === 'updating_case_image') {
        db.prepare('UPDATE cases SET image_url = ? WHERE id = ?').run(imageUrl, state.caseId);
        userStates.delete(userId);
        bot.sendMessage(chatId, '✅ Изображение кейса обновлено!');
      }

      // Завершение добавления предмета
      else if (state.action === 'adding_item_waiting_image') {
        db.prepare(`
          INSERT INTO case_items (case_id, label_ru, amount, weight, rarity, image_url, reward_kind, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, 'coins', 0)
        `).run(state.caseId, state.name, state.amount, state.chance, state.rarity, imageUrl);

        userStates.delete(userId);

        bot.sendMessage(
          chatId,
          `✅ Предмет "${state.name}" добавлен в кейс #${state.caseId}!\n\n` +
          `Сумма: ${state.amount}⭐\n` +
          `Шанс: ${state.chance}%\n` +
          `Редкость: ${state.rarity}`
        );
      }

      // Фото для выбранного из списка подарка
      else if (state.action === 'adding_gift_item_image') {
        db.prepare(`
          INSERT INTO case_items (case_id, label_ru, amount, weight, rarity, image_url, reward_kind, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, 'coins', 0)
        `).run(state.caseId, state.giftName, state.amount, state.chance, state.rarity, imageUrl);

        userStates.delete(userId);

        bot.sendMessage(
          chatId,
          `✅ *${state.giftName}* добавлен в кейс!\n` +
          `Сумма: ${state.amount}⭐ | Шанс: ${state.chance}% | Редкость: ${state.rarity}`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (err) {
      console.error('[bot] Photo error:', err);
      bot.sendMessage(chatId, `❌ Ошибка загрузки изображения: ${err.message}`);
    }
  });

  // Команда добавления монет
  bot.onText(/\/addcoins (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }

    const targetUserId = parseInt(match[1]);
    const amount = parseInt(match[2]);

    try {
      const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(targetUserId);

      if (!user) {
        return bot.sendMessage(chatId, `❌ Пользователь с ID ${targetUserId} не найден.`);
      }

      db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(amount, targetUserId);

      bot.sendMessage(
        chatId,
        `✅ Успешно добавлено ${amount}⭐ пользователю @${user.username || 'unknown'}\n` +
        `Новый баланс: ${user.balance + amount}⭐`
      );
    } catch (err) {
      bot.sendMessage(chatId, `❌ Ошибка: ${err.message}`);
    }
  });

  console.log('[bot] Telegram bot started');
  return bot;
}
