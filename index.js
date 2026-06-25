const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const CommandHandler = require('./lib/CommandHandler');
const express = require('express');

async function startBot() {
    await fs.ensureDir('sessions');
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        logger: pino({ level: "silent" }),
        browser: [config.botName, 'Chrome', '1.0.0']
    });

    // Pairing Code Logic
    if (!sock.authState.creds.registered) {
        console.log(`Requesting pairing code for ${config.ownerNumber}...`);
        setTimeout(async () => {
            const code = await sock.requestPairingCode(config.ownerNumber);
            const formattedCode = code.match(/.{1,4}/g).join('-');
            console.log(`\n========================================`);
            console.log(`Your DavintoMD Pairing Code: ${formattedCode}`);
            console.log(`========================================\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('Logged out. Deleting sessions...');
                await fs.remove('sessions');
                startBot();
            }
        } else if (connection === 'open') {
            console.log(`✅ ${config.botName} Connected Successfully!`);
        }
    });

    const handler = new CommandHandler(sock);
    await handler.loadCommands();

    sock.ev.on('messages.upsert', async (m) => {
        handler.execute(m);
    });
}

// Start Web Server for Website
const app = express();
app.use(express.static(path.join(__dirname, 'website')));
app.listen(8080, () => console.log('🌐 Website running on http://localhost:8080'));

startBot().catch(console.error);
