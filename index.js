require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');

const { BOT_NAME, PREFIX } = require('./config');

const COMMANDS_DIR = path.join(__dirname, 'commands');
const SESSION_DIR = path.join(__dirname, 'sessions');

if (!fs.existsSync(COMMANDS_DIR)) fs.mkdirSync(COMMANDS_DIR, { recursive: true });
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

/** load commands dynamically */
const commands = new Map();
for (const file of fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(COMMANDS_DIR, file));
  commands.set(cmd.name, cmd);
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: process.env.LOG_LEVEL || 'info' }),
    printQRInTerminal: !process.env.USE_PAIRING_CODE || process.env.USE_PAIRING_CODE === 'false',
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: [BOT_NAME, 'Chrome', '1.0.0']
  });

  // Pairing code login (no QR), if requested & not registered yet
  if ((process.env.USE_PAIRING_CODE === 'true') && !state.creds.registered) {
    const phoneNumber = (process.env.PHONE_NUMBER || '').replace(/[^0-9]/g, '');
    if (!phoneNumber) {
      console.error('PHONE_NUMBER missing in .env');
      process.exit(1);
    }
    const code = await sock.requestPairingCode(phoneNumber);
    console.log('=======================================');
    console.log(' Pairing Code (enter it on your phone):');
    console.log(`   ${code}`);
    console.log('=======================================');
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect);
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log(`✅ ${BOT_NAME} is online!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const type = Object.keys(msg.message)[0];
    const isGroup = from?.endsWith('@g.us');
    const sender = jidNormalizedUser(msg.key.participant || msg.key.remoteJid);
    const text =
      (type === 'conversation' && msg.message.conversation) ||
      (type === 'extendedTextMessage' && msg.message.extendedTextMessage.text) ||
      (type === 'imageMessage' && msg.message.imageMessage.caption) ||
      (type === 'videoMessage' && msg.message.videoMessage.caption) ||
      '';

    const m = {
      id: msg.key.id,
      chat: from,
      from,
      isGroup,
      sender,
      type,
      text,
      raw: msg
    };

    if (!text.startsWith(PREFIX)) return;

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const cmd = commands.get(cmdName);
    if (!cmd) return;

    try {
      await cmd.run({ sock, m, args });
    } catch (err) {
      console.error(err);
      await sock.sendMessage(m.chat, { text: 'An error occurred while executing that command.' }, { quoted: m.raw });
    }
  });
}

start();
