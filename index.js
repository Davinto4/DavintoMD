import 'dotenv/config'; // Loads environment variables from .env file
import {
    default as makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    PHONENUMBER_MCC
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import OpenAI from 'openai';
import pino from 'pino';
import readline from 'readline';
import qrcode from 'qrcode-terminal'; // Still useful for initial QR fallback/debugging if needed

// --- OpenAI API Configuration ---
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not set in your .env file.');
    console.error('Please get your API key from platform.openai.com/account/api-keys and add it to .env');
    process.exit(1);
}

// --- DavintoMD Bot Persona ---
const DavintoMDPersona = `You are DavintoMD, a multi-device WhatsApp AI assistant.
Your primary role is to act as a helpful and informative assistant, providing concise and accurate answers.
Maintain a friendly, professional, and slightly formal tone.
You should be empathetic and understanding, especially when dealing with medical or personal inquiries.
Avoid giving definitive medical advice, but rather suggest consulting a healthcare professional or reliable sources.
You can answer questions on a wide range of topics, including general knowledge, simple medical information (non-diagnostic), technology, and daily life.
Keep responses to the point, preferably within 2-4 sentences unless a more detailed explanation is specifically requested or absolutely necessary.
If a question is beyond your scope or requires personal/sensitive information you cannot handle, politely decline and suggest alternative resources.
Do not engage in casual chat, jokes, or personal opinions beyond your programmed persona.
Always prioritize user safety and provide responsible information.`;

// --- In-Memory Store for Baileys (Optional but recommended) ---
// This helps manage chat history and message processing more efficiently.
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

// --- Readline for input (for pairing code) ---
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// --- Main Connection Function ---
async function connectToWhatsApp() {
    console.log('Connecting to WhatsApp...');

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion(); // Corrected: 'is Latest' -> 'isLatest'
    console.log(`Using Baileys version ${version.join('.')} (latest: ${isLatest})`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Set to 'info' for more logs, 'silent' for less
        printQRInTerminal: false, // We'll handle QR/pairing code manually
        auth: state,
        browser: ['DavintoMD', 'Desktop', '3.0'] // Custom browser name
    });

    store.bind(sock.ev); // Bind the store to the socket's event emitter

    // --- Event Handlers ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            // reconnect if not logged out
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                console.log('Logged out. Please delete auth_info_baileys folder and restart to re-authenticate.');
                process.exit(0);
            }
        } else if (connection === 'open') {
            console.log('WhatsApp connection opened!');
        }

        // --- Pairing Code Logic ---
        if (qr) {
            // This is a fallback if phone number pairing fails or isn't used
            console.log('QR code received. You can scan this QR code with your WhatsApp app.');
            qrcode.generate(qr, { small: true });
            console.log('Alternatively, try phone number pairing...');
        }

        if (sock.authState.creds.registered === false) {

            console.log('\n--- Initiating Phone Number Pairing ---');
            let phoneNumber = await question('Please enter your WhatsApp phone number (e.g., 2348012345678): ');
            phoneNumber = phoneNumber.replace(/[^0-9]/g, ''); // Remove non-numeric characters

            if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
                console.log("Please enter a valid phone number with country code. Example: 2348012345678 for Nigeria.");
                sock.ev.removeAllListeners();
                return connectToWhatsApp();
            }

            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\nYour Pairing Code: ${code}`);
                console.log('Open WhatsApp on your phone:');
                console.log('  1. Go to Settings/Linked Devices');
                console.log('  2. Tap "Link a Device"');
                console.log('  3. Tap "Link with Phone Number"');
                console.log('  4. Enter the 8-digit code shown above.');
                console.log('\nWaiting for pairing to complete...');

            } catch (error) {
                console.error('Failed to request pairing code:', error);
                sock.ev.removeAllListeners();
                return connectToWhatsApp(); // Retry connection
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // --- Message Handler ---
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return; // Ignore messages without content
        if (msg.key.fromMe) return; // Ignore messages sent by the bot itself

        const senderId = msg.key.remoteJid;
        const text = msg.message.extendedTextMessage?.text || msg.message.conversation || '';

        console.log(`\nMessage from ${senderId}: ${text}`);

        // Only respond to messages that are not empty and not from a status update
        if (text && !senderId.endsWith('@s.whatsapp.net') && !msg.key.participant) {
            console.log('Generating response...');
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo", // You can try "gpt-4" if you have access and prefer
                    messages: [
                        { role: "system", content: DavintoMDPersona },
                        { role: "user", content: text }
                    ],
                    max_tokens: 150, // Limit response length
                    temperature: 0.7, // Adjust for creativity (0.0 for deterministic, 1.0 for very creative)
                });

                const botResponse = completion.choices[0].message.content.trim();
                console.log(`Bot response: ${botResponse}`);

                await sock.sendMessage(senderId, { text: botResponse }, { quoted: msg });

            } catch (error) {
                console.error('Error generating or sending response:', error);
                if (error.response && error.response.status === 401) {
                    console.error('OpenAI API Key invalid or expired. Please check your .env file.');
                }
                await sock.sendMessage(senderId, { text: "I'm sorry, I'm having trouble processing that right now. Please try again later or check my configuration." }, { quoted: msg });
            }
        }
    });

    // --- Handle incoming messages (for store) ---
    store.loadMessages = async (jid, count = 20, cursor = null) => {
        const messages = store.messages[jid] || [];
        return {
            messages: messages.slice(cursor ? messages.findIndex(m => m.key.id === cursor.id) : 0, cursor ? undefined : count),
            isEnd: messages.length === 0 || messages.length === (cursor ? messages.findIndex(m => m.key.id === cursor.id) : count) // Corrected: 'is End' -> 'isEnd'
        };
    };
}

// Start the bot
connectToWhatsApp();
        
