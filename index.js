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
const imagesDir = path.join(__dirname, 'images');
console.log('🔍 Rasmlar papkasini tekshirmoqdamiz:', imagesDir);
if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    console.log('✅ Rasmlar papkasi topildi. Fayllar:', files);
} else {
    console.error('❌ XORAZM! "images" papkasi topilmadi! GitHubga rasm papkasini ham push qilganingizga ishonch hosil qiling.');
}

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
            "1. Klara to'plami (210,000 ming so'm)\n" +
            "2. Alisa to'plami (230,000 ming so'm)\n" +
            "3. Zara to'plami (210,000 ming so'm)\n" +
            "4. Ella to'plami (200,000 ming so'm)\n" +
            "5. Ro'za to'plami (210,000 ming so'm)\n" +
            "6. Liza To'plami (500,000 ming so'm)"
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
    
    // Yuborilishi kerak bo'lgan rasmlar ro'yxati
    const photoFiles = [
        'photo_2026-04-21_18-12-25.png', // Master Nodira Abdullaevna
        'klara_doll.png',
        'alisa_doll_1776486122819.png',
        'zara_doll_1776486339664.png',
        'ella_doll_1776486360708.png',
        'roza_doll_1776486425978.png',
        'liza_doll_1776486509967.png'
    ];

    const mediaGroup = [];

    for (const file of photoFiles) {
        const photoPath = path.join(__dirname, 'images', file);
        if (fs.existsSync(photoPath)) {
            mediaGroup.push({
                type: 'photo',
                media: { source: photoPath }
            });
        } else {
            console.warn(`⚠️ Rasm topilmadi: ${file}`);
        }
    }

    try {
        if (mediaGroup.length > 0) {
            // Rasmlarni album (media group) ko'rinishida yuborish
            await ctx.replyWithMediaGroup(mediaGroup);
        }
        
        // Matn va tugmani yuborish
        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Darslikni ko'rish", url: "https://t.me/master_tkaniart/543" }]
                ]
            }
        });
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
        { name: "1. Klara to'plami", price: "210 000 ming so'm", filename: "klara_doll.png" },
        { name: "2. Alisa to'plami", price: "230 000 ming so'm", filename: "alisa_doll_1776486122819.png" },
        { name: "3. Zara to'plami", price: "210 000 ming so'm", filename: "zara_doll_1776486339664.png" },
        { name: "4. Ella to'plami", price: "200 000 ming so'm", filename: "ella_doll_1776486360708.png" },
        { name: "5. Ro'za to'plami", price: "210 000 ming so'm", filename: "roza_doll_1776486425978.png" },
        { name: "6. Liza To'plami", price: "500 000 ming so'm", filename: "liza_doll_1776486509967.png" }
    ];

    await ctx.reply("Bizning 6 xil qo'g'irchoq tikish to'plamlarimiz qatoriga quyidagilar kiradi:");

    for (const doll of dolls) {
        const photoPath = path.join(__dirname, 'images', doll.filename);
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

// Kerakli mahsulotlar tugmasi (Web sayt linki)
bot.hears('Kerakli mahsulotlar', (ctx) => {
    ctx.reply("Do'konimizga tashrif buyurishingiz mumkin:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🖥 Web saytga kirish", url: "http://mahinadolls.uz" }]
            ]
        }
    });
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
