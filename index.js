// DavintoMD - WhatsApp AI Bot

import 'dotenv/config';
import baileys from '@whiskeysockets/baileys'; // ✅ CommonJS compatible
import { Boom } from '@hapi/boom';
import OpenAI from 'openai';
import pino from 'pino';
import readline from 'readline';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

// ✅ Destructure Baileys exports
const {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  DisconnectReason,
  PHONENUMBER_MCC
} = baileys;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise(resolve => rl.question(q, resolve));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

// --- File-based storage ---
const DB_DIR = './db';
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
const PATHS = {
  profiles: `${DB_DIR}/user_profiles.json`,
  settings: `${DB_DIR}/group_settings.json`,
  scores: `${DB_DIR}/game_scores.json`
};
for (const path of Object.values(PATHS)) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
}

const getJSON = (path) => JSON.parse(fs.readFileSync(path));
const saveJSON = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2));

const updateUserProfile = (jid, name) => {
  const data = getJSON(PATHS.profiles);
  if (!data[jid]) data[jid] = { name, count: 1 };
  else data[jid].count++;
  saveJSON(PATHS.profiles, data);
};

const updateScore = (jid, game, delta = 1) => {
  const scores = getJSON(PATHS.scores);
  if (!scores[jid]) scores[jid] = {};
  if (!scores[jid][game]) scores[jid][game] = 0;
  scores[jid][game] += delta;
  saveJSON(PATHS.scores, scores);
};

// --- WhatsApp Setup ---
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['DavintoMD', 'Desktop', '3.0']
  });

  store.bind(sock.ev);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWhatsApp();
      else console.log('Logged out. Delete auth folder to re-authenticate.');
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const isGroup = sender.endsWith('@g.us');
    const isCmd = text.startsWith('.');
    if (!isCmd) return;

    const [cmd, ...args] = text.slice(1).trim().split(/\s+/);
    const command = cmd.toLowerCase();

    // Update user profile
    updateUserProfile(sender, msg.pushName || 'User');

    const groupSettings = getJSON(PATHS.settings);
    const nsfwEnabled = groupSettings[sender]?.nsfw;

    // Commands
    switch (command) {
      case 'help':
      case 'menu':
        return sock.sendMessage(sender, {
          text: `🤖 DavintoMD Bot Commands:
.ai <prompt> — ChatGPT response
.image <prompt> — Generate image (DALL·E)
.profile — Your profile info
.score — Your game scores
.nsfw on/off — Toggle NSFW in group
.ping — Latency check`
        }, { quoted: msg });

      case 'profile': {
        const profile = getJSON(PATHS.profiles)[sender];
        return sock.sendMessage(sender, {
          text: `👤 Profile:
Name: ${profile?.name || 'Unknown'}
Messages: ${profile?.count || 0}`
        }, { quoted: msg });
      }

      case 'score': {
        const scores = getJSON(PATHS.scores)[sender] || {};
        const output = Object.entries(scores)
          .map(([game, val]) => `🎮 ${game}: ${val}`)
          .join('\n') || 'No scores yet.';
        return sock.sendMessage(sender, { text: output }, { quoted: msg });
      }

      case 'nsfw': {
        if (!isGroup) return;
        const state = args[0] === 'on';
        if (!groupSettings[sender]) groupSettings[sender] = {};
        groupSettings[sender].nsfw = state;
        saveJSON(PATHS.settings, groupSettings);
        return sock.sendMessage(sender, { text: `NSFW ${state ? 'enabled' : 'disabled'}` }, { quoted: msg });
      }

      case 'ai': {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(sender, { text: 'Usage: .ai <prompt>' }, { quoted: msg });
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are DavintoMD, a helpful AI bot.' },
            { role: 'user', content: prompt }
          ]
        });
        return sock.sendMessage(sender, { text: response.choices[0].message.content.trim() }, { quoted: msg });
      }

      case 'image': {
        const prompt = args.join(' ');
        const img = await openai.images.generate({ prompt, n: 1, size: '512x512' });
        return sock.sendMessage(sender, {
          image: { url: img.data[0].url },
          caption: `🎨 Generated image for: ${prompt}`
        }, { quoted: msg });
      }

      case 'ping': {
        const now = Date.now();
        await sock.sendMessage(sender, { text: 'Pinging...' });
        return sock.sendMessage(sender, { text: `🏓 Pong: ${Date.now() - now}ms` });
      }

      default:
        return sock.sendMessage(sender, { text: `❓ Unknown command: .${command}` }, { quoted: msg });
    }
  });
}

connectToWhatsApp();
