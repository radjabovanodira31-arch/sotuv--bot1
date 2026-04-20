require('dotenv').config();
const { Telegraf, session, Scenes, Markup } = require('telegraf');

// 1. .env fayldan token va admin_chat_id ni yuklash
const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_CHAT_ID;

if (!token) throw new Error('"BOT_TOKEN" is required!');

// Botni initsializatsiya qilish
const bot = new Telegraf(token);

// --- STATISTIKA (Xotirada saqlash) ---
// Eslatma: Dastur yopilsa bu ma'lumotlar o'chadi. Kelajakda faylga saqlasa bo'ladi.
let stats = {
    users: new Set(),
    ordersCount: 0
};

// --- BUYURTMA SAHNASI (Scene) ---
// Har qadamda navbatma navbat so'raydigan Scene (Sahnani) yaratamiz
const orderScene = new Scenes.WizardScene(
    'ORDER_SCENE',
    (ctx) => {
        // 1-qadam: Ismni so'rash
        ctx.reply("Ismingiz?");
        ctx.wizard.state.order = {}; // Buyurtma ma'lumotlarini saqlash uchun maxsus obyekt ochamiz
        return ctx.wizard.next(); // Keyingi qadamga o'tish
    },
    (ctx) => {
        // 2-qadam: Ismni qabul qilib telefonni so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.name = ctx.message.text;
        ctx.reply("Telefo'n raqamingiz?");
        return ctx.wizard.next();
    },
    (ctx) => {
        // 3-qadam: Telefonni qabul qilib to'plamni so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.phone = ctx.message.text;
        ctx.reply(
            "Qaysi to'plam kerak?\n" +
            "1. Klara to'plami (210,000 so'm)\n" +
            "2. Alisa to'plami (230,000 so'm)\n" +
            "3. Zara to'plami (210,000 so'm)\n" +
            "4. Ella to'plami (200,000 so'm)\n" +
            "5. Ro'za to'plami (210,000 so'm)\n" +
            "6. Liza To'plami (500,000 so'm)"
        );
        return ctx.wizard.next();
    },
    (ctx) => {
        // 4-qadam: To'plamni qabul qilib izohni so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.items = ctx.message.text;
        ctx.reply("Qo'shimcha izoh bormi?");
        return ctx.wizard.next();
    },
    async (ctx) => {
        // 5-qadam: Izohni qabul qilib, adminga yuborish
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.note = ctx.message.text;
        
        const { name, phone, items, note } = ctx.wizard.state.order;

        // Foydalanuvchiga tasdiq xabari yuborish
        await ctx.reply("Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.", getMainKeyboard());
        
        // Adminga xabar formatlash
        stats.ordersCount++;
        const adminMsg = `📦 <b>Yangi buyurtma qabul qilindi!</b>\n\n` +
            `👤 <b>Mijoz:</b> ${name}\n` +
            `📞 <b>Telefon:</b> ${phone}\n` +
            `🛍 <b>To'plam:</b> ${items}\n` +
            `📝 <b>Izoh:</b> ${note}\n\n` +
            `🔗 <b>Username:</b> @${ctx.from.username || "Mavjud emas"}`;
        
        try {
            // Sizga (adminga) xabar ketadi
            await bot.telegram.sendMessage(adminId, adminMsg, { parse_mode: "HTML" });
        } catch (e) {
            console.error("Adminga xabar yuborishda xato:", e);
        }

        return ctx.scene.leave(); // Sahnadan (Scene'dan) chiqish
    }
);

// --- ASOSIY MENYU ---
function getMainKeyboard() {
    return Markup.keyboard([
        ['6 xil qo\'g\'irchoq tikish to\'plamlarimiz bor', 'Buyurtma berish'],
        ['Bog\'lanish', 'Savollar']
    ]).resize();
}

// Stage-ni (sahnani) ro'yxatdan o'tkazish
const stage = new Scenes.Stage([orderScene]);

// Middleware-lar
bot.use(session()); // Sessiyalar ishlashi uchun
bot.use(stage.middleware()); // Sahnalar ishlashi uchun

// Statistikani hisoblash (middleware)
bot.use((ctx, next) => {
    if (ctx.from) {
        stats.users.add(ctx.from.id); // Takrorlanmas tarzda id larni saqlaydi
    }
    return next();
});

