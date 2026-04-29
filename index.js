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

// MAHSULOTLAR BAZASI
const productsData = {
    cat_toplam: [
        { id: "t1", name: "1. Klara to'plami", price: 160000, image: "klara_doll.png" },
        { id: "t2", name: "2. Alisa to'plami", price: 170000, image: "alisa_doll_1776486122819.png" },
        { id: "t3", name: "3. Zara to'plami", price: 150000, image: "zara_doll_1776486339664.png" },
        { id: "t4", name: "4. Ella to'plami", price: 150000, image: "ella_doll_1776486360708.png" },
        { id: "t5", name: "5. Ro'za to'plami", price: 150000, image: "roza_doll_1776486425978.png" },
        { id: "t6", name: "6. Liza To'plami", price: 350000, image: "liza_doll_1776486509967.png" }
    ],
    cat_matolar: [
        { id: "m1", name: "Kukolniy trikotaj (0,5 metr)", price: 35000, image: "kukolniy trikotaj web.jpg" },
        { id: "m2", name: "Alisa uchun to'plam matolari (2 ta)", price: 55000, image: "Alisa mato.jpg" },
        { id: "m3", name: "Klara uchun to'plam matosi", price: 45000, image: "KLara mato.jpg" },
        { id: "m4", name: "Zara uchun to'plam matosi", price: 45000, image: "Zara mato.jpg" },
        { id: "m5", name: "Ro'za uchun to'plam matosi", price: 45000, image: "Ro'za mato.jpg" },
        { id: "m6", name: "Ella uchun to'plam matosi", price: 40000, image: "Ella mato.jpg" }
    ],
    cat_sochlar: [
        { id: "s1", name: "To'q jigarrang soch (25 sm)", price: 23000, image: "soch jigarrang.jpg" },
        { id: "s2", name: "Kashtan rangli soch (25 sm)", price: 23000, image: "soch kashtan.jpg" },
        { id: "s3", name: "Sariq soch (25 sm)", price: 23000, image: "soch sariq.jpg" },
        { id: "s4", name: "To'q jigarrang soch (15 sm)", price: 18000, image: "15 smli to'q jigarrang.jpg" },
        { id: "s5", name: "Sariq soch (15 sm)", price: 18000, image: "soch sariq.jpg" },
        { id: "s6", name: "To'q jigarrang soch (5 sm)", price: 12000, image: "5 smli to'q jigarrang.jpg" },
        { id: "s7", name: "To'q kashtan soch (5 sm)", price: 12000, image: "5 smli och jigarrang soch.jpg" },
        { id: "s8", name: "Pushti soch (25 sm)", price: 23000, image: "soch pushti.jpg" },
        { id: "s9", name: "Siyohrang soch (25 sm)", price: 23000, image: "soch fiolet.jpg" },
        { id: "s10", name: "To'lqin kashtan soch (20 sm)", price: 25000, image: "to'lqin kashtan soch.jpg" },
        { id: "s11", name: "To'lqin rusiy soch (15 sm)", price: 20000, image: "15 smli russiy to'lqin.jpg" },
        { id: "s12", name: "Lokon kashtan rang (15 sm)", price: 25000, image: "lokon 15 smli.jpg" }
    ],
    cat_oyoq: [
        { id: "o1", name: "Och pushti keda (5 sm)", price: 20000, image: "pushti keda.jpg" },
        { id: "o2", name: "To'q pushti keda", price: 20000, image: "to'q pushti keda.jpg" },
        { id: "o3", name: "Qora keda", price: 20000, image: "qora keda.jpg" },
        { id: "o4", name: "Havorang keda", price: 20000, image: "havorang keda.jpg" },
        { id: "o5", name: "Siyohrang keda", price: 20000, image: "keda fiolet.jpg" },
        { id: "o6", name: "Sandal (5,5 sm, pushti)", price: 25000, image: "Sandal.jpg" }
    ],
    cat_aksessuar: [
        { id: "a1", name: "Tugmacha (18 mmli)", price: 300, image: "tugmacha 12 mmli.jpg" },
        { id: "a2", name: "Tugmacha (12 mmli)", price: 200, image: "tugmacha 12 mmli.jpg" },
        { id: "a3", name: "Remen regulyator", price: 1000, image: "remen regukyator.jpg" },
        { id: "a4", name: "Qora ko'z (8 mm, 1 pachka)", price: 6000, image: "qora ko'z 8mm.jpg" },
        { id: "a5", name: "Qora ko'z (4 mm, 1 pachka)", price: 5000, image: "qora ko'z 4mm.jpg" },
        { id: "a6", name: "Kipriklar (8 mm)", price: 13000, image: "kiprik.jpg" },
        { id: "a7", name: "Metall knopka (sumka)", price: 1000, image: "metall knopka sumka.jpg" },
        { id: "a8", name: "Termonakleyka (12x12 sm)", price: 12000, image: "kozli yuz.jpg" },
        { id: "a9", name: "Yuz termonakleykasi (dona)", price: 3000, image: "kozli yuz.jpg" },
        { id: "a10", name: "Kiprikli yuz", price: 3000, image: "kiprikli yuz.jpg" },
        { id: "a11", name: "Jung igna (9 sm)", price: 1500, image: "Jung igna 9 smli.jpg" },
        { id: "a12", name: "Oq jung (50 gr)", price: 35000, image: "oq jung.jpg" },
        { id: "a13", name: "Dermantin (2 ta)", price: 18000, image: "eko koja web.jpg" },
        { id: "a14", name: "Zanjir (3 mm, 1 metr)", price: 4000, image: "zanjir web.jpg" },
        { id: "a15", name: "Metal knopka (sarafan, juft)", price: 4000, image: "metal knopka sarafan web.jpg" },
        { id: "a16", name: "Oq quyoncha (6 sm)", price: 9000, image: "oq quyon 6 smli.jpg" },
        { id: "a17", name: "Xalqa (6 mm, 1 pachka)", price: 9000, image: "xalqa web.jpg" }
    ]
};

