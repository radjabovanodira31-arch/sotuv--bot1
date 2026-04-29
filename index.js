require('dotenv').config();
const { Telegraf, session, Scenes, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

// 1. .env fayldan token va admin_chat_id ni yuklash
const token = process.env.BOT_TOKEN;
const adminId = process.env.ADMIN_CHAT_ID;

if (!token) throw new Error('"BOT_TOKEN" is required!');

// 2. Botni initsializatsiya qilish
const bot = new Telegraf(token);

// Debug: Railway'da rasmlar bor-yo'qligini tekshirish
const imagesDir = __dirname; // Rasmlar GitHubda asosiy papkada (root) joylashgan
console.log('🔍 Rasmlar papkasini tekshirmoqdamiz:', imagesDir);
const files = fs.readdirSync(imagesDir);
console.log('✅ Papkadagi fayllar:', files);

// 3. STATISTIKA - Nechta odam kirgani va buyurtmalar soni
let stats = {
    users: new Set(),
    ordersCount: 0
};

// 4. BUYURTMA SAHNASI (Order Scene)
// Foydalanuvchidan ma'lumotlarni bosqichma-bosqich so'rash uchun
const orderScene = new Scenes.WizardScene(
    'ORDER_SCENE',
    (ctx) => {
        // 1-qadam: Ismni so'rash
        ctx.reply("Ismingiz?");
        ctx.wizard.state.order = {}; // Buyurtma obyekti
        return ctx.wizard.next();
    },
    (ctx) => {
        // 2-qadam: Telefonni so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.name = ctx.message.text;
        ctx.reply("Telefo'n raqamingiz?");
        return ctx.wizard.next();
    },
    (ctx) => {
        // 3-qadam: Qaysi to'plam kerakligini so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.phone = ctx.message.text;
        ctx.reply(
            "Qaysi to'plam kerak?\n" +
            "1. Klara to'plami (160,000 ming so'm)\n" +
            "2. Alisa to'plami (170,000 ming so'm)\n" +
            "3. Zara to'plami (150,000 ming so'm)\n" +
            "4. Ella to'plami (150,000 ming so'm)\n" +
            "5. Ro'za to'plami (150,000 ming so'm)\n" +
            "6. Liza To'plami (350,000 ming so'm)"
        );
        return ctx.wizard.next();
    },
    (ctx) => {
        // 4-qadam: Qo'shimcha izohni so'rash
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.items = ctx.message.text;
        ctx.reply("Qo'shimcha izoh bormi?");
        return ctx.wizard.next();
    },
    async (ctx) => {
        // 5-qadam: Izohni qabul qilib, xabarni adminga jo'natish
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.note = ctx.message.text;
        
        const { name, phone, items, note } = ctx.wizard.state.order;

        // Foydalanuvchiga tasdiq xabari yuborish
        await ctx.reply("Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.", getMainKeyboard());
        
        // Adminga yuboriladigan xabar formati
        stats.ordersCount++;
        const adminMsg = `📦 <b>Yangi buyurtma qabul qilindi!</b>\n\n` +
            `👤 <b>Mijoz:</b> ${name}\n` +
            `📞 <b>Telefon:</b> ${phone}\n` +
            `🛍 <b>To'plam (Nima xohlaydi?):</b> ${items}\n` +
            `📝 <b>Izoh:</b> ${note}\n\n` +
            `🔗 <b>Username:</b> @${ctx.from.username || "Mavjud emas"}`;
        
        try {
            // Adminga xabarni yuborish
            await bot.telegram.sendMessage(adminId, adminMsg, { parse_mode: "HTML" });
        } catch (e) {
            console.error("Adminga xabar yuborishda xato:", e);
        }

        return ctx.scene.leave(); // Sahnani yakunlash
    }
);

// 5. ASOSIY MENYU TUGMALARI
function getMainKeyboard() {
    return Markup.keyboard([
        ['Bepul darslik', '6 xil qo\'g\'irchoq tikish to\'plamlarimiz bor'],
        ['Kerakli mahsulotlar', 'Savollar'],
        ['Buyurtma berish', 'Bog\'lanish']
    ]).resize();
}

// Stage-ni yaratish
const stage = new Scenes.Stage([orderScene]);

// Middleware-larni ishlatish
bot.use(session()); 
bot.use(stage.middleware()); 

// Foydalanuvchilar sonini hisoblash uchun middleware
bot.use((ctx, next) => {
    if (ctx.from) {
        stats.users.add(ctx.from.id);
    }
    return next();
});

// 6. START KOMANDASI
bot.start((ctx) => {
    ctx.reply(
        `Salom, ${ctx.from.first_name}! Bizning sotuv botimizga xush kelibsiz.`,
        getMainKeyboard()
    );
});

// 7. ADMIN KOMANDASI
// /admin yozganda bot statistikani adminga ko'rsatadi
bot.command('admin', (ctx) => {
    if (ctx.from.id.toString() === adminId.toString()) {
        ctx.reply(`📊 <b>Bot Statistikasi:</b>\n\n👥 Ishlatgan odamlar soni: ${stats.users.size} ta\n🛍 Qabul qilingan buyurtmalar: ${stats.ordersCount} ta`, { parse_mode: 'HTML' });
    } else {
        ctx.reply("Sizda admin huquqlari yo'q.");
    }
});

// 8. MENYU TUGMALARIGA JAVOBLAR

// Bepul darslik tugmasi
bot.hears('Bepul darslik', async (ctx) => {
    const text = "Salom! 7 yillik hunarmand master sifatida ,ijodkorlikka qiziqish bildirayotganligingizdan hursandman! Marhamat bepul darslikni oling.";
    
    // Faqat masterni surati (root papkada turgani uchun path.join o'zgardi)
    const photoPath = path.join(__dirname, 'photo_2026-04-21_18-12-25.png');

    try {
        if (fs.existsSync(photoPath)) {
            // Rasmni matn va tugma bilan birga yuborish
            await ctx.replyWithPhoto(
                { source: photoPath }, 
                {
                    caption: text,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Darslikni ko'rish", url: "https://t.me/master_tkaniart/543" }]
                        ]
                    }
                }
            );
        } else {
            // Rasm topilmasa faqat matnni yuborish
            await ctx.reply(text, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Darslikni ko'rish", url: "https://t.me/master_tkaniart/543" }]
                    ]
                }
            });
        }
    } catch (e) {
        console.error("Bepul darslik yuborishda xato:", e.message);
        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Darslikni ko'rish", url: "https://t.me/master_tkaniart/543" }]
                ]
            }
        });
    }
});

