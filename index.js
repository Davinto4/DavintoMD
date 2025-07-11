// DavintoMD - WhatsApp AI Bot
import 'dotenv/config';
import { Boom } from '@hapi/boom';
import OpenAI from 'openai';
import pino from 'pino';
import readline from 'readline';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

// ✅ Correct Baileys import: Import the entire library as a default object
// All Baileys components will then be accessed as Baileys.ComponentName
import Baileys from '@whiskeysockets/baileys';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise(resolve => rl.question(q, resolve));
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

// In-Memory Store
// Access makeInMemoryStore as a property of the imported Baileys object
const store = Baileys.makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// JSON-based storage
const PROFILE_PATH = './db/user_profiles.json';
const SETTINGS_PATH = './db/group_settings.json';
const SCORES_PATH = './db/game_scores.json';
if (!fs.existsSync('./db')) fs.mkdirSync('./db');
if (!fs.existsSync(PROFILE_PATH)) fs.writeFileSync(PROFILE_PATH, '{}');
if (!fs.existsSync(SETTINGS_PATH)) fs.writeFileSync(SETTINGS_PATH, '{}');
if (!fs.existsSync(SCORES_PATH)) fs.writeFileSync(SCORES_PATH, '{}');

const getProfiles = () => JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8'));
const saveProfiles = (d) => fs.writeFileSync(PROFILE_PATH, JSON.stringify(d, null, 2));
const updateUserProfile = (jid, name) => {
  const data = getProfiles();
  if (!data[jid]) data[jid] = { name, count: 1 };
  else data[jid].count++;
  saveProfiles(data);
};

const getSettings = () => JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
const saveSettings = (d) => fs.writeFileSync(SETTINGS_PATH, JSON.stringify(d, null, 2));

const getScores = () => JSON.parse(fs.readFileSync(SCORES_PATH, 'utf8'));
const saveScores = (d) => fs.writeFileSync(SCORES_PATH, JSON.stringify(d, null, 2));
const updateScore = (jid, game, delta = 1) => {
  const d = getScores();
  if (!d[jid]) d[jid] = {};
  if (!d[jid][game]) d[jid][game] = 0;
  d[jid][game] += delta;
  saveScores(d);
};

const OWNER_NUMBER = process.env.OWNER_NUMBER || ''; // Ensure this is set in your .env file, e.g., OWNER_NUMBER='2348012345678@s.whatsapp.net'

