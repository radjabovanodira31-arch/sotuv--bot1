import { Telegraf, session, Markup, Scenes } from 'telegraf';
import dotenv from 'dotenv';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env faylidan o'zgaruvchilarni o'qish
dotenv.config();

const { BOT_TOKEN, ADMIN_CHAT_ID } = process.env;

// Token tekshiruvi
if (!BOT_TOKEN || BOT_TOKEN === 'bu_yerdagi_yozuv_orniga_bot_tokenni_yozing') {
    console.error("XATO: BOT_TOKEN topilmadi! Iltimos, Railway'da Variables bo'limiga o'tib BOT_TOKEN kiriting.");
    process.exit(1);
}

// Bot obyekti
const bot = new Telegraf(BOT_TOKEN);

// --- MA'LUMOTLAR BAZASI (Xotirada saqlash uchun) ---
const db = {
    users: 0,
    orders: 0
};

// --- MAHSULOTLAR RO'YXATI ---
const products = {
    kits: [
        { id: 'kit1', name: "Klara to'plami", price: 150000, img: "Klara_ to'plami..jpg" },
        { id: 'kit2', name: "Alisa to'plami", price: 160000, img: "Alisa_ to'plami..jpg" },
        { id: 'kit3', name: "Zara to'plami", price: 150000, img: "Zara to'plami.jpg" },
        { id: 'kit4', name: "Ella to'plami", price: 150000, img: "Ella_ to'plami..jpg" },
        { id: 'kit5', name: "Ro'za to'plami", price: 150000, img: "Ro'za to'plami.jpg" },
        { id: 'kit6', name: "Liza to'plami", price: 350000, img: "Liza to'plami.jpg" }
    ],
    matolar: [
        { id: 'mat1', name: "Kukolniy trikotaj 0.5 - yarim metr", price: 35000, img: "kukolniy trikotaj.jpg" },
        { id: 'mat2', name: "2 talik Alisa uchun to'plam matolari + furnitura", price: 55000, img: "Alisa_ uchun_  mato_ to'plam..jpg" },
        { id: 'mat3', name: "Klara uchun to'plam matosi + furnitura", price: 45000, img: "Klara_ uchun_ to'plam_ matolari.jpg" },
        { id: 'mat4', name: "Zara uchun to'plam matosi + furnitura", price: 45000, img: "Zara uchu to'plam matolari.jpg" },
        { id: 'mat5', name: "Roza uchun to'plam matosi + furnitura", price: 45000, img: "Ro'za uchun to'plam matolari.jpg" },
        { id: 'mat6', name: "Ella uchun to'plam matosi + furnitura", price: 40000, img: "Ella_uchun_toplam_matolari..jpg" }
    ],
    sochlar: [
        { id: 'soch1', name: "To'q jigarrang 25 smli sochlar", price: 23000, img: "to'q jigarrang 25 smli.jpg" },
        { id: 'soch2', name: "Kashtan rangli 25 smli sochlar", price: 23000, img: "kashtan_ rangli_ 25_ smli_ sochlar..jpg" },
        { id: 'soch3', name: "Sariq soch 25 sm", price: 23000, img: "25_ smli_ sariqsoch..jpg" },
        { id: 'soch4', name: "To'q jigarrang 15 smli", price: 18000, img: "toq jigarrang 15 smli.jpg" },
        { id: 'soch5', name: "Sariq soch 15 smli", price: 18000, img: "sariq soch 15 smli.jpg" },
        { id: 'soch6', name: "To'q jigarrang soch 5 smli", price: 12000, img: "to'q jigarrang soch 5 smli.jpg" },
        { id: 'soch7', name: "To'q kashtan soch 5 smli", price: 12000, img: "to'q kashtan 5 smli.jpg" },
        { id: 'soch8', name: "Pushti soch 25 smli", price: 23000, img: "pushti soch 25 smli.jpg" },
        { id: 'soch9', name: "Siyoxrang soch 25 smli", price: 23000, img: "siyoxrang soch.jpg" },
        { id: 'soch10', name: "To'lqin kashtan soch 20 sm", price: 25000, img: "to'lqin kashtan soch 20 sm.jpg" },
        { id: 'soch11', name: "To'lqin russiy 15 smli", price: 20000, img: "to'lqin russiy15 smli.jpg" },
        { id: 'soch12', name: "Lokon kashtan rang, 15 sm", price: 25000, img: "lokon kashtan 15 smli.jpg" }
    ],
    oyoq_kiyim: [
        { id: 'oyoq1', name: "5 smli och pushti keda", price: 20000, img: "och pushti keda.jpg" },
        { id: 'oyoq2', name: "To'q pushti keda", price: 20000, img: "to'q pushti keda.jpg" },
        { id: 'oyoq3', name: "Qora keda", price: 20000, img: "qora keda.jpg" },
        { id: 'oyoq4', name: "Havorang keda", price: 20000, img: "xavorang keda.jpg" },
        { id: 'oyoq5', name: "Keda siyoxrang", price: 20000, img: "siyoxrang keda.jpg" },
        { id: 'oyoq6', name: "Sandal 5,5 smli, pushti", price: 25000, img: "sandal.jpg" }
    ],
    aksessuar: [
        { id: 'aks1', name: "Tugmacha 18 mmli", price: 300, img: "tugmacha 18 mmli.jpg" },
        { id: 'aks2', name: "Tugmacha 12 mmli", price: 200, img: "tugmacha 12 mmli.jpg" },
        { id: 'aks3', name: "Remen regulyator", price: 1000, img: "remen regulyator.jpg" },
        { id: 'aks4', name: "Qora ko'z 8 mmli (1 pachka)", price: 6000, img: "qora ko'z 8 mm.jpg" },
        { id: 'aks5', name: "Qora ko'z 4 mmli (1 pachka)", price: 5000, img: "qora ko'z 4mm.jpg" },
        { id: 'aks6', name: "Kipriklar 8 mmli", price: 13000, img: "kipriklar..jpg" },
        { id: 'aks7', name: "Metall knopka sumka uchun", price: 1000, img: "metal knopka sumka uchun.jpg" },
        { id: 'aks8', name: "Termonakleyka 12sm ga - 12sm", price: 12000, img: "termonakleyka web.jpg" },
        { id: 'aks9', name: "Ko'zli yuz termonakleykasi (dona)", price: 3000, img: "ko'zli yuz.jpg" },
        { id: 'aks10', name: "Kiprikli yuz", price: 3000, img: "kiprikli_ yuz..jpg" },
        { id: 'aks11', name: "Jung igna 9 smli", price: 1500, img: "jung_ igna_ 9 sm..jpg" },
        { id: 'aks12', name: "Oq jung 50 gr", price: 35000, img: "oq jung 50 gram.jpg" },
        { id: 'aks13', name: "Dermantin 30x30 sm havorang + pushti 2 ta", price: 18000, img: "dermantin..jpg" },
        { id: 'aks14', name: "Zanjir 3 mmli (1 metr)", price: 4000, img: "zanjir.jpg" },
        { id: 'aks15', name: "Metal knopka (sarafan uchun, 1 jufti)", price: 4000, img: "metal knopka sarafan uchun.jpg" },
        { id: 'aks16', name: "Oq quyoncha 6 smli", price: 9000, img: "oq quyoncha.jpg" },
        { id: 'aks17', name: "Xalqa 6 mmli 1 pachka", price: 9000, img: "xalqa 6 mm.jpg" }
    ]
};

