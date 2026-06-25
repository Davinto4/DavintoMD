const axios = require('axios');
module.exports = {
    name: 'ai',
    aliases: ['gpt', 'ask', 'chat'],
    category: 'ai',
    run: async (sock, msg, args) => {
        const prompt = args.join(' ');
        if (!prompt) return sock.sendMessage(msg.key.remoteJid, { text: '❌ Provide a prompt.' }, { quoted: msg });
        
        try {
            // Placeholder for actual AI API (e.g., OpenAI, Gemini)
            const { data } = await axios.get(`https://api.simsimi.vn/v1/simulate?text=${encodeURIComponent(prompt)}&lc=en`);
            sock.sendMessage(msg.key.remoteJid, { text: `🤖 *DavintoAI:*\n${data.success || 'No response.'}` }, { quoted: msg });
        } catch (e) {
            sock.sendMessage(msg.key.remoteJid, { text: '⚠️ AI service temporarily unavailable.' }, { quoted: msg });
        }
    }
};