// Yordamchi funksiyalar: Savat
function getCartQty(ctx, productId) {
    if (!ctx.session) ctx.session = {};
    if (!ctx.session.cart) ctx.session.cart = {};
    return ctx.session.cart[productId] || 0;
}

function getSingleProductKeyboard(ctx, productId, categoryId) {
    let qty = getCartQty(ctx, productId);
    return Markup.inlineKeyboard([
        [
            { text: `➖`, callback_data: `cart_-1_${productId}_${categoryId}` },
            { text: `${qty} ta`, callback_data: `noop` },
            { text: `➕`, callback_data: `cart_1_${productId}_${categoryId}` }
        ]
    ]);
}


// 4. BUYURTMA SAHNASI (Order Scene)
// Foydalanuvchidan ma'lumotlarni bosqichma-bosqich so'rash uchun
const orderScene = new Scenes.WizardScene(
    'ORDER_SCENE',
    (ctx) => {
        ctx.reply("Ismingiz?");
        ctx.wizard.state.order = {}; 
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.name = ctx.message.text;
        
        let cartStr = "";
        let total = 0;
        if (ctx.session && ctx.session.cart) {
            for (const cat in productsData) {
                productsData[cat].forEach(p => {
                    const qty = ctx.session.cart[p.id];
                    if (qty > 0) {
                        const sum = qty * p.price;
                        cartStr += `🛒 ${p.name} x ${qty} = ${sum} so'm\n`;
                        total += sum;
                    }
                });
            }
        }
        ctx.wizard.state.order.cartStr = cartStr;
        ctx.wizard.state.order.total = total;
        
        ctx.reply("Telefo'n raqamingiz yoki manzilingiz?");
        return ctx.wizard.next();
    },
    (ctx) => {
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.phone = ctx.message.text;
        ctx.reply("Qo'shimcha izoh bormi? (Siz xohlagan tayyor to'plam nomi yoki maxsus talablar bo'lsa kiriting)");
        return ctx.wizard.next();
    },
    async (ctx) => {
        if (!ctx.message || !ctx.message.text) return;
        ctx.wizard.state.order.note = ctx.message.text;
        
        const { name, phone, cartStr, total, note } = ctx.wizard.state.order;

        await ctx.reply("✅ Buyurtmangiz qabul qilindi! Tez orada operatorlarimiz aloqaga chiqishadi.", getMainKeyboard());
        
        let productsText = cartStr || "Bo'sh (Faqat izoh yozilgan)";
        let totalText = total > 0 ? `💰 <b>Jami hisoblangan summa:</b> ${total} so'm` : "";

        stats.ordersCount++;
        const adminMsg = `📦 <b>Yangi buyurtma qabul qilindi!</b>\n\n` +
            `👤 <b>Mijoz:</b> ${name}\n` +
            `📞 <b>Telefon:</b> ${phone}\n\n` +
            `🛍 <b>Savatdagi mahsulotlar:</b>\n${productsText}\n` +
            `${totalText}\n\n` +
            `📝 <b>Izoh:</b> ${note}\n\n` +
            `🔗 <b>Username:</b> @${ctx.from.username || "Mavjud emas"}`;
        
        try {
            await bot.telegram.sendMessage(adminId, adminMsg, { parse_mode: "HTML" });
            
            // Xarid uchun chek mijozga ham tashlanadi if total > 0
            if (total > 0) {
               const checkMsg = `🧾 <b>Sizning xaridingiz:</b>\n\n${productsText}\n${totalText}\n\n<i>To'lov va yetkazib berish shartlari bo'yicha operatorimiz siz bilan tez orada aloqaga chiqadi.</i>`;
               await ctx.reply(checkMsg, { parse_mode: "HTML" });
            }
        } catch (e) {
            console.error("Adminga xabar yuborish xatosi:", e);
        }

        // Savatni tozalash
        if (ctx.session) ctx.session.cart = {};

        return ctx.scene.leave();
    }
);