// Rasm topuvchi maxsus aqlli funksiya
function getImagePath(imgName) {
    // 1. Asosiy va images papkalarni ko'ramiz
    const possiblePaths = [
        path.join(__dirname, 'images', imgName),
        path.join(__dirname, imgName),
        path.join(__dirname, 'images', imgName.replace('.jpg', '')),
        path.join(__dirname, imgName.replace('.jpg', ''))
    ];
    
    for (let p of possiblePaths) {
        if (fs.existsSync(p)) return p;
    }
    
    // 2. Qisman nom boyicha qidirish (GitHub'ga yuklashdagi muammolarni oldini olish uchun)
    const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanImgName = normalize(imgName);
    
    const searchDirs = [__dirname, path.join(__dirname, 'images')];
    for (let dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (let file of files) {
            if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) {
                const cleanFile = normalize(file);
                if (cleanFile.includes(cleanImgName) || cleanImgName.includes(cleanFile)) {
                    return path.join(dir, file);
                }
            }
        }
    }
    
    return possiblePaths[0]; // baribir topilmasa defaultni qaytaramiz
}

// Barcha mahsulotlarni bitta massivda saqlab olish
const allProducts = [
    ...products.kits, ...products.matolar, ...products.sochlar, 
    ...products.oyoq_kiyim, ...products.aksessuar
];

