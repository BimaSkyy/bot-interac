const lastMessage = new Map();
const cooldownGroup = new Map();
const cooldownUser = new Map();

async function translateToIndo(text) {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
}

exports.onMessage = async (sock, message) => {
    const from = message.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) return; // hanya respon di group

    if (message.key.fromMe) return; // abaikan pesan dari bot sendiri

    const now = Date.now();
    const groupCooldown = cooldownGroup.get(from) || 0;
    const sender = message.key.participant || message.key.remoteJid;

    // Ambil teks pesan
    const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
    const lowerText = text.toLowerCase().trim();

    // Cek cooldown grup dan user
    if (now < groupCooldown) return;
    const userCooldownTime = cooldownUser.get(sender) || 0;
    if (now < userCooldownTime) return;

    // Cek apakah pesan adalah reply ke orang lain selain bot
    const contextInfo = message.message.extendedTextMessage?.contextInfo;
    const repliedTo = contextInfo?.participant || null;
    const botId = sock.user.id || null;
    if (repliedTo && repliedTo !== botId) return; // abaikan pesan reply ke user lain
    // Cek apakah pesan mengandung kata panggil bot (bot, @bot, nama bot)
    const isCallingBot = /\b(bot|@6283132988099|alesya)\b/i.test(lowerText);

    // Hitung jumlah kata, batasi supaya bot gak bales obrolan panjang
    const wordCount = lowerText.split(/\s+/).filter(w => w).length;
    if (wordCount > 10 && !isCallingBot) return; // pesan panjang bukan panggilan bot, abaikan

    // Jika pesan tidak mengandung trigger apapun dan tidak memanggil bot, abaikan
    const triggers = [
    /hallo+|halo+/i,
    /selamat (pagi|siang|sore|malam)/i,
    /\bbot\b/i,
    /\bgabut\b/i,
    /ass?ala?mu'?alaikum/i,
    /\b(goblok|anjing|bangsat|kontol|tolol|babi|kampret)\b/i,
    /\b(owner|pemilik)\b/i,
    /(nama kamu siapa|siapa nama kamu)/i
];
    const isTrigger = triggers.some(rx => rx.test(lowerText));
    if (!isTrigger && !isCallingBot) return;

    // Cek pesan terakhir dari sender untuk hindari spam balasan sama
    const last = lastMessage.get(sender)?.toLowerCase();

    let responded = false;

// Balasan untuk pertanyaan nama bot
if (
  !responded &&
  /(nama kamu siapa|siapa nama kamu)/i.test(lowerText)
) {
    await sock.sendMessage(from, {
        text: "nama aku Alesya kak, kenapa?"
    }, { quoted: message });
    responded = true;
}
    // Balasan salam halo
    if (!responded && /hallo+|halo+/i.test(text)) {
        if (!last || last !== lowerText) {
            const reply = /hallo+|halo+/i.test(last || '')
                ? ['kenapa sih?', 'apaan hallo terus ?', 'iya kenapa ?'][Math.floor(Math.random() * 3)]
                : 'hallo juga kak';
            await sock.sendMessage(from, { text: reply }, { quoted: message });
            responded = true;
        }
    }
//owner
if (
  !responded &&
  ['owner', 'pemilik']
    .some(word => lowerText.includes(word))
) {
    const replies = [
        "coba tanya admin kak siapa ownerku, aku cuman numpang hidup disini",
        "ga tau kak aku ownernya siapa, aku cuman pembantu disini miris banget"
    ];
    await sock.sendMessage(from, {
        text: replies[Math.floor(Math.random() * replies.length)]
    }, { quoted: message });
    responded = true;
}

// Balasan untuk kata toxic
if (
  !responded &&
  ['goblok', 'anjing', 'bangsat', 'kontol', 'tolol', 'babi', 'kampret']
    .some(word => lowerText.includes(word))
) {
    const replies = [
        "jangan toxic napa!",
        "Bahasanya dijaga, tong!",
        "Sopan dikit napa, bukan kandang kambing ini.",
        "dasar toxic, otaknya basic."
    ];
    await sock.sendMessage(from, {
        text: replies[Math.floor(Math.random() * replies.length)]
    }, { quoted: message });
    responded = true;
}
    // Balasan selamat pagi/siang/sore/malam
    if (!responded && /selamat (pagi|siang|sore|malam)/i.test(text)) {
        if (!last || last !== lowerText) {
            const waktu = text.match(/selamat (pagi|siang|sore|malam)/i)[1];
            await sock.sendMessage(from, { text: `Selamat ${waktu} juga kak! Semangat ya hari ini!` }, { quoted: message });
            responded = true;
        }
    }

    // Balasan kata gabut dengan quote
    if (!responded && /\bgabut\b/i.test(text)) {
        try {
            const res = await fetch('https://zenquotes.io/api/random');
            const data = await res.json();
            const quote = `"${data[0].q}"\n— ${data[0].a}`;
            const hasil = await translateToIndo(quote);
            await sock.sendMessage(from, { text: 'nih aku ada quote buat kamu biar ga gabut\n\n' + hasil }, { quoted: message });
            responded = true;
        } catch (err) {
            await sock.sendMessage(from, { text: 'Lagi gabut juga nih... Tapi quotenya error.' }, { quoted: message });
        }
    }

    // Balasan kata bot
    if (!responded && /\bbot\b/i.test(text)) {
        if (!last || last !== lowerText) {
            const pick = ["Hush, jangan panggil-panggil. Aku lagi ngopi.", "Bot? Aku lebih dari itu!"];
            await sock.sendMessage(from, { text: pick[Math.floor(Math.random() * pick.length)] }, { quoted: message });
            responded = true;
        }
    }

    // Balasan assalamualaikum
    if (!responded && /ass?ala?mu'?alaikum/i.test(text)) {
        if (!last || !/ass?ala?mu'?alaikum/i.test(last)) {
            const pick = ['wallaikumsalam', 'wallaikumsalam, salam ya kak✨'];
            await sock.sendMessage(from, { text: pick[Math.floor(Math.random() * pick.length)] }, { quoted: message });
            responded = true;
        }
    }

    if (responded) {
        cooldownGroup.set(from, now + 3000);      // cooldown 3 detik per grup
        cooldownUser.set(sender, now + 5000);     // cooldown 5 detik per user
    }

    lastMessage.set(sender, text);
};
