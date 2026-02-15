const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const qs = require('qs');
const express = require('express');

// Render 7/24 uyanık kalma sistemi
const app = express();
app.get('/', (req, res) => res.send('Onur System 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf('8223532929:AAGbVW8EqdnH4b2LuCp3_UrSOT3IS-FmKH4');
const userPhotos = {};

bot.start((ctx) => {
    ctx.replyWithAnimation('https://auto.creavite.co/api/out/B5Bxcl8f3oKRtaifms_standard.gif', {
        caption: '💻 <b>Onur System | Ultra Derin Tarama</b>\n\nSisteme hoş geldiniz. Bu sürümde tüm gizli veriler ve profesyonel hesap detayları analiz edilmektedir.\n\n<code>Mod: Maksimum Analiz 🛰️</code>',
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Hedef Sorgula', 'sorgu_baslat')]])
    });
});

bot.action('sorgu_baslat', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔎 Sorgulanacak kullanıcı adını girin:', { parse_mode: 'HTML' });
});

bot.action(/indir_(.+)/, async (ctx) => {
    const targetUser = ctx.match[1];
    const photoUrl = userPhotos[targetUser];
    await ctx.answerCbQuery('HD Fotoğraf hazırlanıyor...');
    if (!photoUrl) return ctx.reply("❌ Link zaman aşımı. Tekrar sorgula.");
    try {
        await ctx.replyWithDocument({ url: photoUrl, filename: `OnurSystem_${targetUser}.jpg` });
    } catch (err) { ctx.reply('❌ İndirme hatası.'); }
});

bot.on('text', async (ctx) => {
    const username = ctx.message.text.trim();
    if (username.startsWith('/')) return;

    await ctx.reply(`📡 <b>@${username}</b> için tüm veriler toplanıyor...`, { parse_mode: 'HTML' });

    const postData = qs.stringify({ 'username_or_url': username });
    const options = {
        method: 'POST',
        url: 'https://instagram-scraper-stable-api.p.rapidapi.com/ig_get_fb_profile_v3.php',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-rapidapi-host': 'instagram-scraper-stable-api.p.rapidapi.com',
            'x-rapidapi-key': '807bb2e430msh70ece40adb658cbp1343d7jsn28dc124de32d'
        },
        data: postData
    };

    try {
        const response = await axios.request(options);
        const res = response.data;
        const user = res.data?.user || res.user || res;

        if (!user) return ctx.reply('❌ Kullanıcı bulunamadı.');

        const profilePic = user.profile_pic_url_hd || user.profile_pic_url || "";
        userPhotos[user.username] = profilePic;

        // --- DERİN VERİLERİ TOPLAMA ---
        const followers = (user.follower_count || 0).toLocaleString('tr-TR');
        const following = (user.following_count || 0).toLocaleString('tr-TR');
        const mediaCount = (user.media_count || 0).toLocaleString('tr-TR');
        
        // Profesyonel/İşletme Bilgileri
        const category = user.category_name || "Kişisel";
        const fbPage = user.connected_fb_page_name || "Bağlı Değil";
        const isProfessional = user.is_professional ? "Evet ✅" : "Hayır ❌";
        const accountType = user.is_business ? "İşletme" : (user.is_creator ? "İçerik Üretici" : "Kişisel");
        
        // Güvenlik ve Geçmiş
        const isVerified = user.is_verified ? "Mavi Tik ✅" : "Yok ❌";
        const hasChangelog = user.has_chained_ads ? "Aktif Reklam Var" : "Reklam Yok";
        const city = user.city_name || "Belirtilmemiş";

        const caption = `🎯 <b>HEDEF:</b> ${user.username}\n` +
                        `👤 <b>Ad:</b> ${user.full_name || "Yok"}\n` +
                        `🆔 <b>ID:</b> <code>${user.pk}</code>\n` +
                        `📧 <b>E-Posta:</b> <code>${user.public_email || "Gizli"}</code>\n` +
                        `📞 <b>Tel:</b> <code>${user.public_phone_number || "Gizli"}</code>\n\n` +
                        `📊 <b>İSTATİSTİKLER</b>\n` +
                        `👥 <b>Takipçi:</b> ${followers}\n` +
                        `👤 <b>Takip:</b> ${following}\n` +
                        `📸 <b>Gönderi:</b> ${mediaCount}\n\n` +
                        `🔍 <b>DERİN ANALİZ</b>\n` +
                        `🗂️ <b>Tür:</b> ${accountType} (${category})\n` +
                        `🔵 <b>Doğrulama:</b> ${isVerified}\n` +
                        `🏢 <b>FB Sayfası:</b> ${fbPage}\n` +
                        `📍 <b>Konum/Şehir:</b> ${city}\n` +
                        `🔐 <b>Gizlilik:</b> ${user.is_private ? "Gizli 🔒" : "Açık 🔓"}\n\n` +
                        `📜 <b>Bio:</b>\n<pre>${user.biography || "Boş"}</pre>\n\n` +
                        `<b>Onur System | Ultra Analiz V3</b>`;

        await ctx.replyWithPhoto(profilePic, {
            caption: caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([[Markup.button.callback('🖼️ Profil Fotosunu İndir', `indir_${user.username}`)]])
        });

        // FULL JSON TXT RAPORU (API'den gelen her şeyi dosyaya yazar)
        const fullJsonReport = JSON.stringify(user, null, 4);
        await ctx.replyWithDocument({ source: Buffer.from(fullJsonReport, 'utf-8'), filename: `Ultra_Rapor_${user.username}.txt` }, {
            caption: `📂 <b>@${user.username}</b> için ham veri raporu ektedir. Tüm teknik detaylar bu dosyada.` ,
            parse_mode: 'HTML'
        });

    } catch (error) {
        ctx.reply('❌ <b>Hata:</b> Veri toplanamadı.');
    }
});

bot.launch();
console.log("🚀 Onur System Ultra Derin Tarama Yayında!");