// Asosiy menyu (Klaviaturadagi tugmalar)
const mainMenu = Markup.keyboard([
    ['🎁 Bepul darslik', '🧸 To\'plamlar'],
    ['🛍 Kerakli mahsulotlar', '🛒 Savat'],
    ['📦 Buyurtma berish', '❓ Savollar'],
    ['📞 Bog\'lanish']
]).resize();

// "Kerakli mahsulotlar" osti menyusi
const materialsMenu = Markup.keyboard([
    ['🪡 Matolar', '💇‍♀️ Sochlar'],
    ['👟 Oyoq kiyimlar', '🎀 Aksessuarlar'],
    ['⬅️ Asosiy menyu']
]).resize();

// --- BUYURTMA BERISH SCENE (Bosqichma-bosqich so'rovnomasi) ---
const orderWizard = new Scenes.WizardScene(
    'order-wizard',
    (ctx) => {
        ctx.reply("Iltimos, ismingizni kiriting:", Markup.removeKeyboard());
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply("Iltimos, telefon raqamingizni kiriting:\n(Masalan: +998901234567)");
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.phone = ctx.message.text;
        ctx.reply("Qaysi to'plam kerak? yoki Qo'shimcha izohingizni yozib qoldiring:");
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.comment = ctx.message.text;
        
        const cart = ctx.session?.cart || {};
        const username = ctx.from.username ? `@${ctx.from.username}` : "Mavjud emas";
        
        let orderText = `📦 *YANGI BUYURTMA* \n\n`;
        orderText += `👤 *Ism:* ${ctx.wizard.state.name}\n`;
        orderText += `🔗 *Username:* ${username}\n`;
        orderText += `📞 *Telefon:* ${ctx.wizard.state.phone}\n`;
        orderText += `📝 *Izoh:* ${ctx.wizard.state.comment}\n\n`;
        
        let total = 0;
        let cartItemsText = `*Xarid qilingan narsalar (Savatdan):*\n`;
        for (let [id, qty] of Object.entries(cart)) {
            let item = allProducts.find(p => p.id === id);
            if (item) {
                let sum = item.price * qty;
                cartItemsText += `- ${item.name} | ${qty} x ${item.price} = ${sum} so'm\n`;
                total += sum;
            }
        }
        
        if (Object.keys(cart).length === 0) {
            cartItemsText += "Xaridorning savati bo'sh. Faqatgina izoh yozilgan.\n";
        } else {
            orderText += cartItemsText;
            orderText += `\n💰 *Umumiy summa:* ${total} so'm`;
        }
        
        try {
            if(ADMIN_CHAT_ID && ADMIN_CHAT_ID !== 'bu_yerdagi_yozuv_orniga_telegram_id_yozing') {
                await bot.telegram.sendMessage(ADMIN_CHAT_ID, orderText, { parse_mode: 'Markdown' });
            }
            db.orders += 1;
            
            const successMessage = "✅ Buyurtmangiz qabul qilindi! Tez orada aloqaga chiqamiz.\n\n" +
                                   "💳 *To'lov uchun karta raqami:*\n" +
                                   "Humo: `9860 2701 0270 3435`\n" +
                                   "👤 Radjabova Nodira\n\n" +
                                   "⚠️ To'lov amalga oshirilishi bilan yuboriladi.";
            
            const deliveryMessage = "📍 *Qayerga yuborish kerak?*\n\n" +
                                    "— Yandex orqali olishni istasangiz, telefon raqamingiz va lokatsiyangizni yuboring.\n" +
                                    "— BTS, EMU pochtalari orqali olishni xohlasangiz, ism, tel raqam, viloyat va tumaningizni yozing (Masalan: Samarqand viloyati, Urgut tumani).";
                                   
            await ctx.reply(successMessage, { parse_mode: 'Markdown' });
            await ctx.reply(deliveryMessage, { parse_mode: 'Markdown', ...mainMenu });
            ctx.session.cart = {}; 
        } catch (error) {
            ctx.reply("Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring yoki adminga to'g'ridan-to'g'ri yozing.", mainMenu);
            console.error("Adminga xabar yuborishda xato:", error);
        }
        
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([orderWizard]);

bot.use(session());
bot.use(stage.middleware());

bot.use((ctx, next) => {
    if (!ctx.session) ctx.session = {};
    if (!ctx.session.cart) ctx.session.cart = {};
    return next();
});

// --- ASOSIY BUYRUQLAR ---
bot.start((ctx) => {
    db.users += 1;
    ctx.reply(`Salom ${ctx.from.first_name || ''}! Bizning qo'g'irchoqlar va mahsulotlar do'konimizga xush kelibsiz.\nQuyidagi menyudan kerakli bo'limni tanlang:`, mainMenu);
});

bot.command('admin', (ctx) => {
    if (ctx.from.id.toString() === ADMIN_CHAT_ID) {
         ctx.reply(`📊 *Admin Statistika:*\n\n👥 Botdan foydalanganlar soni (taxminiy): ${db.users}\n📦 Jami qabul qilingan buyurtmalar: ${db.orders}`, {parse_mode: 'Markdown'});
    } else {
         ctx.reply("Sizda admin huquqlari yo'q.");
    }
});

// --- MENYU TUGMALARI ISHLASHI ---
bot.hears('🎁 Bepul darslik', async (ctx) => {
    const text = `Salom! 7 yillik hunarmand master sifatida, ijodkorlikka qiziqish bildirayotganligingizdan hursandman! Marhamat bepul darslikni oling.`;
    const photoUrl = getImagePath('master.jpg');
    
    try {
        await ctx.replyWithPhoto(
            { source: photoUrl }, 
            {
                caption: text,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '▶️ Darslikni ko\'rish', url: 'https://t.me/master_tkaniart/543' }]
                    ]
                }
            }
        );
    } catch (e) {
        console.error("Bepul darslik rasmini jo'natishda xato: ", e);
        ctx.reply(text, Markup.inlineKeyboard([
            Markup.button.url('▶️ Darslikni ko\'rish', 'https://t.me/master_tkaniart/543')
        ]));
    }
});

