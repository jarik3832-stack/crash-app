import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db/index.js';

// Замени на свой Telegram ID после того как узнаешь его командой /myid
const ADMIN_TELEGRAM_ID = parseInt(process.env.ADMIN_TELEGRAM_ID || '0');

export function startBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  // Проверка админа
  function isAdmin(userId) {
    return userId === ADMIN_TELEGRAM_ID;
  }

  // /myid - узнать свой Telegram ID
  bot.onText(/\/myid/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    bot.sendMessage(chatId, `Ваш Telegram ID: \`${userId}\`\n\nДобавьте его в .env файл:\nADMIN_TELEGRAM_ID=${userId}`, {
      parse_mode: 'Markdown',
    });
  });

  // /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Привет! Открой игру через кнопку меню.');
  });

  // /admin - главное меню админки
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

  // Управление кейсами
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;

    if (!isAdmin(userId)) {
      return bot.answerCallbackQuery(query.id, { text: '❌ Нет доступа' });
    }

    const data = query.data;

    // Главное меню кейсов
    if (data === 'admin_cases') {
      const keyboard = {
        inline_keyboard: [
          [{ text: '➕ Добавить кейс', callback_data: 'case_add' }],
          [{ text: '📋 Список кейсов', callback_data: 'case_list' }],
          [{ text: '🔙 Назад', callback_data: 'admin_back' }],
        ],
      };

      bot.editMessageText('📦 *Управление кейсами*\n\nВыберите действие:', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      bot.answerCallbackQuery(query.id);
    }

    // Список кейсов
    else if (data === 'case_list') {
      const cases = db.prepare('SELECT * FROM cases ORDER BY price_coins').all();

      if (cases.length === 0) {
        bot.editMessageText('📋 *Список кейсов*\n\nКейсов пока нет.', {
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

        bot.editMessageText('📋 *Список кейсов*\n\nВыберите кейс для редактирования:', {
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
          [{ text: '✏️ Изменить цену', callback_data: `case_price_${caseId}` }],
          [{ text: '🎁 Управление предметами', callback_data: `case_items_${caseId}` }],
          [{ text: '🗑️ Удалить кейс', callback_data: `case_delete_${caseId}` }],
          [{ text: '🔙 Назад', callback_data: 'case_list' }],
        ],
      };

      const text = `📦 *${caseData.name_ru}*\n\n` +
        `Цена: ${caseData.price_coins}⭐\n` +
        `Редкость: ${caseData.rarity}\n` +
        `Включен: ${caseData.enabled ? 'Да' : 'Нет'}\n\n` +
        `*Предметы:*\n${itemsText || '  Нет предметов'}`;

      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
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

      bot.editMessageText('👥 *Управление игроками*\n\nВыберите действие:', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      bot.answerCallbackQuery(query.id);
    }

    // Добавить валюту игроку
    else if (data === 'player_add_currency') {
      bot.editMessageText(
        '💰 *Добавить валюту игроку*\n\n' +
        'Отправьте сообщение в формате:\n' +
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
      text += `Общий баланс: ${stats.total_balance}⭐\n`;
      text += `Демо баланс: ${stats.total_demo}⭐\n\n`;
      text += '*Топ-5 игроков:*\n';
      topPlayers.forEach((p, i) => {
        text += `${i + 1}. @${p.username || 'unknown'} - ${p.balance}⭐\n`;
      });

      bot.editMessageText(text, {
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
          [{ text: '🎲 Настроить шансы', callback_data: 'settings_chances' }],
          [{ text: '🔙 Назад', callback_data: 'admin_back' }],
        ],
      };

      bot.editMessageText('⚙️ *Настройки игры*\n\nВыберите раздел:', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
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

      bot.editMessageText('🔧 *Админ-панель*\n\nВыберите раздел:', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      bot.answerCallbackQuery(query.id);
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

  // Команда создания кейса
  bot.onText(/\/createcase/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }

    bot.sendMessage(
      chatId,
      '📦 *Создание кейса*\n\n' +
      'Отправьте данные в формате:\n' +
      '```\n' +
      '/newcase\n' +
      'Название: Лунный кейс\n' +
      'Цена: 100\n' +
      'Редкость: rare\n' +
      'URL изображения: https://example.com/image.png\n' +
      '```\n\n' +
      'Редкость: free, common, rare, epic, limited',
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка создания кейса
  bot.onText(/\/newcase/, (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }

    const text = msg.text;
    const nameMatch = text.match(/Название:\s*(.+)/i);
    const priceMatch = text.match(/Цена:\s*(\d+)/i);
    const rarityMatch = text.match(/Редкость:\s*(\w+)/i);
    const imageMatch = text.match(/URL изображения:\s*(.+)/i);

    if (!nameMatch || !priceMatch || !rarityMatch) {
      return bot.sendMessage(chatId, '❌ Неверный формат. Проверьте данные.');
    }

    const name = nameMatch[1].trim();
    const price = parseInt(priceMatch[1]);
    const rarity = rarityMatch[1].toLowerCase();
    const imageUrl = imageMatch ? imageMatch[1].trim() : null;

    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const result = db.prepare(`
        INSERT INTO cases (slug, name_ru, price_coins, rarity, image_url, enabled)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(slug, name, price, rarity, imageUrl);

      bot.sendMessage(
        chatId,
        `✅ Кейс "${name}" успешно создан!\n\n` +
        `ID: ${result.lastInsertRowid}\n` +
        `Цена: ${price}⭐\n` +
        `Редкость: ${rarity}\n\n` +
        `Теперь добавьте предметы командой:\n` +
        `/additem ${result.lastInsertRowid}`
      );
    } catch (err) {
      bot.sendMessage(chatId, `❌ Ошибка создания кейса: ${err.message}`);
    }
  });

  // Команда добавления предмета в кейс
  bot.onText(/\/additem (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }

    const caseId = match[1];
    bot.sendMessage(
      chatId,
      `🎁 *Добавление предмета в кейс #${caseId}*\n\n` +
      'Отправьте данные в формате:\n' +
      '```\n' +
      `/item ${caseId}\n` +
      'Название: Алмаз\n' +
      'Сумма: 500\n' +
      'Шанс: 10\n' +
      'Редкость: rare\n' +
      'URL изображения: https://example.com/diamond.png\n' +
      '```',
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка добавления предмета
  bot.onText(/\/item (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(msg.from.id)) {
      return bot.sendMessage(chatId, '❌ У вас нет доступа к этой команде.');
    }

    const caseId = parseInt(match[1]);
    const text = msg.text;

    const nameMatch = text.match(/Название:\s*(.+)/i);
    const amountMatch = text.match(/Сумма:\s*(\d+)/i);
    const chanceMatch = text.match(/Шанс:\s*([\d.]+)/i);
    const rarityMatch = text.match(/Редкость:\s*(\w+)/i);
    const imageMatch = text.match(/URL изображения:\s*(.+)/i);

    if (!nameMatch || !amountMatch || !chanceMatch) {
      return bot.sendMessage(chatId, '❌ Неверный формат. Проверьте данные.');
    }

    const name = nameMatch[1].trim();
    const amount = parseInt(amountMatch[1]);
    const chance = parseFloat(chanceMatch[1]);
    const rarity = rarityMatch ? rarityMatch[1].toLowerCase() : 'common';
    const imageUrl = imageMatch ? imageMatch[1].trim() : null;

    try {
      db.prepare(`
        INSERT INTO case_items (case_id, label_ru, amount, chance, rarity, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(caseId, name, amount, chance, rarity, imageUrl);

      bot.sendMessage(
        chatId,
        `✅ Предмет "${name}" добавлен в кейс #${caseId}!\n\n` +
        `Сумма: ${amount}⭐\n` +
        `Шанс: ${chance}%\n` +
        `Редкость: ${rarity}`
      );
    } catch (err) {
      bot.sendMessage(chatId, `❌ Ошибка добавления предмета: ${err.message}`);
    }
  });

  console.log('[bot] Telegram bot started');
  return bot;
}
