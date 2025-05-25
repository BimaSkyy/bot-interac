    const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
    if (from.endsWith('@g.us')) {
        console.log(`Pesan dari grup ${from}: ${text}`);

        await Promise.all(
            plugins.map(async (plugin) => {
                try {
                    if (typeof plugin.onMessage === 'function') {
                        await plugin.onMessage(sock, message);
                    }
                } catch (e) {
                    console.error(`Error di plugin ${plugin.name || plugin.constructor.name || 'tidak diketahui'}:`, e);
                }
            })
        );
    } else {
        const nomor = from.split('@')[0];
        console.log(`${nomor} chat di private`);
    }
});