function getProductKeyboard(itemId, cart) {
    const qty = cart[itemId] || 0;
    return {
        inline_keyboard: [
            [
                {text: '➖', callback_data: `minus_${itemId}`},
                {text: `${qty} ta`, callback_data: `noop`},
                {text: '➕', callback_data: `plus_${itemId}`}
            ]
        ]
    };
}

bot.hears('🧸 To\'plamlar', async (ctx) => {
    await ctx.reply("6 xil qo’g’irchoq tikish to’plamlarimiz bor:");
    for (let kit of products.kits) {
        try {
            await ctx.replyWithPhoto({source: getImagePath(kit.img)}, {
                caption: `📦 *${kit.name}*\n💰 Narxi: ${kit.price} so'm`,
                parse_mode: 'Markdown',
                reply_markup: getProductKeyboard(kit.id, ctx.session.cart || {})
            });
        } catch(e) {
            console.error("Rasm yuborishda xato (To'plamlar): ", e.message);
            await ctx.reply(`📦 *${kit.name}*\n💰 Narxi: ${kit.price} so'm`, {
                parse_mode: 'Markdown',
                reply_markup: getProductKeyboard(kit.id, ctx.session.cart || {})
            });
        }
    }
});

bot.hears('🛍 Kerakli mahsulotlar', (ctx) => {
    ctx.reply("Qaysi turdagi mahsulot kerak?", materialsMenu);
});

async function sendCategoryProducts(ctx, categoryArray) {
    for (let item of categoryArray) {
         try {
             await ctx.replyWithPhoto({source: getImagePath(item.img)}, {
                caption: `🔹 *${item.name}*\n💰 Narxi: ${item.price} so'm`,
                parse_mode: 'Markdown',
                reply_markup: getProductKeyboard(item.id, ctx.session.cart || {})
            });
         } catch(e) {
             console.error("Rasm yuborishda xato: ", e.message);
             await ctx.reply(`🔹 *${item.name}*\n💰 Narxi: ${item.price} so'm`, {
                parse_mode: 'Markdown',
                reply_markup: getProductKeyboard(item.id, ctx.session.cart || {})
            });
         }
    }
}