// 5. ASOSIY MENYU TUGMALARI
function getMainKeyboard() {
    return Markup.keyboard([
        ['Bepul darslik', '6 xil qo\'g\'irchoq tikish to\'plamlarimiz bor'],
        ['Kerakli mahsulotlar', '🛒 Savat'],
        ['Buyurtma berish', 'Savollar'],
        ['Bog\'lanish']
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
    await ctx.reply("Bizning 6 xil qo'g'irchoq tikish to'plamlarimiz qatoriga quyidagilar kiradi:");

    if (productsData.cat_toplam) {
        for (const p of productsData.cat_toplam) {
            const text = `🛍 <b>${p.name}</b>\n💰 Narxi: ${p.price} so'm`;
            const photoPath = path.join(__dirname, 'images', p.image || `${p.id}.jpg`);
            
            const markup = getSingleProductKeyboard(ctx, p.id, 'cat_toplam');
            
            try {
                if (fs.existsSync(photoPath)) {
                    await ctx.replyWithPhoto({ source: photoPath }, { caption: text, parse_mode: "HTML", reply_markup: markup.reply_markup });
                } else {
                    await ctx.reply(text + "\n⚠️ (Rasm tez orada qo'shiladi)", { parse_mode: "HTML", reply_markup: markup.reply_markup });
                }
                await new Promise(r => setTimeout(r, 100)); 
            } catch (error) {
                console.error(`Rasm yuborishda xatolik (${p.name}):`, error.message);
            }
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

const categoriesMapping = {
    cat_matolar: "🧵 <b>Matolar bo'limi:</b>",
    cat_sochlar: "💇‍♀️ <b>Sochlar bo'limi:</b>",
    cat_oyoq: "👟 <b>Oyoq kiyimlar bo'limi:</b>",
    cat_aksessuar: "🎀 <b>Aksessuarlar bo'limi:</b>"
};

Object.keys(categoriesMapping).forEach(cat => {
    bot.action(cat, async (ctx) => {
        await ctx.answerCbQuery().catch(()=>{});
        await ctx.reply(categoriesMapping[cat], { parse_mode: "HTML" });
        
        if (productsData[cat]) {
            for (const p of productsData[cat]) {
                const text = `🛍 <b>${p.name}</b>\n💰 Narxi: ${p.price} so'm`;
                const photoPath = path.join(__dirname, 'images', p.image || `${p.id}.jpg`); // Har biriga o'zining rasm yo'lini qo'ydik
                
                const markup = getSingleProductKeyboard(ctx, p.id, cat);
                
                try {
                    if (fs.existsSync(photoPath)) {
                        await ctx.replyWithPhoto({ source: photoPath }, { caption: text, parse_mode: "HTML", reply_markup: markup.reply_markup });
                    } else {
                        await ctx.reply(text + "\n⚠️ (Rasm tez orada qo'shiladi)", { parse_mode: "HTML", reply_markup: markup.reply_markup });
                    }
                    // Telegram bloklamasligi uchun kichik pauza
                    await new Promise(r => setTimeout(r, 100)); 
                } catch(e) {
                    console.error("Xato:", e.message);
                }
            }
        }
    });
});

bot.action('noop', ctx => ctx.answerCbQuery().catch(()=>{}));

bot.action(/cart_(-?\d+)_([a-zA-Z0-9]+)_([a-zA-Z_]+)/, async (ctx) => {
    const amount = parseInt(ctx.match[1]);
    const productId = ctx.match[2];
    const categoryId = ctx.match[3];
    
    if (!ctx.session) ctx.session = {};
    if (!ctx.session.cart) ctx.session.cart = {};
    
    let currentQty = ctx.session.cart[productId] || 0;
    currentQty += amount;
    if (currentQty < 0) currentQty = 0;
    
    ctx.session.cart[productId] = currentQty;
    
    try {
        const markup = getSingleProductKeyboard(ctx, productId, categoryId);
        await ctx.editMessageReplyMarkup(markup.reply_markup);
        await ctx.answerCbQuery(amount > 0 ? "🛒 Savatga qo'shildi!" : "Savatdan olindi!");
    } catch(e) {
        // Ob'ekt o'zgarmagan bo'lsa xatolik beradi
        await ctx.answerCbQuery().catch(()=>{});
    }
});

// "Savat" tugmasi bosilganda
bot.hears('🛒 Savat', (ctx) => {
    let cartStr = "";
    let total = 0;
    
    if (ctx.session && ctx.session.cart) {
        for (const cat in productsData) {
            productsData[cat].forEach(p => {
                const qty = ctx.session.cart[p.id];
                if (qty > 0) {
                    const sum = qty * p.price;
                    cartStr += `${p.name} <b>x ${qty} ta</b> = ${sum} so'm\n`;
                    total += sum;
                }
            });
        }
    }
    
    if (total === 0) {
        return ctx.reply("Sizning savatingiz hozircha bo'sh! 🛒\n'Kerakli mahsulotlar' bo'limiga kirib xarid qilishingiz mumkin.");
    }
    
    ctx.reply(`🛒 <b>Sizning savatingiz:</b>\n\n${cartStr}\n💰 <b>Jami:</b> ${total} so'm\n\nRasmiylashtirish uchun <b>"Buyurtma berish"</b> tugmasini bosing!`, { parse_mode: "HTML" });
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
