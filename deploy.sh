#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Crash App Auto Deploy Script${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Ошибка: Запустите скрипт от root${NC}"
  echo "Используйте: sudo bash deploy.sh"
  exit 1
fi

# Запрос данных у пользователя
echo -e "${YELLOW}Введите данные для настройки:${NC}"
echo ""

read -p "Telegram Bot Token (от @BotFather): " BOT_TOKEN
read -p "Ваш Telegram ID (узнать через /myid у бота): " ADMIN_ID
read -p "Crypto Pay Token (от @CryptoBot, можно оставить пустым): " CRYPTO_TOKEN
read -p "Ваш домен (или оставьте пустым для использования IP): " DOMAIN

# Генерация JWT секрета
JWT_SECRET=$(openssl rand -base64 32)

echo ""
echo -e "${GREEN}Начинаю установку...${NC}"
echo ""

# Обновление системы
echo -e "${YELLOW}[1/10] Обновление системы...${NC}"
apt update -qq && apt upgrade -y -qq

# Установка Node.js 20
echo -e "${YELLOW}[2/10] Установка Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y nodejs -qq

# Установка Git
echo -e "${YELLOW}[3/10] Установка Git...${NC}"
apt install -y git -qq

# Установка PM2
echo -e "${YELLOW}[4/10] Установка PM2...${NC}"
npm install -g pm2 > /dev/null 2>&1

# Установка Nginx
echo -e "${YELLOW}[5/10] Установка Nginx...${NC}"
apt install -y nginx -qq

# Клонирование проекта
echo -e "${YELLOW}[6/10] Клонирование проекта...${NC}"
cd /root
if [ -d "crash-app" ]; then
  echo "Папка crash-app уже существует, удаляю..."
  rm -rf crash-app
fi
git clone https://github.com/jarik3832-stack/crash-app.git > /dev/null 2>&1

# Установка зависимостей
echo -e "${YELLOW}[7/10] Установка зависимостей...${NC}"
cd /root/crash-app/server
npm install > /dev/null 2>&1

cd /root/crash-app/client
npm install > /dev/null 2>&1
npm run build > /dev/null 2>&1

# Создание .env файла
echo -e "${YELLOW}[8/10] Создание конфигурации...${NC}"
cd /root/crash-app/server
cat > .env << EOF
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
ADMIN_TELEGRAM_ID=${ADMIN_ID}
ALLOW_DEV_AUTH=0
JWT_SECRET=${JWT_SECRET}
CRYPTO_PAY_TOKEN=${CRYPTO_TOKEN}
PORT=3001
DATA_DIR=/root/crash-app/server/data
CORS_ORIGINS=http://localhost:5173
EOF

# Создание папок для данных
mkdir -p /root/crash-app/server/data
mkdir -p /root/crash-app/server/data/uploads

# Запуск приложения с PM2
echo -e "${YELLOW}[9/10] Запуск приложения...${NC}"
cd /root/crash-app/server
pm2 delete crash-app > /dev/null 2>&1
pm2 start src/index.js --name crash-app > /dev/null 2>&1
pm2 startup > /dev/null 2>&1
pm2 save > /dev/null 2>&1

# Настройка Nginx
echo -e "${YELLOW}[10/10] Настройка Nginx...${NC}"

# Определение server_name
if [ -z "$DOMAIN" ]; then
  SERVER_NAME=$(curl -s ifconfig.me)
else
  SERVER_NAME=$DOMAIN
fi

# Создание конфигурации Nginx
cat > /etc/nginx/sites-available/crash-app << 'NGINXCONF'
server {
    listen 80;
    server_name SERVER_NAME_PLACEHOLDER;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        alias /root/crash-app/server/data/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

# Замена placeholder на реальный server_name
sed -i "s/SERVER_NAME_PLACEHOLDER/$SERVER_NAME/g" /etc/nginx/sites-available/crash-app

# Активация конфигурации
ln -sf /etc/nginx/sites-available/crash-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка и перезапуск Nginx
nginx -t > /dev/null 2>&1
if [ $? -eq 0 ]; then
  systemctl restart nginx
else
  echo -e "${RED}Ошибка в конфигурации Nginx${NC}"
  nginx -t
fi

# Настройка файрвола
echo -e "${YELLOW}Настройка файрвола...${NC}"
ufw --force enable > /dev/null 2>&1
ufw allow 22 > /dev/null 2>&1
ufw allow 80 > /dev/null 2>&1
ufw allow 443 > /dev/null 2>&1

# Создание скрипта бэкапа
cat > /root/backup.sh << 'BACKUPSCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Бэкап базы данных
cp /root/crash-app/server/data/crash.db $BACKUP_DIR/crash-$DATE.db

# Бэкап изображений
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /root/crash-app/server/data/uploads 2>/dev/null

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
BACKUPSCRIPT

chmod +x /root/backup.sh

# Добавление бэкапа в cron (каждый день в 3:00)
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup.sh >> /root/backup.log 2>&1") | crontab -

# Создание скрипта обновления
cat > /root/update.sh << 'UPDATESCRIPT'
#!/bin/bash
echo "Обновление приложения..."
cd /root/crash-app
git pull origin master
cd server
npm install
cd ../client
npm install
npm run build
pm2 restart crash-app
echo "Обновление завершено!"
UPDATESCRIPT

chmod +x /root/update.sh

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  Установка завершена! ✅${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Информация о сервере:${NC}"
echo -e "URL приложения: ${GREEN}http://$SERVER_NAME${NC}"
echo -e "Telegram Bot Token: ${GREEN}$BOT_TOKEN${NC}"
echo -e "Admin Telegram ID: ${GREEN}$ADMIN_ID${NC}"
echo ""
echo -e "${YELLOW}Полезные команды:${NC}"
echo -e "  ${GREEN}pm2 status${NC}          - статус приложения"
echo -e "  ${GREEN}pm2 logs crash-app${NC}  - логи приложения"
echo -e "  ${GREEN}pm2 restart crash-app${NC} - перезапуск"
echo -e "  ${GREEN}/root/update.sh${NC}     - обновление приложения"
echo -e "  ${GREEN}/root/backup.sh${NC}     - ручной бэкап"
echo ""
echo -e "${YELLOW}Настройка Telegram Mini App:${NC}"
echo "1. Открой @BotFather в Telegram"
echo "2. Отправь /mybots"
echo "3. Выбери своего бота"
echo "4. Bot Settings → Menu Button → Configure Menu Button"
echo -e "5. Введи URL: ${GREEN}http://$SERVER_NAME${NC}"
echo "6. Введи текст: Открыть игру"
echo ""

# Установка SSL если указан домен
if [ ! -z "$DOMAIN" ]; then
  echo -e "${YELLOW}Хотите установить SSL сертификат? (y/n)${NC}"
  read -p "> " INSTALL_SSL

  if [ "$INSTALL_SSL" = "y" ] || [ "$INSTALL_SSL" = "Y" ]; then
    echo -e "${YELLOW}Установка SSL сертификата...${NC}"
    apt install -y certbot python3-certbot-nginx -qq
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}SSL сертификат установлен! ✅${NC}"
      echo -e "URL приложения: ${GREEN}https://$DOMAIN${NC}"
    else
      echo -e "${RED}Ошибка установки SSL. Проверьте, что домен указывает на этот сервер.${NC}"
    fi
  fi
fi

echo ""
echo -e "${GREEN}Готово! Приложение работает на http://$SERVER_NAME${NC}"
echo ""
