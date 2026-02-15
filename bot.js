const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const qs = require('qs');
const express = require('express');

// Render 7/24 uyanık kalma sistemi
const app = express();
app.get('/', (req, res) => res.send('Onur System Aktif!'));
app.listen(process.env.PORT || 3000);

// Senin Tokenin
const bot = new Telegraf('8223532929:AAGbVW8EqdnH4b2LuCp3_UrSOT3IS-FmKH4');
const userPhotos = {}; // Fotoğraf indirme için hafıza

bot.start((ctx) => {
    ctx.replyWithAnimation('https://auto.creavite.co/api/out/B5Bxcl8f3oKRtaifms_standard.gif', {
        caption: '💻 <b>Onur System | Kontrol Paneli</b>\n\nSistem hazır. Sorgulamak istediğiniz kullanıcı adını yazın.',
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Instagram Sorgula', 'sorgu_baslat')]])
    });
});

bot.action('sorgu_baslat', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔎 Sorgulanacak kullanıcı adını yazın:');
});

// Fotoğraf İndirme İşlemi
bot.action(/indir_(.+)/, async (ctx) => {
    const targetUser = ctx.match[1];
    const photoUrl = userPhotos[targetUser];
    await ctx.answerCbQuery('Hazırlanıyor...');
    if (photoUrl) {
        await ctx.replyWithDocument({ url: photoUrl, filename: `OnurSystem_${targetUser}.jpg` });
    } else {
        ctx.reply("❌ Fotoğraf bulunamadı, tekrar sorgulayın.");
    }
});

bot.on('text', async (ctx) => {
    const username = ctx.message.text.trim();
    if (username.startsWith('/')) return;

    await ctx.reply(`📡 <b>@${username}</b> taranıyor...`, { parse_mode: 'HTML' });

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

        if (!user || (!user.username && !user.pk)) {
            return ctx.reply('❌ Kullanıcı bulunamadı.');
        }

        const profilePic = user.profile_pic_url_hd || user.profile_pic_url || "";
        userPhotos[user.username] = profilePic; // Linki hafızaya al

        const caption = `🎯 <b>Hedef:</b> ${user.username}\n` +
                        `👤 <b>Ad:</b> ${user.full_name || "Yok"}\n` +
                        `🆔 <b>ID:</b> <code>${user.pk}</code>\n\n` +
                        `👥 <b>Takipçi:</b> ${(user.follower_count || 0).toLocaleString('tr-TR')}\n` +
                        `👤 <b>Takip:</b> ${(user.following_count || 0).toLocaleString('tr-TR')}\n\n` +
                        `📧 <b>E-Posta:</b> <code>${user.public_email || "Gizli"}</code>\n` +
                        `📞 <b>Tel:</b> <code>${user.public_phone_number || "Gizli"}</code>\n\n` +
                        `📜 <b>Bio:</b>\n<pre>${user.biography || "Yok"}</pre>\n\n` +
                        `<b>Onur System | Stabil Sürüm</b>`;

        await ctx.replyWithPhoto(profilePic, {
            caption: caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([[Markup.button.callback('🖼️ Profil Fotosunu İndir', `indir_${user.username}`)]])
        });

        // Basit Rapor
        const report = `ONUR SYSTEM RAPOR\n\nKullanıcı: ${user.username}\nID: ${user.pk}\nE-Posta: ${user.public_email || "Gizli"}\nTelefon: ${user.public_phone_number || "Gizli"}`;
        await ctx.replyWithDocument({ source: Buffer.from(report, 'utf-8'), filename: `Rapor_${user.username}.txt` });

    } catch (error) {
        ctx.reply('❌ Veri çekilemedi. API limitine takılmış olabilirsiniz.');
    }
});

bot.launch();
console.log("🚀 Onur System Çalışan Eski Koda Dönüldü!");