// To'plamlar tugmasi bosilganda narxlari, rasm va nomlari bilan chiqarish
bot.hears('6 xil qo\'g\'irchoq tikish to\'plamlarimiz bor', async (ctx) => {
    const dolls = [
        { name: "1. Klara to'plami", price: "160 000 ming so'm", filename: "klara_yangi.png" },
        { name: "2. Alisa to'plami", price: "170 000 ming so'm", filename: "alisa_doll_1776486122819.png" },
        { name: "3. Zara to'plami", price: "150 000 ming so'm", filename: "zara_doll_1776486339664.png" },
        { name: "4. Ella to'plami", price: "150 000 ming so'm", filename: "ella_doll_1776486360708.png" },
        { name: "5. Ro'za to'plami", price: "150 000 ming so'm", filename: "roza_doll_1776486425978.png" },
        { name: "6. Liza To'plami", price: "350 000 ming so'm", filename: "liza_doll_1776486509967.png" }
    ];

    await ctx.reply("Bizning 6 xil qo'g'irchoq tikish to'plamlarimiz qatoriga quyidagilar kiradi:");

    for (const doll of dolls) {
        const photoPath = path.join(__dirname, doll.filename); // 'images' papkasini olib tashladik
        try {
            if (fs.existsSync(photoPath)) {
                await ctx.replyWithPhoto(
                    { source: photoPath },
                    { caption: `🛍 <b>${doll.name}</b>\n💰 Narxi: ${doll.price}`, parse_mode: "HTML" }
                );
            } else {
                await ctx.reply(`🛍 <b>${doll.name}</b>\n💰 Narxi: ${doll.price}\n⚠️ (Rasm topilmadi)`, { parse_mode: "HTML" });
            }
        } catch (error) {
            console.error(`Rasm yuborishda xatolik (${doll.name}):`, error.message);
        }
    }
});

// Buyurtma berish tugmasi
bot.hears('Buyurtma berish', (ctx) => {
    ctx.scene.enter('ORDER_SCENE'); // Buyurtma bosqichlarini boshlaydi
});

// Bog'lanish tugmasi
bot.hears('Bog\'lanish', (ctx) => {
    ctx.reply(
        "📞 Biz bilan bog'lanish:\n\n" +
        "🔹 Telegram: @Nodira_Abdullaevna\n" +
        "🔹 Telefo'n: +998950589181\n" +
        "🕒 Ish vaqti: 09:00- 18:00"
    );
});

// Kerakli mahsulotlar tugmasi
bot.hears('Kerakli mahsulotlar', (ctx) => {
    ctx.reply("Qaysi bo'limdan mahsulot xarid qilmoqchisiz?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🧵 Matolar", callback_data: "cat_matolar" }, { text: "💇‍♀️ Sochlar", callback_data: "cat_sochlar" }],
                [{ text: "👟 Oyoq kiyimlar", callback_data: "cat_oyoq" }, { text: "🎀 Aksessuarlar", callback_data: "cat_aksessuar" }]
            ]
        }
    });
});

bot.action('cat_matolar', (ctx) => {
    const text = "🧵 <b>Matolar bo'limi:</b>\n\n" +
        "1. Kukolniy trikotaj (0,5 metr) - 35 000 so'm\n" +
        "2. Alisa uchun to'plam matolari + furnitura (2 talik) - 55 000 so'm\n" +
        "3. Klara uchun to'plam matosi + furnitura - 45 000 so'm\n" +
        "4. Zara uchun to'plam matosi + furnitura - 45 000 so'm\n" +
        "5. Ro'za uchun to'plam matosi + furnitura - 45 000 so'm\n" +
        "6. Ella uchun to'plam matosi + furnitura - 40 000 so'm";
    ctx.answerCbQuery();
    ctx.reply(text, { parse_mode: "HTML" });
});