async function connectToWhatsApp() {
  // Access useMultiFileAuthState as a property of the imported Baileys object
  const { state, saveCreds } = await Baileys.useMultiFileAuthState('auth_info_baileys');
  // Access fetchLatestBaileysVersion as a property of the imported Baileys object
  const { version } = await Baileys.fetchLatestBaileysVersion();
  console.log(`Using Baileys version ${version.join('.')} (latest: fetched)`); // Changed isLatest as it's not always available for destructuring

  // Access makeWASocket as the default property of the imported Baileys object
  const sock = Baileys.default({ // Baileys.default is the makeWASocket function
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
      // Access DisconnectReason as a property of the imported Baileys object
      const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== Baileys.DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWhatsApp();
      else console.log('Logged out. Delete auth_info_baileys and restart.');
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp');
    }

    if (sock.authState.creds.registered === false) {
      console.log('\n--- Initiating Phone Number Pairing ---');
      let phoneNumber = await question('Please enter your WhatsApp phone number (e.g., 2348012345678): ');
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

      // Access PHONENUMBER_MCC as a property of the imported Baileys object
      if (!Object.keys(Baileys.PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
        console.log("❌ Invalid phone number format. Please include the country code.");
        sock.ev.removeAllListeners();
        return connectToWhatsApp();
      }

      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n📱 Pairing Code: ${code}`);
        console.log('On your phone:');
        console.log('  1. Go to Settings > Linked Devices');
        console.log('  2. Tap "Link a Device" > "Link with Phone Number"');
        console.log('  3. Enter the code shown above.');
        console.log('\nWaiting for pairing to complete...');
      } catch (error) {
        console.error('Failed to request pairing code:', error);
        sock.ev.removeAllListeners();
        return connectToWhatsApp();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const prefix = '.';
    if (!text.startsWith(prefix)) return;

    const [cmd, ...args] = text.slice(1).trim().split(/\s+/);
    const command = cmd.toLowerCase();

    // Update profile
    updateUserProfile(sender, msg.pushName || 'User');

    // NSFW check (Ensure OWNER_NUMBER is correctly formatted in .env)
    const settings = getSettings();
    const nsfwEnabled = settings[sender]?.nsfw;
    // Admin check for NSFW command
    const isOwner = msg.key.participant === OWNER_NUMBER;

    if (["hentai", "r34", "nude"].includes(command) && !nsfwEnabled) {
      return await sock.sendMessage(sender, { text: 'NSFW is disabled in this group. Use .nsfw on (admin only)' }, { quoted: msg });
    }

    // Commands
    if (command === 'help' || command === 'menu') {
      const helpText = `DavintoMD Command List:\n.ai, .image, .profile, .score, .ping, .stats, .eval, .nsfw on/off, .truth, .math, .reverse, .emojify, .yt <url>, .tiktok <url>, etc.`;
      return await sock.sendMessage(sender, { text: helpText }, { quoted: msg });
    }
    if (command === 'profile') {
      const profiles = getProfiles();
      const profile = profiles[sender];
      return await sock.sendMessage(sender, { text: `👤 ${profile.name}\nMessages: ${profile.count}` }, { quoted: msg });
    }
    if (command === 'nsfw') {
      if (!isGroup) return await sock.sendMessage(sender, { text: 'This command can only be used in groups.' }, { quoted: msg });
      if (!isOwner) return await sock.sendMessage(sender, { text: 'Only the bot owner can enable/disable NSFW.' }, { quoted: msg }); // Added admin check
      const status = args[0];
      if (!settings[sender]) settings[sender] = {};
      settings[sender].nsfw = status === 'on';
      saveSettings(settings);
      return await sock.sendMessage(sender, { text: `NSFW ${status === 'on' ? 'enabled' : 'disabled'}` }, { quoted: msg });
    }
    if (command === 'ai') {
      const prompt = args.join(' ');
      if (!prompt) return sock.sendMessage(sender, { text: 'Usage: .ai <prompt>' }, { quoted: msg });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: 'You are DavintoMD' }, { role: 'user', content: prompt }],
      });
      return await sock.sendMessage(sender, { text: completion.choices[0].message.content.trim() }, { quoted: msg });
    }
    if (command === 'image') {
      const prompt = args.join(' ');
      if (!prompt) return sock.sendMessage(sender, { text: 'Usage: .image <prompt>' }, { quoted: msg });
      const dalle = await openai.images.generate({ prompt, n: 1, size: '512x512' });
      const imageUrl = dalle.data[0].url;
      return await sock.sendMessage(sender, { image: { url: imageUrl }, caption: `🎨 Generated image for: ${prompt}` }, { quoted: msg });
    }
    if (command === 'ping') {
      const t = Date.now();
      await sock.sendMessage(sender, { text: 'Pinging...' });
      return sock.sendMessage(sender, { text: `🏓 Pong: ${Date.now() - t}ms` });
    }
    if (command === 'score') {
      const scores = getScores()[sender] || {};
      const reply = Object.entries(scores).map(([g,v]) => `🎮 ${g}: ${v}`).join('\n') || 'No scores yet.';
      return await sock.sendMessage(sender, { text: reply }, { quoted: msg });
    }
    if (command === 'reverse') {
      const reversed = args.join(' ').split('').reverse().join('');
      return await sock.sendMessage(sender, { text: reversed }, { quoted: msg });
    }
    if (command === 'emojify') {
      const emojified = args.join(' ').split('').map(c => c.match(/[a-zA-Z]/) ? `${c} ` : c).join(' '); // Added space after emoji for better readability
      return await sock.sendMessage(sender, { text: emojified }, { quoted: msg });
    }
    // Added 'eval' admin check based on OWNER_NUMBER
    if (command === 'eval' && msg.key.participant === OWNER_NUMBER) {
      try {
        const out = eval(args.join(' ')); // Be careful with eval in production!
        return sock.sendMessage(sender, { text: `${out}` });
      } catch (e) {
        return sock.sendMessage(sender, { text: `Error: ${e}` });
      }
    }
    if (command === 'yt' || command === 'youtube') {
      return sock.sendMessage(sender, { text: '🚧 YouTube download placeholder. (Feature under development)' }, { quoted: msg });
    }
    if (command === 'tiktok') {
        return sock.sendMessage(sender, { text: '🚧 TikTok download placeholder. (Feature under development)' }, { quoted: msg });
    }

  });
  // Added loadMessages to store binding, if needed
  store.loadMessages = async (jid, count = 20, cursor = null) => {
    const messages = store.messages[jid] || [];
    return {
      messages: messages.slice(cursor ? messages.findIndex(m => m.key.id === cursor.id) : 0, cursor ? undefined : count),
      isEnd: messages.length === 0 || messages.length === (cursor ? messages.findIndex(m => m.key.id === cursor.id) : count)
    };
  };
}

connectToWhatsApp();
             
