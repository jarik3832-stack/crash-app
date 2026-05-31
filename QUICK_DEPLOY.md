# 🚀 Автоматический деплой за 5 минут

## Что делает скрипт:

✅ Устанавливает Node.js, PM2, Nginx
✅ Клонирует и настраивает проект
✅ Создает базу данных и папки для данных
✅ Запускает приложение
✅ Настраивает автозапуск и бэкапы
✅ Настраивает Nginx и файрвол

## Инструкция:

### Шаг 1: Создай VPS на Timeweb Cloud

1. Зарегистрируйся на https://timeweb.cloud
2. Создай VPS:
   - ОС: **Ubuntu 22.04 LTS**
   - Тариф: **START** (169₽/мес)
   - Регион: Москва
3. Запиши **IP адрес** и **пароль root**

### Шаг 2: Подключись к серверу

**Windows (PowerShell):**
```powershell
ssh root@ВАШ_IP_АДРЕС
```

**Mac/Linux:**
```bash
ssh root@ВАШ_IP_АДРЕС
```

Введи пароль root.

### Шаг 3: Запусти скрипт

Скопируй и вставь эти команды:

```bash
# Скачать скрипт
curl -o deploy.sh https://raw.githubusercontent.com/jarik3832-stack/crash-app/master/deploy.sh

# Сделать исполняемым
chmod +x deploy.sh

# Запустить
bash deploy.sh
```

### Шаг 4: Введи данные

Скрипт попросит ввести:

1. **Telegram Bot Token** - получи у @BotFather
2. **Твой Telegram ID** - узнай командой `/myid` у бота
3. **Crypto Pay Token** - получи у @CryptoBot (можно оставить пустым)
4. **Домен** - если есть (можно оставить пустым)

### Шаг 5: Готово! 🎉

Через 5-10 минут приложение будет работать!

## Настройка Telegram Mini App:

1. Открой @BotFather в Telegram
2. Отправь `/mybots`
3. Выбери своего бота
4. **Bot Settings** → **Menu Button** → **Configure Menu Button**
5. Введи URL: `http://ВАШ_IP_АДРЕС`
6. Введи текст кнопки: **Открыть игру**

## Полезные команды:

```bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs crash-app

# Перезапуск приложения
pm2 restart crash-app

# Обновление приложения (после git push)
/root/update.sh

# Ручной бэкап
/root/backup.sh
```

## Что сохраняется:

✅ База данных SQLite
✅ Все пользователи и их балансы
✅ Загруженные изображения кейсов
✅ Настройки игры

## Автоматические бэкапы:

- Создаются каждый день в 3:00
- Хранятся 7 дней
- Находятся в `/root/backups/`

## Стоимость:

💰 **169₽/месяц** - VPS START на Timeweb Cloud

## Если что-то пошло не так:

```bash
# Проверить логи
pm2 logs crash-app --lines 50

# Проверить статус Nginx
systemctl status nginx

# Проверить порты
netstat -tulpn | grep 3001

# Перезапустить всё
pm2 restart crash-app
systemctl restart nginx
```

## Обновление приложения:

После того как ты сделал `git push` на GitHub:

```bash
ssh root@ВАШ_IP_АДРЕС
/root/update.sh
```

Готово! Приложение обновлено.