bot.hears('🪡 Matolar', async (ctx) => { await sendCategoryProducts(ctx, products.matolar); });
bot.hears('💇‍♀️ Sochlar', async (ctx) => { await sendCategoryProducts(ctx, products.sochlar); });
bot.hears('👟 Oyoq kiyimlar', async (ctx) => { await sendCategoryProducts(ctx, products.oyoq_kiyim); });
bot.hears('🎀 Aksessuarlar', async (ctx) => { await sendCategoryProducts(ctx, products.aksessuar); });

bot.hears('⬅️ Asosiy menyu', (ctx) => {
    ctx.reply("Asosiy menyu:", mainMenu);
});

bot.action(/plus_(.+)/, async (ctx) => {
    const itemId = ctx.match[1];
    if(!ctx.session.cart) ctx.session.cart = {};
    ctx.session.cart[itemId] = (ctx.session.cart[itemId] || 0) + 1;
    
    try { await ctx.editMessageReplyMarkup(getProductKeyboard(itemId, ctx.session.cart)); } catch(e) {}
    await ctx.answerCbQuery();
});

bot.action(/minus_(.+)/, async (ctx) => {
    const itemId = ctx.match[1];
    if(!ctx.session.cart) ctx.session.cart = {};
    if (ctx.session.cart[itemId] && ctx.session.cart[itemId] > 0) {
        ctx.session.cart[itemId] -= 1;
        if(ctx.session.cart[itemId] === 0) delete ctx.session.cart[itemId];
    }
    
    try { await ctx.editMessageReplyMarkup(getProductKeyboard(itemId, ctx.session.cart)); } catch(e) {}
    await ctx.answerCbQuery();
});

bot.action('noop', async (ctx) => { await ctx.answerCbQuery(); });

bot.hears('🛒 Savat', (ctx) => {
    const cart = ctx.session.cart || {};
    if (Object.keys(cart).length === 0) {
        return ctx.reply("Sizning savatingiz hozircha bo'sh.");
    }

    let text = "🛒 *Sizning savatingiz:*\n\n";
    let total = 0;

    for (let [id, qty] of Object.entries(cart)) {
        let item = allProducts.find(p => p.id === id);
        if (item) {
            let sum = item.price * qty;
            text += `🔸 *${item.name}*\n${qty} dona x ${item.price} = ${sum} so'm\n\n`;
            total += sum;
        }
    }

    text += `💰 *Umumiy summa:* ${total} so'm`;

    ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{text: "🗑 Savatni tozalash", callback_data: "clear_cart"}],
                [{text: "📦 Buyurtma berish", callback_data: "checkout"}]
            ]
        }
    });
});

bot.action('clear_cart', async (ctx) => {
    ctx.session.cart = {};
    await ctx.editMessageText("Savat tozalandi! 🗑");
    await ctx.answerCbQuery();
});

bot.action('checkout', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.enter('order-wizard');
});

bot.hears('📦 Buyurtma berish', (ctx) => {
    ctx.scene.enter('order-wizard');
});

bot.hears('❓ Savollar', (ctx) => {
    const faq = `❓ *Ko'p beriladigan savollar:*\n\n` +
    `💬 "Video darsliklar qanday formatda bo'ladi?"\n✅ Onlayn formatda\n\n` +
    `💬 "Qanday uslubda olish mumkin?"\n✅ Toshkent bo'ylab Yandex orqali\n✅ Viloyatlar bo'ylab 1 kundan 3 kungacha BTS pochta orqali.\n\n` +
    `💬 "To'lov usuli qanday?"\n✅ Karta orqali oldindan to'lov.`;
    ctx.reply(faq, {parse_mode: 'Markdown'});
});

bot.hears('📞 Bog\'lanish', (ctx) => {
    const contacts = `📞 *Biz bilan bog'lanish:*\n\n🔵 Telegram: @Nodira_Abdullaevna\n📱 Telefon: +998950589181\n⏰ Ish vaqti: 09:00 - 18:00`;
    ctx.reply(contacts, {parse_mode: 'Markdown'});
});

bot.launch().then(() => {
    console.log("✅ Bot muvaffaqiyatli ishga tushdi!");
}).catch((err) => {
    console.error("Bot ishga tushishda xatolik:", err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running...');
}).listen(PORT, () => {
    console.log(`Port tinglanmoqda: ${PORT} (Railway uchun)`);
});
