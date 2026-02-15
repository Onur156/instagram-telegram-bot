const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const qs = require('qs');
const express = require('express');

// Render uyanık kalma sistemi
const app = express();
app.get('/', (req, res) => res.send('Onur System 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

// Onur System - Telegram Token
const bot = new Telegraf('8223532929:AAGbVW8EqdnH4b2LuCp3_UrSOT3IS-FmKH4');

// Hafızada fotoğraf linklerini tutmak için basit bir nesne
const userPhotos = {};

bot.start((ctx) => {
    ctx.replyWithAnimation('https://auto.creavite.co/api/out/B5Bxcl8f3oKRtaifms_standard.gif', {
        caption: '💻 <b>Onur System | Kontrol Paneli</b>\n\nHoş geldiniz Onur Bey. Instagram OSINT sistemi hazır.\n\n<code>Durum: Sinyal Güçlü ✅</code>',
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔍 Instagram Sorgula', 'sorgu_baslat')]])
    });
});

bot.action('sorgu_baslat', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🔎 Sorgulanacak kullanıcı adını gönderin:', { parse_mode: 'HTML' });
});

// --- PROFİL FOTOĞRAFI İNDİRME FIX (Linkten İndirme) ---
bot.action(/indir_(.+)/, async (ctx) => {
    const targetUser = ctx.match[1];
    const photoUrl = userPhotos[targetUser];

    await ctx.answerCbQuery('Dosya hazırlanıyor...');
    
    if (!photoUrl) {
        return ctx.reply("❌ Fotoğraf linki zaman aşımına uğradı, lütfen tekrar sorgulayın.");
    }

    try {
        // Fotoğrafı URL üzerinden belge olarak gönder (Hata vermez)
        await ctx.replyWithDocument({ url: photoUrl, filename: `OnurSystem_${targetUser}.jpg` }, {
            caption: `📸 <b>${targetUser}</b> - Profil Fotoğrafı (HD)`,
            parse_mode: 'HTML'
        });
    } catch (err) {
        ctx.reply('❌ İndirme sırasında bir sorun oluştu.');
    }
});

// --- ANA SORGULAMA MOTORU ---
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

        if (!user || (!user.username && !user.full_name)) {
            return ctx.reply('❌ <b>Hata:</b> Kullanıcı bulunamadı.');
        }

        const profilePic = user.profile_pic_url_hd || user.profile_pic_url || "";
        
        // Linki butona tıklayınca kullanmak için hafızaya alıyoruz
        userPhotos[user.username] = profilePic;

        const followers = (user.follower_count || 0).toLocaleString('tr-TR');
        const following = (user.following_count || 0).toLocaleString('tr-TR');

        const caption = `🎯 <b>Hedef:</b> ${user.username}\n` +
                        `👤 <b>Ad Soyad:</b> ${user.full_name || "Yok"}\n` +
                        `🆔 <b>ID:</b> <code>${user.pk || user.id}</code>\n` +
                        `📧 <b>E-Posta:</b> <code>${user.public_email || "Gizli"}</code>\n` +
                        `📞 <b>Telefon:</b> <code>${user.public_phone_number || "Gizli"}</code>\n\n` +
                        `📊 <b>İstatistikler:</b>\n` +
                        `👥 <b>Takipçi:</b> ${followers}\n` +
                        `👤 <b>Takip Edilen:</b> ${following}\n` +
                        `🔐 <b>Hesap:</b> ${user.is_private ? "Gizli 🔒" : "Açık 🔓"}\n\n` +
                        `📜 <b>Bio:</b>\n<pre>${user.biography || "Biyografi yok."}</pre>\n\n` +
                        `<b>Onur System OSINT Sürümü</b>`;

        await ctx.replyWithPhoto(profilePic, {
            caption: caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🖼️ Profil Fotosunu İndir', `indir_${user.username}`)]
            ])
        });

        const report = `ONUR SYSTEM ANALİZ RAPORU\n\nKullanıcı: ${user.username}\nTakipçi: ${followers}\nTakip Edilen: ${following}\nE-posta: ${user.public_email || "Gizli"}\nTelefon: ${user.public_phone_number || "Gizli"}\nSorgu: ${new Date().toLocaleString('tr-TR')}`;
        await ctx.replyWithDocument({ source: Buffer.from(report, 'utf-8'), filename: `Analiz_${user.username}.txt` });

    } catch (error) {
        ctx.reply('❌ <b>Hata:</b> Veri çekilemedi.');
    }
});

bot.launch().then(() => console.log("🚀 Onur System Yayında!"));
