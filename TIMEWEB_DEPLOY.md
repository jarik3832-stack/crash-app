# Деплой на Timeweb Cloud

## Шаг 1: Регистрация и создание сервера

1. **Зарегистрируйся на Timeweb Cloud:**
   - Перейди на https://timeweb.cloud
   - Нажми "Регистрация"
   - Заполни данные

2. **Создай VPS сервер:**
   - В панели управления нажми "Создать сервер"
   - Выбери:
     - **ОС**: Ubuntu 22.04 LTS
     - **Тариф**: START (1 CPU, 1GB RAM, 10GB SSD) - 169₽/мес
     - **Регион**: Москва
   - Нажми "Создать"
   - Запиши IP адрес сервера и пароль root

## Шаг 2: Подключение к серверу

### Windows (PowerShell):
```powershell
ssh root@ВАШ_IP_АДРЕС
```

### Mac/Linux:
```bash
ssh root@ВАШ_IP_АДРЕС
```

Введи пароль, который получил при создании сервера.

## Шаг 3: Установка необходимого ПО

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Установка Git
apt install -y git

# Установка PM2 (для запуска приложения)
npm install -g pm2

# Установка Nginx (для проксирования)
apt install -y nginx

# Проверка установки
node -v
npm -v
git --version
```

## Шаг 4: Клонирование проекта

```bash
# Переход в домашнюю директорию
cd /root

# Клонирование репозитория
git clone https://github.com/jarik3832-stack/crash-app.git
cd crash-app

# Установка зависимостей сервера
cd server
npm install

# Установка зависимостей клиента
cd ../client
npm install

# Сборка клиента
npm run build

# Возврат в корень проекта
cd ..
```

## Шаг 5: Настройка переменных окружения

```bash
# Создание .env файла
cd /root/crash-app/server
nano .env
```

Вставь следующее содержимое (замени значения на свои):

```env
TELEGRAM_BOT_TOKEN=8964654544:AAHjzfbd2O1xC1xL1J238D1tUtpiBG58jqY
ADMIN_TELEGRAM_ID=ТВОЙ_TELEGRAM_ID
ALLOW_DEV_AUTH=0
JWT_SECRET=твой-секретный-ключ-минимум-32-символа
CRYPTO_PAY_TOKEN=588971:AA5N3DQTjBh0XPhoiX3elxAfCweaOhVUuO3
PORT=3001
DATA_DIR=/root/crash-app/server/data
```

Сохрани: `Ctrl+X`, затем `Y`, затем `Enter`

## Шаг 6: Создание папки для данных

```bash
mkdir -p /root/crash-app/server/data
mkdir -p /root/crash-app/server/data/uploads
```

## Шаг 7: Запуск приложения с PM2

```bash
cd /root/crash-app/server

# Запуск приложения
pm2 start src/index.js --name crash-app

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Проверка статуса
pm2 status
pm2 logs crash-app
```

## Шаг 8: Настройка Nginx

```bash
# Создание конфигурации Nginx
nano /etc/nginx/sites-available/crash-app
```

Вставь следующее:

```nginx
server {
    listen 80;
    server_name ВАШ_IP_АДРЕС;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Сохрани и активируй конфигурацию:

```bash
# Создание символической ссылки
ln -s /etc/nginx/sites-available/crash-app /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t

# Перезапуск Nginx
systemctl restart nginx
```

## Шаг 9: Настройка домена (опционально)

Если у тебя есть домен:

1. В DNS настройках домена добавь A-запись:
   - Тип: A
   - Имя: @
   - Значение: IP_АДРЕС_СЕРВЕРА

2. Измени `server_name` в Nginx:
   ```bash
   nano /etc/nginx/sites-available/crash-app
   ```
   Замени `ВАШ_IP_АДРЕС` на `ваш-домен.ru`

3. Установи SSL сертификат (бесплатный):
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d ваш-домен.ru
   ```

## Шаг 10: Настройка Telegram Mini App

1. Открой @BotFather в Telegram
2. Отправь `/mybots`
3. Выбери своего бота
4. Нажми "Bot Settings" → "Menu Button"
5. Выбери "Configure Menu Button"
6. Введи URL: `http://ВАШ_IP_АДРЕС` (или `https://ваш-домен.ru`)
7. Введи текст кнопки: "Открыть игру"

## Полезные команды PM2:

```bash
# Просмотр логов
pm2 logs crash-app

# Перезапуск приложения
pm2 restart crash-app

# Остановка приложения
pm2 stop crash-app

# Удаление приложения из PM2
pm2 delete crash-app

# Просмотр статуса
pm2 status

# Мониторинг в реальном времени
pm2 monit
```

## Обновление приложения:

```bash
cd /root/crash-app

# Получение последних изменений
git pull origin master

# Обновление зависимостей сервера
cd server
npm install

# Обновление и сборка клиента
cd ../client
npm install
npm run build

# Перезапуск приложения
pm2 restart crash-app
```

## Резервное копирование данных:

```bash
# Создание бэкапа базы данных
cp /root/crash-app/server/data/crash.db /root/backup-$(date +%Y%m%d).db

# Создание бэкапа изображений
tar -czf /root/uploads-backup-$(date +%Y%m%d).tar.gz /root/crash-app/server/data/uploads
```

## Автоматический бэкап (опционально):

```bash
# Создание скрипта бэкапа
nano /root/backup.sh
```

Вставь:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Бэкап базы данных
cp /root/crash-app/server/data/crash.db $BACKUP_DIR/crash-$DATE.db

# Бэкап изображений
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /root/crash-app/server/data/uploads

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Сделай исполняемым и добавь в cron:

```bash
chmod +x /root/backup.sh

# Добавление в cron (каждый день в 3:00)
crontab -e
```

Добавь строку:
```
0 3 * * * /root/backup.sh >> /root/backup.log 2>&1
```

## Мониторинг и безопасность:

```bash
# Установка файрвола
apt install -y ufw

# Разрешение SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443

# Включение файрвола
ufw enable

# Проверка статуса
ufw status
```

## Решение проблем:

### Приложение не запускается:
```bash
pm2 logs crash-app --lines 100
```

### Проверка портов:
```bash
netstat -tulpn | grep 3001
```

### Перезапуск всех сервисов:
```bash
pm2 restart all
systemctl restart nginx
```

## Стоимость:

- **VPS START**: 169₽/месяц
- **Домен .ru**: ~200₽/год (опционально)
- **SSL сертификат**: бесплатно (Let's Encrypt)

**Итого**: ~169₽/месяц

## Преимущества:

✅ Данные сохраняются всегда (не удаляются при перезапуске)
✅ Полный контроль над сервером
✅ Можно масштабировать (увеличить ресурсы)
✅ Оплата в рублях
✅ Российские карты работают
✅ Техподдержка на русском языке
