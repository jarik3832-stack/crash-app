# Настройка Persistent Disk на Render

Чтобы данные сохранялись при деплое, нужно настроить постоянное хранилище на Render.

## Шаги настройки:

1. **Зайди на Render Dashboard:**
   - Открой https://dashboard.render.com
   - Выбери свой сервис `crash-app`

2. **Создай Persistent Disk:**
   - Перейди в раздел **Disks** (слева в меню)
   - Нажми **New Disk**
   - Настройки:
     - Name: `crash-app-data`
     - Size: `1 GB` (можно больше если нужно)
     - Mount Path: `/opt/render/project/src/server/data`
   - Нажми **Create Disk**

3. **Подключи диск к сервису:**
   - Вернись к своему сервису
   - Перейди в **Settings**
   - Найди раздел **Disks**
   - Нажми **Add Disk**
   - Выбери созданный диск `crash-app-data`
   - Mount Path: `/opt/render/project/src/server/data`
   - Нажми **Save**

4. **Перезапусти сервис:**
   - Нажми **Manual Deploy** → **Deploy latest commit**

## Что это даёт:

✅ База данных SQLite сохраняется между деплоями
✅ Все пользователи, ставки, кейсы остаются
✅ Загруженные изображения сохраняются
✅ Настройки игры не сбрасываются

## Важно:

- Persistent Disk стоит $0.25/GB в месяц
- Данные сохраняются даже при удалении и пересоздании сервиса
- Backup делается автоматически Render

## Альтернатива (PostgreSQL):

Если хочешь использовать PostgreSQL вместо SQLite:
1. Создай PostgreSQL базу на Render
2. Установи `pg` пакет: `npm install pg`
3. Измени код для работы с PostgreSQL

Но для твоего проекта SQLite + Persistent Disk - оптимальное решение.
