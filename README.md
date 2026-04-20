# Sotuv ManegerBot

Ushbu bot Telegram yordamida buyurtmalar qabul qilish va mahsulotlar to'g'risida ma'lumot berish uchun ishlatiladi.

## Qanday ishga tushirish kerak?

1. Node.js o'rnatilganligiga ishonch hosil qiling.
2. Terminalni oching va ushbu papkaga kiring:
   ```bash
   cd "c:\sotuv bot"
   ```
3. Kutubxonalarni o'rnating:
   ```bash
   npm install
   ```
4. `.env` faylida `BOT_TOKEN` va `ADMIN_CHAT_ID` ma'lumotlari to'g'riligini tekshiring. (Men ularni albatta joylashtirib qo'ydim, agar o'zgarsa shu yerdan o'zgartirasiz).
5. Botni ishga tushiring:
   ```bash
   node index.js
   ```

## Qanday ishlaydi
- Foydalanuvchi `/start` bosadi va menyuni ko'radi.
- **To'plamlar**: Qo'g'irchoqlar (nomlari va narxlari) ko'rish mumkin. Rasm qo'shish xohlasangiz `index.js` da kodda tushuntirish qoldirilgan.
- **Buyurtma berish**: Menyusi orqali savollar ketma-ketligi so'raladi (Teginilmasin Telegraf Scenes yordamida ishlangan). Barcha ma'lumot qabul qilinib admin (sizga) xabar sifatida yuboriladi.
- Admin uchun statistika botni qayta ishga tushirganda noldan boshlanadi (`/admin` buyrug'i). 
