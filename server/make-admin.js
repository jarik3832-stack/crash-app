import { addAdmin, upsertUser } from './src/db/index.js';

// Замени на свой telegram_id
const MY_TELEGRAM_ID = 7900687881;

// Создаём пользователя если его нет
upsertUser({
  telegram_id: MY_TELEGRAM_ID,
  username: 'admin',
  first_name: 'Admin',
  photo_url: null,
});

// Добавляем в админы
addAdmin(MY_TELEGRAM_ID);

console.log(`✅ User ${MY_TELEGRAM_ID} is now admin`);
