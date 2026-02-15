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
        caption: '💻 <b>Onur System | İstihbarat Terminali</b>\n\nSisteme hoş geldiniz. Eski kullanıcı adları ve hesap geçmişi analiz modülü aktif.\n\n<code>Mod: Derin Sorgu ✅</code>',
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

    await ctx.reply(`📡 <b>@${username}</b> geçmiş verileri ve hesap detayları analiz ediliyor...`, { parse_mode: 'HTML' });

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

        // --- VERİ DÜZENLEME ---
        const followers = (user.follower_count || 0).toLocaleString('tr-TR');
        const following = (user.following_count || 0).toLocaleString('tr-TR');
        
        // Yeni Eklenen Kritik Bilgiler
        const dateJoined = user.about_this_account?.date_joined || "Bilinmiyor";
        const locationAccount = user.about_this_account?.location_based_on_is_verified || "Belirtilmemiş";
        const formerUsernames = user.about_this_account?.former_usernames_count || "0";
        const category = user.category_name || "Kişisel";
        const isVerified = user.is_verified ? "Mavi Tik ✅" : "Yok ❌";

        const caption = `🎯 <b>HEDEF:</b> ${user.username}\n` +
                        `👤 <b>Ad:</b> ${user.full_name || "Yok"}\n` +
                        `🆔 <b>ID:</b> <code>${user.pk}</code>\n\n` +
                        `📊 <b>İSTATİSTİKLER</b>\n` +
                        `👥 <b>Takipçi:</b> ${followers}\n` +
                        `👤 <b>Takip:</b> ${following}\n\n` +
                        `📜 <b>HESAP GEÇMİŞİ (OSINT)</b>\n` +
                        `🗓️ <b>Katılış Tarihi:</b> ${dateJoined}\n` +
                        `🔄 <b>Eski Kullanıcı Adları:</b> ${formerUsernames}\n` +
                        `📍 <b>Konum (Doğrulanmış):</b> ${locationAccount}\n` +
                        `🗂️ <b>Kategori:</b> ${category}\n` +
                        `🔵 <b>Durum:</b> ${isVerified}\n\n` +
                        `📧 <b>E-Posta:</b> <code>${user.public_email || "Gizli"}</code>\n` +
                        `📞 <b>Tel:</b> <code>${user.public_phone_number || "Gizli"}</code>\n\n` +
                        `<b>Onur System | Deep Scan V3.5</b>`;

        await ctx.replyWithPhoto(profilePic, {
            caption: caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([[Markup.button.callback('🖼️ Profil Fotosunu İndir', `indir_${user.username}`)]])
        });

        // --- TEMİZLENMİŞ TXT RAPORU ---
        const cleanReport = `
=========================================
        ONUR SYSTEM ANALİZ RAPORU
=========================================
HEDEF BİLGİLERİ
-----------------------------------------
Kullanıcı Adı    : ${user.username}
Tam Adı          : ${user.full_name || "Yok"}
ID Numarası      : ${user.pk}
Gizlilik Durumu  : ${user.is_private ? "Gizli" : "Açık"}

HESAP GEÇMİŞİ VE OSINT
-----------------------------------------
Katılış Tarihi         : ${dateJoined}
Eski Kullanıcı Adları  : ${formerUsernames} adet isim değişikliği
Konum (Hesap Bazlı)    : ${locationAccount}
Hesap Kategorisi       : ${category}
Mavi Tik Durumu        : ${user.is_verified ? "Onaylı" : "Onaylanmamış"}

İLETİŞİM VE İSTATİSTİK
-----------------------------------------
Takipçi Sayısı   : ${followers}
Takip Edilen     : ${following}
E-Posta Adresi   : ${user.public_email || "Gizli"}
Telefon Numarası : ${user.public_phone_number || "Gizli"}

BİYOGRAFİ
-----------------------------------------
${user.biography || "Biyografi bulunmuyor."}

-----------------------------------------
Sorgu Tarihi: ${new Date().toLocaleString('tr-TR')}
Onur System tarafından üretilmiştir.
=========================================`;

        await ctx.replyWithDocument({ source: Buffer.from(cleanReport, 'utf-8'), filename: `Analiz_Raporu_${user.username}.txt` });

    } catch (error) {
        ctx.reply('❌ <b>Hata:</b> Veri toplanamadı. Kullanıcı ismini doğru yazdığınızdan emin olun.');
    }
});

bot.launch();
console.log("🚀 Onur System V3.5 (Temiz Rapor) Yayında!");