// --- KOMANDALAR VA TUGMALAR ---

// /start komandasida xush kelibsiz xabari va menyu
bot.start((ctx) => {
    ctx.reply(
        `Salom, ${ctx.from.first_name}! Bizning sotuv botimizga xush kelibsiz. Quyidagi menyudan kerakli bo'limni tanlang:`,
        getMainKeyboard()
    );
});

// /admin komandasi
bot.command('admin', (ctx) => {
    // Faqat admin ishlata oladi yoki hamma? Shartga ko'ra adminga dedingiz.
    // Men sizning ID ni tekshiryapman
    if (ctx.from.id.toString() === adminId.toString()) {
        ctx.reply(`📊 <b>Bot Statistikasi:</b>\n\n👥 Barcha mijozlar: ${stats.users.size} ta\n🛍 Qabul qilingan buyurtmalar: ${stats.ordersCount} ta`, { parse_mode: 'HTML' });
    } else {
        ctx.reply("Sizda admin huquqlari yo'q.");
    }
});

// To'plamlar tugmasi bosilganda
bot.hears('6 xil qo\'g\'irchoq tikish to\'plamlarimiz bor', async (ctx) => {
    // Mijozga xabar yuborish
    await ctx.reply("6 xil qo'g'irchoq tikish to'plamlarimiz bor.");

    const path = require('path');
    // Qo'g'irchoqlar ma'lumoti
    const dolls = [
        { name: "1. Klara to'plami", price: "210 000 so'm", filename: "klara_doll_1776486339664.png" },   
        { name: "2. Alisa to'plami", price: "230 000 so'm", filename: "alisa_doll_1776486122819.png" },
        { name: "3. Zara to'plami", price: "210 000 so'm", filename: "zara_doll_1776486339664.png" },
        { name: "4. Ella to'plami", price: "200 000 so'm", filename: "ella_doll_1776486360708.png" },
        { name: "5. Ro'za to'plami", price: "210 000 so'm", filename: "roza_doll_1776486425978.png" },
        { name: "6. Liza To'plami", price: "500 000 so'm", filename: "liza_doll_1776486509967.png" }
    ];

    for (const doll of dolls) {
        try {
            await ctx.replyWithPhoto(
                { source: path.join(__dirname, 'images', doll.filename) },
                { caption: `🛍 <b>${doll.name}</b>\n💰 Narxi: ${doll.price}`, parse_mode: "HTML" }
            );
        } catch (error) {
            console.error(`Rasm yuborishda xatolik (${doll.name}):`, error);
        }
    }
});

// Buyurtma berish tugmasi
bot.hears('Buyurtma berish', (ctx) => {
    // Buyurtma sahnasini boshlash
    ctx.scene.enter('ORDER_SCENE');
});

// Bog'lanish tugmasi
bot.hears('Bog\'lanish', (ctx) => {
    ctx.reply(
        "📞 Bizning kontaktlar:\n\n" +
        "🔹 Telegram: @username\n" + // @username larni o'zingiz tahrirlab olasiz
        "🔹 Telefon: +99890123456\n" +
        "🕒 Ish vaqti: 09:00- 18:00"
    );
});

// Savollar tugmasi
bot.hears('Savollar', (ctx) => {
    ctx.reply(
        "Ko'p beriladigan savollar:\n" +
        "- \"Qanday uslubda olish mumkin?\"\n" +
        "- \"Toshkent bo'ylab Yandex, Viloyatlar bo'ylab 1 kundan 3 kungacha BTS pochta orqali.\"\n" +
        "- \"To'lov usuli?\"\n" +
        "- \"Karta orqali oldindan to'lov\"."
    );
});

// Kutilmagan xatoliklarni ushlash
bot.catch((err, ctx) => {
    console.error(`Xatolik yuz berdi ctx: ${ctx.updateType}`, err);
});

// Botni ishga tushirish (Polling metodi orqali)
bot.launch()
    .then(() => console.log('✅ Sotuv bot muvaffaqiyatli ishga tushdi.'))
    .catch(err => console.error("❌ Bot ishga tushishida xatolik:", err));

// Dastur to'xtatilishini nazorat qilish (To'g'ri o'chishi uchun)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
