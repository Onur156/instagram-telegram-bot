const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const qs = require('qs');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Onur System 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf('8223532929:AAGbVW8EqdnH4b2LuCp3_UrSOT3IS-FmKH4');
const userPhotos = {};

bot.start((ctx) => {
    ctx.replyWithAnimation('https://auto.creavite.co/api/out/B5Bxcl8f3oKRtaifms_standard.gif', {
        caption: '💻 <b>Onur System | İstihbarat Terminali</b>\n\nSorgu sistemi aktif. Lütfen hedef kullanıcı adını girin.\n\n<code>Durum: Stabil ✅</code>',
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
    if (!photoUrl) return ctx.reply("❌ Fotoğraf linki bulunamadı.");
    try {
        await ctx.replyWithDocument({ url: photoUrl, filename: `OnurSystem_${targetUser}.jpg` });
    } catch (err) { ctx.reply('❌ İndirme başarısız.'); }
});

bot.on('text', async (ctx) => {
    const username = ctx.message.text.trim();
    if (username.startsWith('/')) return;

    const bekleyin = await ctx.reply(`📡 <b>@${username}</b> analiz ediliyor...`, { parse_mode: 'HTML' });

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
        
        // Veri yolunu kontrol et (Farklı API yanıtları için esneklik)
        const user = res.data?.user || res.user || res;

        if (!user || (!user.username && !user.pk)) {
            return ctx.reply('❌ <b>Hata:</b> Kullanıcı verisi API tarafından döndürülemedi.');
        }

        const profilePic = user.profile_pic_url_hd || user.profile_pic_url || "";
        userPhotos[user.username] = profilePic;

        // Verilerin varlığını tek tek kontrol et (Hata vermemesi için)
        const followers = (user.follower_count || 0).toLocaleString('tr-TR');
        const following = (user.following_count || 0).toLocaleString('tr-TR');
        const dateJoined = user.about_this_account?.date_joined || "Bilgi Yok";
        const formerNames = user.about_this_account?.former_usernames_count || "0";
        const locationAcc = user.about_this_account?.location_based_on_is_verified || "Belirtilmemiş";

        const caption = `🎯 <b>HEDEF:</b> ${user.username}\n` +
                        `👤 <b>Ad:</b> ${user.full_name || "Yok"}\n` +
                        `🆔 <b>ID:</b> <code>${user.pk || "Yok"}</code>\n\n` +
                        `📊 <b>İSTATİSTİKLER</b>\n` +
                        `👥 <b>Takipçi:</b> ${followers}\n` +
                        `👤 <b>Takip:</b> ${following}\n\n` +
                        `🗓️ <b>Katılış:</b> ${dateJoined}\n` +
                        `🔄 <b>Eski İsimler:</b> ${formerNames}\n` +
                        `📍 <b>Konum:</b> ${locationAcc}\n\n` +
                        `📧 <b>E-Posta:</b> <code>${user.public_email || "Gizli"}</code>\n` +
                        `📞 <b>Tel:</b> <code>${user.public_phone_number || "Gizli"}</code>\n\n` +
                        `<b>Onur System | Ultra Analiz</b>`;

        await ctx.replyWithPhoto(profilePic, {
            caption: caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([[Markup.button.callback('🖼️ Profil Fotosunu İndir', `indir_${user.username}`)]])
        });

        const report = `ONUR SYSTEM ANALİZ RAPORU\n\nKullanıcı: ${user.username}\nID: ${user.pk}\nKatılış: ${dateJoined}\nEski İsim Sayısı: ${formerNames}\nE-posta: ${user.public_email || "Gizli"}\nTelefon: ${user.public_phone_number || "Gizli"}\n---------------------------\nSorgu: ${new Date().toLocaleString('tr-TR')}`;
        await ctx.replyWithDocument({ source: Buffer.from(report, 'utf-8'), filename: `OnurSystem_${user.username}.txt` });

    } catch (error) {
        console.error("API Hatası:", error.response?.data || error.message);
        ctx.reply('❌ <b>Hata:</b> Sistemsel bir sorun oluştu veya API limiti doldu.');
    }
});

bot.launch();