bot.action('cat_sochlar', (ctx) => {
    const text = "💇‍♀️ <b>Sochlar bo'limi:</b>\n\n" +
        "1. To'q jigarrang soch (25 sm) - 23 000 so'm\n" +
        "2. Kashtan rangli soch (25 sm) - 23 000 so'm\n" +
        "3. Sariq soch (25 sm) - 23 000 so'm\n" +
        "4. To'q jigarrang soch (15 sm) - 18 000 so'm\n" +
        "5. Sariq soch (15 sm) - 18 000 so'm\n" +
        "6. To'q jigarrang soch (5 sm) - 12 000 so'm\n" +
        "7. To'q kashtan soch (5 sm) - 12 000 so'm\n" +
        "8. Pushti soch (25 sm) - 23 000 so'm\n" +
        "9. Siyohrang soch (25 sm) - 23 000 so'm\n" +
        "10. To'lqin kashtan soch (20 sm) - 25 000 so'm\n" +
        "11. To'lqin rusiy soch (15 sm) - 20 000 so'm\n" +
        "12. Lokon kashtan rang (15 sm) - 25 000 so'm";
    ctx.answerCbQuery();
    ctx.reply(text, { parse_mode: "HTML" });
});

bot.action('cat_oyoq', (ctx) => {
    const text = "👟 <b>Oyoq kiyimlar bo'limi:</b>\n\n" +
        "1. Och pushti keda (5 sm) - 20 000 so'm\n" +
        "2. To'q pushti keda - 20 000 so'm\n" +
        "3. Qora keda - 20 000 so'm\n" +
        "4. Havorang keda - 20 000 so'm\n" +
        "5. Siyohrang keda - 20 000 so'm\n" +
        "6. Sandal (5,5 sm, pushti) - 25 000 so'm";
    ctx.answerCbQuery();
    ctx.reply(text, { parse_mode: "HTML" });
});

bot.action('cat_aksessuar', (ctx) => {
    const text = "🎀 <b>Aksessuarlar bo'limi:</b>\n\n" +
        "1. Tugmacha (18 mmli) - 300 so'm\n" +
        "2. Tugmacha (12 mmli) - 200 so'm\n" +
        "3. Remen regulyator - 1 000 so'm\n" +
        "4. Qora ko'z (8 mmli, 1 pachka) - 6 000 so'm\n" +
        "5. Qora ko'z (4 mmli, 1 pachka) - 5 000 so'm\n" +
        "6. Kipriklar (8 mmli) - 13 000 so'm\n" +
        "7. Metall knopka (sumka uchun) - 1 000 so'm\n" +
        "8. Termonakleyka (12x12 sm) - 12 000 so'm\n" +
        "9. Yuz termonakleykasi (donasi) - 3 000 so'm\n" +
        "10. Kiprikli yuz - 3 000 so'm\n" +
        "11. Jung igna (9 sm) - 1 500 so'm\n" +
        "12. Oq jung (50 gr) - 35 000 so'm\n" +
        "13. Dermantin (30x30 sm, havorang+pushti 2 ta) - 18 000 so'm\n" +
        "14. Zanjir (3 mmli, 1 metr) - 4 000 so'm\n" +
        "15. Metal knopka (sarafan uchun, 1 jufti) - 4 000 so'm\n" +
        "16. Oq quyoncha (6 sm) - 9 000 so'm\n" +
        "17. Xalqa (6 mmli, 1 pachka) - 9 000 so'm";
    ctx.answerCbQuery();
    ctx.reply(text, { parse_mode: "HTML" });
});

// Savollar tugmasi (FAQ)
bot.hears('Savollar', (ctx) => {
    ctx.reply(
        "❓ <b>Ko'p beriladigan savollar:</b>\n\n" +
        "💬 <i>- Video darsliklar qanday formatda bo'ladi?</i>\n" +
        "✅ - Onlayn formatda\n\n" +
        "💬 <i>- Qanday uslubda olish mumkin?</i>\n" +
        "✅ - Toshkent bo'ylab Yandex orqali\n" +
        "  - Viloyatlar bo'ylab 1 kundan 3 kungacha BTS pochta orqali.\n\n" +
        "💬 <i>- To'lov usuli?</i>\n" +
        "✅ - Karta orqali oldindan to'lov.",
        { parse_mode: 'HTML' }
    );
});

// Kutilmagan xatoliklarni ushlash
bot.catch((err, ctx) => {
    console.error(`Xatolik yuz berdi ctx: ${ctx.updateType}`, err.message);
});

// 9. BOTNI ISHGA TUSHIRISH
bot.launch()
    .then(() => console.log('✅ Sotuv bot muvaffaqiyatli ishga tushdi.'))
    .catch(err => console.error("❌ Bot ishga tushishida xatolik:", err.message));

// Dastur to'g'ri yopilishi uchun (Graceful stop)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
